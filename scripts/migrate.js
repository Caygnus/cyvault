#!/usr/bin/env node

import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env' });

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Dynamic schema reader - automatically reads from Drizzle schema files
class DynamicSchemaReader {
    constructor() {
        this.schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema');
    }

    async readSchemaDefinitions() {
        log('📖 Reading Drizzle schema files...', 'blue');

        const schemaFiles = this.getSchemaFiles();
        const schemaDefinitions = {};

        for (const filePath of schemaFiles) {
            try {
                const tableDefinitions = await this.parseSchemaFile(filePath);
                Object.assign(schemaDefinitions, tableDefinitions);
            } catch (error) {
                log(`⚠️  Warning: Could not parse ${filePath}: ${error.message}`, 'yellow');
            }
        }

        log(`✅ Found ${Object.keys(schemaDefinitions).length} table definitions`, 'green');
        return schemaDefinitions;
    }

    getSchemaFiles() {
        const schemaFiles = [];

        if (fs.existsSync(this.schemaPath)) {
            const files = fs.readdirSync(this.schemaPath);
            const tsFiles = files.filter(file =>
                file.endsWith('.ts') &&
                !file.includes('.d.ts') &&
                file !== 'index.ts'
            );

            schemaFiles.push(...tsFiles.map(file => path.join(this.schemaPath, file)));
        }

        return schemaFiles;
    }

    async parseSchemaFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const tableDefinitions = {};

        // Extract table definitions using regex patterns
        const tableMatches = content.match(/export\s+const\s+(\w+)\s*=\s*pgTable\s*\(\s*["']([^"']+)["']\s*,\s*\{([^}]+)\}/gs);

        if (!tableMatches) return tableDefinitions;

        for (const match of tableMatches) {
            const tableSchemaName = match.match(/pgTable\s*\(\s*["']([^"']+)["']/)[1];
            const tableBody = match.match(/pgTable\s*\(\s*["']([^"']+)["']\s*,\s*\{([^}]+)\}/)[2];

            // Parse base model if it exists
            const baseModelColumns = await this.parseBaseModel(content);

            // Parse table-specific columns
            const tableColumns = this.parseColumns(tableBody);

            // Merge base model columns with table columns
            const columns = { ...baseModelColumns, ...tableColumns };

            const indexes = this.parseIndexes(content);
            // Extract constraints from columns (references are now parsed with columns)
            const constraints = this.extractConstraintsFromColumns(columns, tableSchemaName);

            tableDefinitions[tableSchemaName] = {
                columns,
                indexes,
                constraints
            };
        }

        return tableDefinitions;
    }

    async parseBaseModel(content) {
        const baseModelColumns = {};

        // Check if this file imports baseModel
        if (content.includes('baseModel')) {
            const baseModelPath = path.join(this.schemaPath, 'base.ts');
            if (fs.existsSync(baseModelPath)) {
                const baseContent = fs.readFileSync(baseModelPath, 'utf8');

                // Extract baseModel definition - handle both with and without "as const"
                const baseModelMatch = baseContent.match(/export\s+const\s+baseModel\s*=\s*\{([\s\S]+?)\}\s*(?:as\s+const)?/);
                if (baseModelMatch) {
                    const baseModelBody = baseModelMatch[1];
                    const baseColumns = this.parseColumns(baseModelBody);
                    Object.assign(baseModelColumns, baseColumns);
                }
            }
        }

        return baseModelColumns;
    }

    parseColumns(tableBody) {
        const columns = {};

        // Parse columns by splitting on commas, but respect nested parentheses
        // This handles cases like .references(() => users.id)
        let depth = 0;
        let currentColumn = '';

        for (let i = 0; i < tableBody.length; i++) {
            const char = tableBody[i];

            if (char === '(') {
                depth++;
                currentColumn += char;
            } else if (char === ')') {
                depth--;
                currentColumn += char;
            } else if (char === ',' && depth === 0) {
                // End of column definition
                if (currentColumn.trim()) {
                    // Skip spread operators like ...baseModel
                    if (!currentColumn.trim().startsWith('...')) {
                        const match = currentColumn.trim().match(/^(\w+):\s*(.+)$/);
                        if (match) {
                            const [, camelCaseName, columnDef] = match;

                            // Extract the actual database column name from the Drizzle definition
                            const dbNameMatch = columnDef.match(/text\("([^"]+)"\)|timestamp\("([^"]+)"\)|jsonb\("([^"]+)"\)|integer\("([^"]+)"\)|boolean\("([^"]+)"\)/);
                            const dbColumnName = dbNameMatch ? (dbNameMatch[1] || dbNameMatch[2] || dbNameMatch[3] || dbNameMatch[4] || dbNameMatch[5]) : camelCaseName;

                            const columnInfo = this.parseColumnDefinition(columnDef.trim());
                            if (columnInfo) {
                                columns[dbColumnName] = columnInfo;
                            }
                        }
                    }
                }
                currentColumn = '';
            } else {
                currentColumn += char;
            }
        }

        // Handle last column (no trailing comma)
        if (currentColumn.trim() && !currentColumn.trim().startsWith('...')) {
            const match = currentColumn.trim().match(/^(\w+):\s*(.+)$/);
            if (match) {
                const [, camelCaseName, columnDef] = match;

                const dbNameMatch = columnDef.match(/text\("([^"]+)"\)|timestamp\("([^"]+)"\)|jsonb\("([^"]+)"\)|integer\("([^"]+)"\)|boolean\("([^"]+)"\)/);
                const dbColumnName = dbNameMatch ? (dbNameMatch[1] || dbNameMatch[2] || dbNameMatch[3] || dbNameMatch[4] || dbNameMatch[5]) : camelCaseName;

                const columnInfo = this.parseColumnDefinition(columnDef.trim());
                if (columnInfo) {
                    columns[dbColumnName] = columnInfo;
                }
            }
        }

        return columns;
    }

    parseColumnDefinition(columnDef) {
        // Handle different column types and modifiers
        const info = {
            type: 'text',
            nullable: true,
            primaryKey: false,
            unique: false,
            defaultValue: null,
            reference: null // Add reference info
        };

        // Extract type - handle Drizzle syntax like text("column_name")
        if (columnDef.includes('text(')) {
            info.type = 'text';
        } else if (columnDef.includes('timestamp(')) {
            info.type = 'timestamp';
        } else if (columnDef.includes('integer(')) {
            info.type = 'integer';
        } else if (columnDef.includes('boolean(')) {
            info.type = 'boolean';
        } else if (columnDef.includes('jsonb(')) {
            info.type = 'jsonb';
        }

        // Extract modifiers - handle Drizzle method chaining
        if (columnDef.includes('.notNull()')) {
            info.nullable = false;
        }

        if (columnDef.includes('.primaryKey()')) {
            info.primaryKey = true;
            info.nullable = false;
        }

        if (columnDef.includes('.unique()')) {
            info.unique = true;
        }

        // Extract references - handle nested parentheses properly
        // Match .references(() => tableName.columnName) with proper nesting
        const refMatch = columnDef.match(/\.references\s*\(\s*\(\)\s*=>\s*(\w+)\.(\w+)\s*\)/);
        if (refMatch) {
            info.reference = {
                table: refMatch[1],
                column: refMatch[2]
            };
        }

        // Extract default values - handle different default types
        const defaultMatch = columnDef.match(/\.default\(([^)]+)\)/);
        if (defaultMatch) {
            let defaultValue = defaultMatch[1];

            // Handle EntityStatus.PUBLISHED
            if (defaultValue.includes('EntityStatus.PUBLISHED')) {
                info.defaultValue = "'PUBLISHED'";
            }
            // Handle defaultNow()
            else if (defaultValue.includes('defaultNow()')) {
                info.defaultValue = 'now()';
            }
            // Handle string literals
            else if (defaultValue.startsWith('"') && defaultValue.endsWith('"')) {
                // Convert double quotes to single quotes for SQL
                info.defaultValue = defaultValue.replace(/"/g, "'");
            }
            // Handle empty string
            else if (defaultValue === '""') {
                info.defaultValue = "''";
            }
            // Handle empty object for jsonb (default({}))
            else if (defaultValue === '{}' || defaultValue.trim() === '{}') {
                info.defaultValue = "'{}'::jsonb";
            }
            else {
                info.defaultValue = defaultValue;
            }
        }

        return info;
    }

    parseIndexes(content) {
        const indexes = [];

        // Look for index definitions in the file
        const indexMatches = content.match(/CREATE\s+INDEX[^;]+/gi);
        if (indexMatches) {
            for (const indexMatch of indexMatches) {
                const nameMatch = indexMatch.match(/CREATE\s+INDEX\s+["']?(\w+)["']?/i);
                const columnsMatch = indexMatch.match(/ON\s+["']?(\w+)["']?\s*\(([^)]+)\)/i);

                if (nameMatch && columnsMatch) {
                    indexes.push({
                        name: nameMatch[1],
                        columns: columnsMatch[2].split(',').map(col => col.trim().replace(/['"]/g, ''))
                    });
                }
            }
        }

        return indexes;
    }

    extractConstraintsFromColumns(columns, tableSchemaName) {
        const constraints = [];

        // Extract foreign key constraints from columns that have references
        for (const [columnName, columnDef] of Object.entries(columns)) {
            if (columnDef.reference) {
                const refTable = columnDef.reference.table;
                const refColumn = columnDef.reference.column;

                // Generate constraint name: tableName_columnName_refTable_fk
                const constraintName = `${tableSchemaName}_${columnName}_${refTable}_fk`;

                constraints.push({
                    name: constraintName,
                    type: 'FOREIGN KEY',
                    columns: [columnName],
                    references: { table: refTable, column: refColumn },
                    onDelete: 'no action',
                    onUpdate: 'no action'
                });
            }
        }

        return constraints;
    }
}

class DatabaseMigrator {
    constructor() {
        this.sql = postgres(process.env.DATABASE_URL);
        this.changes = [];
        this.schemaReader = new DynamicSchemaReader();
    }

    async getCurrentSchema() {
        const tables = {};

        // Get all tables from the database
        const allTables = await this.sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;

        for (const table of allTables) {
            const tableName = table.table_name;
            // Get table columns
            const columns = await this.sql`
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length
                FROM information_schema.columns 
                WHERE table_name = ${tableName} AND table_schema = 'public'
                ORDER BY ordinal_position
            `;

            if (columns.length > 0) {
                tables[tableName] = {
                    columns: columns.reduce((acc, col) => {
                        acc[col.column_name] = {
                            type: col.data_type,
                            nullable: col.is_nullable === 'YES',
                            defaultValue: col.column_default,
                            maxLength: col.character_maximum_length
                        };
                        return acc;
                    }, {}),
                    indexes: await this.getTableIndexes(tableName),
                    constraints: await this.getTableConstraints(tableName)
                };
            }
        }

        return tables;
    }

    async getTableIndexes(tableName) {
        const indexes = await this.sql`
            SELECT 
                indexname,
                indexdef
            FROM pg_indexes 
            WHERE tablename = ${tableName} AND schemaname = 'public'
        `;

        return indexes.map(idx => ({
            name: idx.indexname,
            definition: idx.indexdef
        }));
    }

    async getTableConstraints(tableName) {
        const constraints = await this.sql`
            SELECT 
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule,
                rc.update_rule
            FROM information_schema.table_constraints AS tc 
            LEFT JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            LEFT JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            LEFT JOIN information_schema.referential_constraints AS rc
                ON tc.constraint_name = rc.constraint_name
                AND tc.table_schema = rc.constraint_schema
            WHERE tc.table_name = ${tableName} AND tc.table_schema = 'public'
        `;

        return constraints.map(constraint => ({
            name: constraint.constraint_name,
            type: constraint.constraint_type,
            column: constraint.column_name,
            foreignTable: constraint.foreign_table_name,
            foreignColumn: constraint.foreign_column_name,
            onDelete: constraint.delete_rule,
            onUpdate: constraint.update_rule
        }));
    }

    async detectChanges() {
        log('🔍 Detecting schema changes...', 'blue');

        // Read schema definitions dynamically from Drizzle files
        const SCHEMA_DEFINITIONS = await this.schemaReader.readSchemaDefinitions();

        const currentSchema = await this.getCurrentSchema();
        const changes = [];

        for (const [tableName, expectedSchema] of Object.entries(SCHEMA_DEFINITIONS)) {
            const currentTable = currentSchema[tableName];

            if (!currentTable) {
                // Table doesn't exist - needs to be created
                changes.push({
                    type: 'CREATE_TABLE',
                    table: tableName,
                    schema: expectedSchema
                });
                continue;
            }

            // Check for missing columns
            for (const [columnName, columnDef] of Object.entries(expectedSchema.columns)) {
                if (!currentTable.columns[columnName]) {
                    changes.push({
                        type: 'ADD_COLUMN',
                        table: tableName,
                        column: columnName,
                        definition: columnDef
                    });
                } else {
                    // Check for column modifications
                    const currentCol = currentTable.columns[columnName];
                    if (this.hasColumnChanged(currentCol, columnDef)) {
                        changes.push({
                            type: 'MODIFY_COLUMN',
                            table: tableName,
                            column: columnName,
                            current: currentCol,
                            expected: columnDef
                        });
                    }
                }
            }

            // Check for columns that exist in DB but not in schema (should be dropped)
            for (const [columnName, columnDef] of Object.entries(currentTable.columns)) {
                if (!expectedSchema.columns[columnName]) {
                    // Skip system columns that shouldn't be dropped
                    if (columnName === 'id' || columnName === 'created_at' || columnName === 'updated_at') {
                        continue;
                    }
                    changes.push({
                        type: 'DROP_COLUMN',
                        table: tableName,
                        column: columnName
                    });
                }
            }

            // Check for missing indexes
            for (const expectedIndex of expectedSchema.indexes) {
                const existingIndex = currentTable.indexes.find(idx =>
                    idx.name === expectedIndex.name
                );
                if (!existingIndex) {
                    changes.push({
                        type: 'CREATE_INDEX',
                        table: tableName,
                        index: expectedIndex
                    });
                }
            }

            // Check for missing constraints
            for (const expectedConstraint of expectedSchema.constraints) {
                const existingConstraint = currentTable.constraints.find(con =>
                    con.name === expectedConstraint.name
                );
                if (!existingConstraint) {
                    changes.push({
                        type: 'ADD_CONSTRAINT',
                        table: tableName,
                        constraint: expectedConstraint
                    });
                }
            }

            // Check for constraints that exist in DB but not in schema (should be dropped)
            for (const existingConstraint of currentTable.constraints) {
                // Check if this constraint references a column that no longer exists
                const columnStillExists = existingConstraint.column
                    ? expectedSchema.columns[existingConstraint.column]
                    : true;

                if (!columnStillExists) {
                    changes.push({
                        type: 'DROP_CONSTRAINT',
                        table: tableName,
                        constraint: existingConstraint
                    });
                } else {
                    // Check if constraint exists in expected schema
                    const constraintExists = expectedSchema.constraints.find(con =>
                        con.name === existingConstraint.name
                    );
                    if (!constraintExists && existingConstraint.type === 'FOREIGN KEY') {
                        changes.push({
                            type: 'DROP_CONSTRAINT',
                            table: tableName,
                            constraint: existingConstraint
                        });
                    }
                }
            }
        }

        this.changes = changes;
        return changes;
    }

    hasColumnChanged(current, expected) {
        // Normalize types for comparison
        const normalizeType = (type) => {
            const typeMap = {
                'character varying': 'text',
                'varchar': 'text',
                'timestamp without time zone': 'timestamp',
                'timestamp with time zone': 'timestamp',
                'jsonb': 'jsonb' // Explicitly include jsonb
            };
            return typeMap[type] || type;
        };

        const normalizedCurrentType = normalizeType(current.type);
        const normalizedExpectedType = normalizeType(expected.type);

        // Check type
        if (normalizedCurrentType !== normalizedExpectedType) {
            log(`Type mismatch: ${normalizedCurrentType} vs ${normalizedExpectedType}`, 'yellow');
            return true;
        }

        // Check nullable
        if (current.nullable !== expected.nullable) {
            log(`Nullable mismatch: ${current.nullable} vs ${expected.nullable}`, 'yellow');
            return true;
        }

        // Check default value (normalize for comparison)
        const normalizeDefault = (defaultValue) => {
            if (!defaultValue) return null;
            // Remove quotes, type casts, and normalize common defaults
            let normalized = defaultValue
                .replace(/::\w+$/g, '') // Remove type casts like ::text first
                .replace(/^['"]|['"]$/g, '') // Remove quotes
                .toLowerCase()
                .trim();

            // Handle empty string cases
            if (normalized === '' || normalized === "''" || normalized === '""') {
                return '';
            }

            return normalized;
        };

        const currentDefault = normalizeDefault(current.defaultValue);
        const expectedDefault = normalizeDefault(expected.defaultValue);

        // Skip if both are effectively empty/null
        if ((!currentDefault || currentDefault === 'null' || currentDefault === '') &&
            (!expectedDefault || expectedDefault === 'null' || expectedDefault === '')) {
            return false;
        }

        // Skip if both are effectively now() (timestamp defaults)
        if ((currentDefault === 'now()' || currentDefault === 'null') && expectedDefault === 'now()') {
            return false;
        }

        // Skip if current is now() and expected is null (both are valid timestamp defaults)
        if (currentDefault === 'now()' && (!expectedDefault || expectedDefault === 'null')) {
            return false;
        }

        // Skip if both are effectively {} (jsonb defaults)
        // Handle both '{}' and '{}'::jsonb formats
        const isJsonbEmpty = (val) => {
            const cleaned = val.replace(/['"]/g, '').replace(/::jsonb/i, '').trim();
            return cleaned === '{}';
        };
        if (isJsonbEmpty(currentDefault || '') && isJsonbEmpty(expectedDefault || '')) {
            return false;
        }

        // Skip if both are effectively the same after normalization
        if (currentDefault === expectedDefault) {
            return false;
        }

        // Skip minor formatting differences
        if (currentDefault && expectedDefault) {
            const cleanCurrent = currentDefault.replace(/['"]/g, '');
            const cleanExpected = expectedDefault.replace(/['"]/g, '');
            if (cleanCurrent === cleanExpected) {
                return false;
            }
        }

        log(`Default mismatch: ${currentDefault} vs ${expectedDefault}`, 'yellow');
        return true;
    }

    async applyChanges() {
        if (this.changes.length === 0) {
            log('✅ No changes detected. Database is up to date.', 'green');
            return;
        }

        log(`📝 Found ${this.changes.length} changes to apply:`, 'blue');
        this.changes.forEach((change, index) => {
            log(`  ${index + 1}. ${change.type} on ${change.table}${change.column ? ` (${change.column})` : ''}`, 'yellow');
        });

        log('\n🚀 Applying changes...', 'blue');

        for (const change of this.changes) {
            try {
                await this.applyChange(change);
                log(`✅ Applied: ${change.type} on ${change.table}${change.column ? ` (${change.column})` : ''}`, 'green');
            } catch (error) {
                log(`❌ Failed to apply ${change.type} on ${change.table}: ${error.message}`, 'red');
                throw error;
            }
        }

        log('\n🎉 All changes applied successfully!', 'green');
    }

    async applyChange(change) {
        switch (change.type) {
            case 'CREATE_TABLE':
                await this.createTable(change.table, change.schema);
                break;
            case 'ADD_COLUMN':
                await this.addColumn(change.table, change.column, change.definition);
                break;
            case 'MODIFY_COLUMN':
                await this.modifyColumn(change.table, change.column, change.expected);
                break;
            case 'CREATE_INDEX':
                await this.createIndex(change.table, change.index);
                break;
            case 'ADD_CONSTRAINT':
                await this.addConstraint(change.table, change.constraint);
                break;
            case 'DROP_COLUMN':
                await this.dropColumn(change.table, change.column);
                break;
            case 'DROP_CONSTRAINT':
                await this.dropConstraint(change.table, change.constraint);
                break;
        }
    }

    async createTable(tableName, schema) {
        const columns = Object.entries(schema.columns)
            .map(([name, def]) => {
                let colDef = `"${name}" ${def.type}`;
                if (def.primaryKey) colDef += ' PRIMARY KEY';
                if (!def.nullable) colDef += ' NOT NULL';
                if (def.defaultValue) colDef += ` DEFAULT ${def.defaultValue}`;
                if (def.unique) colDef += ' UNIQUE';
                return colDef;
            })
            .join(', ');

        await this.sql.unsafe(`CREATE TABLE "${tableName}" (${columns})`);
    }

    async addColumn(tableName, columnName, definition) {
        // Check if table has existing data
        const rowCount = await this.sql.unsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const hasData = parseInt(rowCount[0].count) > 0;

        let colDef = `"${columnName}" ${definition.type}`;

        // Debug logging
        log(`🔍 Adding column: ${columnName}, definition:`, 'blue');
        log(`   Type: ${definition.type}, Nullable: ${definition.nullable}, Default: ${definition.defaultValue}`, 'blue');

        // If column is NOT NULL and table has data, add it as nullable first, then update
        if (!definition.nullable && hasData) {
            log(`⚠️  Adding NOT NULL column to table with data - adding as nullable first`, 'yellow');
            colDef += ' NULL'; // Add as nullable first
            if (definition.defaultValue) colDef += ` DEFAULT ${definition.defaultValue}`;

            await this.sql.unsafe(`ALTER TABLE "${tableName}" ADD COLUMN ${colDef}`);

            // Update existing rows with default value
            if (definition.defaultValue) {
                await this.sql.unsafe(`UPDATE "${tableName}" SET "${columnName}" = ${definition.defaultValue} WHERE "${columnName}" IS NULL`);
            }

            // Now make it NOT NULL
            await this.sql.unsafe(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" SET NOT NULL`);
        } else {
            // Normal case - no existing data or nullable column
            if (!definition.nullable) colDef += ' NOT NULL';
            if (definition.defaultValue) colDef += ` DEFAULT ${definition.defaultValue}`;
            if (definition.unique) colDef += ' UNIQUE';

            await this.sql.unsafe(`ALTER TABLE "${tableName}" ADD COLUMN ${colDef}`);
        }
    }

    async modifyColumn(tableName, columnName, _definition) {
        // PostgreSQL doesn't support direct column modification in all cases
        // This is a simplified version - might need more complex logic for production
        log(`⚠️  Column modification for ${tableName}.${columnName} - manual review recommended`, 'yellow');
    }

    async createIndex(tableName, index) {
        const columns = index.columns.join(', ');
        await this.sql.unsafe(`CREATE INDEX IF NOT EXISTS "${index.name}" ON "${tableName}" (${columns})`);
    }

    async addConstraint(tableName, constraint) {
        if (constraint.type === 'FOREIGN KEY') {
            const columns = constraint.columns.join(', ');
            const refTable = constraint.references.table;
            const refColumn = constraint.references.column;
            const onDelete = constraint.onDelete || 'no action';
            const onUpdate = constraint.onUpdate || 'no action';

            await this.sql.unsafe(`
                ALTER TABLE "${tableName}" 
                ADD CONSTRAINT "${constraint.name}" 
                FOREIGN KEY (${columns}) 
                REFERENCES "${refTable}"("${refColumn}") 
                ON DELETE ${onDelete} ON UPDATE ${onUpdate}
            `);
        }
    }

    async dropConstraint(tableName, constraint) {
        await this.sql.unsafe(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraint.name}"`);
    }

    async dropColumn(tableName, columnName) {
        // First, drop any foreign key constraints that reference this column
        const constraints = await this.getTableConstraints(tableName);
        for (const constraint of constraints) {
            if (constraint.column === columnName && constraint.type === 'FOREIGN KEY') {
                log(`⚠️  Dropping foreign key constraint ${constraint.name} before dropping column ${columnName}`, 'yellow');
                await this.dropConstraint(tableName, constraint);
            }
        }

        // Now drop the column
        await this.sql.unsafe(`ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${columnName}"`);
    }

    async close() {
        await this.sql.end();
    }
}

async function main() {
    log(`${colors.bold}🚀 Database Migration${colors.reset}`, 'blue');
    log('========================', 'blue');
    log('Automatically detects and applies schema changes from your Drizzle files', 'blue');

    const migrator = new DatabaseMigrator();

    try {
        // Check if DATABASE_URL is set
        if (!process.env.DATABASE_URL) {
            throw new Error('❌ DATABASE_URL not found in .env');
        }

        // Detect changes
        const changes = await migrator.detectChanges();

        if (changes.length === 0) {
            log('✅ No changes detected. Database is up to date.', 'green');
            return;
        }

        // Show preview
        log('\n📋 Changes to be applied:', 'yellow');
        changes.forEach((change, index) => {
            log(`  ${index + 1}. ${change.type} on ${change.table}${change.column ? ` (${change.column})` : ''}`, 'yellow');
        });

        // Apply changes
        await migrator.applyChanges();

    } catch (error) {
        log(`\n💥 Migration failed: ${error.message}`, 'red');
        process.exit(1);
    } finally {
        await migrator.close();
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    log('\n\n⚠️  Migration cancelled by user', 'yellow');
    process.exit(0);
});

// Run the script
main();
