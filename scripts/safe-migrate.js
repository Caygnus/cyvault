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

    // Check if .env.local exists
    if (!fs.existsSync('.env')) {
        throw new Error('❌ .env file not found. Please create it with DATABASE_URL');
    }

    // Check if DATABASE_URL is set       
    dotenv.config({ path: '.env' });
    if (!process.env.DATABASE_URL) {
        throw new Error('❌ DATABASE_URL not found in .env');
    }

    log('✅ Environment check passed', 'green');
}

function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backups/migration-${timestamp}`;

    log(`📦 Creating backup in ${backupDir}...`, 'blue');

    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });

    // Export current database schema
    try {
        execCommand('npm run db:export', 'Exporting current schema');

        // Move exported files to backup directory
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

    // Check if schema files exist
    const schemaPath = 'src/core/db/schema';
    if (!fs.existsSync(schemaPath)) {
        throw new Error('❌ Schema directory not found');
    }

    // Check for TypeScript compilation errors
    try {
        execCommand('npx tsc --noEmit', 'Type checking schema');
        log('✅ Schema validation passed', 'green');
    } catch (error) {
        log('❌ Schema validation failed. Please fix TypeScript errors first.', 'red');
        throw error;
    }
}

function generateMigration() {
    log('📝 Generating migration...', 'blue');

    try {
        execCommand('npm run db:generate', 'Generating migration files');

        // Check if migration files were created
        const drizzleDir = 'drizzle';
        if (fs.existsSync(drizzleDir)) {
            const files = fs.readdirSync(drizzleDir);
            const sqlFiles = files.filter(f => f.endsWith('.sql'));
            if (sqlFiles.length > 0) {
                log(`✅ Generated ${sqlFiles.length} migration file(s)`, 'green');
                return sqlFiles;
            }
        }

        log('ℹ️  No new migrations to generate', 'blue');
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
        const sqlFiles = files.filter(f => f.endsWith('.sql'));

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
        execCommand('npm run db:migrate', 'Applying migration to database');
        log('✅ Migration applied successfully', 'green');
    } catch (error) {
        log('❌ Migration failed', 'red');
        throw error;
    }
}

function rollbackMigration(backupDir) {
    log('🔄 Rolling back migration...', 'yellow');

    if (backupDir && fs.existsSync(backupDir)) {
        log('📦 Backup available for rollback', 'blue');
        // In a real implementation, you'd restore from backup here
        log('⚠️  Manual rollback required. Check backup directory.', 'yellow');
    } else {
        log('⚠️  No backup available for automatic rollback', 'yellow');
    }
}

async function main() {
    log(`${colors.bold}🛡️  Safe Migration Script${colors.reset}`, 'blue');
    log('================================', 'blue');

    let backupDir = null;

    try {
        // Step 1: Environment check
        checkEnvironment();

        // Step 2: Create backup
        backupDir = createBackup();

        // Step 3: Validate schema
        validateSchema();

        // Step 4: Generate migration
        const migrationFiles = generateMigration();

        if (migrationFiles.length === 0) {
            log('ℹ️  No migrations to apply. Exiting.', 'blue');
            return;
        }

        // Step 5: Preview migration
        previewMigration();

        // Step 6: Confirm before applying
        log('\n⚠️  Ready to apply migration. This will modify your database.', 'yellow');
        log('Press Ctrl+C to cancel, or wait 5 seconds to continue...', 'yellow');

        // Wait 5 seconds for user to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 7: Apply migration
        applyMigration();

        log('\n🎉 Migration completed successfully!', 'green');

    } catch (error) {
        log(`\n💥 Migration failed: ${error.message}`, 'red');

        // Attempt rollback
        rollbackMigration(backupDir);

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
