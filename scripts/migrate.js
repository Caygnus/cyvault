#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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

function execCommand(command, description) {
    log(`\n${colors.blue}→ ${description}...${colors.reset}`);
    try {
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        log(`✅ ${description} completed`, 'green');
        return output;
    } catch (error) {
        log(`❌ ${description} failed: ${error.message}`, 'red');
        throw error;
    }
}

function checkEnvironment() {
    log('🔍 Checking environment...', 'blue');

    if (!fs.existsSync('.env')) {
        throw new Error('❌ .env file not found. Please create it with DATABASE_URL');
    }

    dotenv.config({ path: '.env' });
    if (!process.env.DATABASE_URL) {
        throw new Error('❌ DATABASE_URL not found in .env');
    }

    log('✅ Environment check passed', 'green');
}

function generateIncrementalMigration() {
    log('📝 Generating incremental migration...', 'blue');

    try {
        execCommand('npx drizzle-kit generate', 'Generating migration files');

        const drizzleDir = 'drizzle';
        if (fs.existsSync(drizzleDir)) {
            const files = fs.readdirSync(drizzleDir);
            const sqlFiles = files.filter(f => f.endsWith('.sql') && !f.includes('fix_'));

            if (sqlFiles.length > 0) {
                log(`✅ Generated ${sqlFiles.length} incremental migration file(s)`, 'green');
                return sqlFiles;
            }
        }

        log('ℹ️  No new migrations needed', 'blue');
        return [];
    } catch (error) {
        log('❌ Migration generation failed', 'red');
        throw error;
    }
}

function previewMigration() {
    log('👀 Previewing migration...', 'blue');

    const drizzleDir = 'drizzle';
    if (fs.existsSync(drizzleDir)) {
        const files = fs.readdirSync(drizzleDir);
        const sqlFiles = files.filter(f => f.endsWith('.sql') && !f.includes('fix_'));

        if (sqlFiles.length > 0) {
            log('📄 Migration files to be applied:', 'yellow');
            sqlFiles.forEach(file => {
                const filePath = path.join(drizzleDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                log(`\n--- ${file} ---`, 'yellow');
                console.log(content);
                log('--- End ---\n', 'yellow');
            });
        }
    }
}

function applyMigration() {
    log('🚀 Applying migration...', 'blue');

    try {
        execCommand('npx drizzle-kit migrate', 'Applying migration to database');
        log('✅ Migration applied successfully', 'green');
    } catch (error) {
        log('❌ Migration failed', 'red');
        throw error;
    }
}

function directPush() {
    log('🔄 Using direct push instead of migration...', 'blue');

    try {
        execCommand('npx drizzle-kit push', 'Pushing schema directly to database');
        log('✅ Schema pushed successfully', 'green');
    } catch (error) {
        log('❌ Direct push failed', 'red');
        throw error;
    }
}

function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backups/smart-migration-${timestamp}`;

    log(`📦 Creating backup in ${backupDir}...`, 'blue');

    fs.mkdirSync(backupDir, { recursive: true });

    try {
        execCommand('npx drizzle-kit export', 'Exporting current schema');

        if (fs.existsSync('drizzle/export')) {
            fs.cpSync('drizzle/export', `${backupDir}/schema`, { recursive: true });
        }

        log(`✅ Backup created at ${backupDir}`, 'green');
        return backupDir;
    } catch (error) {
        log(`⚠️  Backup creation failed, but continuing...`, 'yellow');
        return null;
    }
}

function validateSchema() {
    log('🔍 Validating schema...', 'blue');

    const schemaPath = 'src/core/db/schema';
    if (!fs.existsSync(schemaPath)) {
        throw new Error('❌ Schema directory not found');
    }

    try {
        execCommand('npx tsc --noEmit', 'Type checking schema');
        log('✅ Schema validation passed', 'green');
    } catch (error) {
        log('❌ Schema validation failed. Please fix TypeScript errors first.', 'red');
        throw error;
    }
}

async function main() {
    log(`${colors.bold}🚀 Migration Script${colors.reset}`, 'blue');
    log('================================', 'blue');
    log('This script applies schema changes with automatic fallback', 'blue');
    log('✨ Always use: npm run db:migrate', 'green');

    let backupDir = null;

    try {
        // Step 1: Environment check
        checkEnvironment();

        // Step 2: Create backup
        backupDir = createBackup();

        // Step 3: Validate schema
        validateSchema();

        // Step 4: Generate migration
        const migrationFiles = generateIncrementalMigration();

        if (migrationFiles.length === 0) {
            log('ℹ️  No migrations to apply. Database is up to date.', 'blue');
            return;
        }

        // Step 5: Check if migration is just creating existing table
        const hasCreateTable = migrationFiles.some(file => {
            const filePath = path.join('drizzle', file);
            const content = fs.readFileSync(filePath, 'utf8');
            return content.includes('CREATE TABLE "users"');
        });

        if (hasCreateTable) {
            log('⚠️  Migration would create existing table, using direct push instead...', 'yellow');
            log('This avoids the "relation already exists" error.', 'yellow');

            try {
                directPush();
                log('\n🎉 Direct push completed successfully!', 'green');
                log('✨ Schema changes have been applied to your database.', 'green');
                return;
            } catch (pushError) {
                log('\n💥 Direct push failed', 'red');
                throw pushError;
            }
        }

        // Step 6: Preview migration
        previewMigration();

        // Step 7: Confirm before applying
        log('\n⚠️  Ready to apply changes.', 'yellow');
        log('This will modify your database with the changes from your schema.', 'yellow');
        log('Press Ctrl+C to cancel, or wait 5 seconds to continue...', 'yellow');

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 8: Try migration first, fallback to direct push
        try {
            applyMigration();
            log('\n🎉 Migration completed successfully!', 'green');
            log('✨ Schema changes were applied to your database.', 'green');
        } catch (migrationError) {
            log('\n⚠️  Migration failed, trying direct push...', 'yellow');
            log('This is common when introspection doesn\'t detect existing tables properly.', 'yellow');

            try {
                directPush();
                log('\n🎉 Direct push completed successfully!', 'green');
                log('✨ Schema changes have been applied to your database.', 'green');
            } catch (pushError) {
                log('\n💥 Both migration and direct push failed', 'red');
                throw pushError;
            }
        }

    } catch (error) {
        log(`\n💥 Migration failed: ${error.message}`, 'red');

        if (backupDir && fs.existsSync(backupDir)) {
            log('📦 Backup available for rollback', 'blue');
            log('⚠️  Manual rollback required. Check backup directory.', 'yellow');
        }

        process.exit(1);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    log('\n\n⚠️  Migration cancelled by user', 'yellow');
    process.exit(0);
});

// Run the script
main();
