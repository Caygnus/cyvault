#!/usr/bin/env node

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

function listBackups() {
    log('📦 Available backups:', 'blue');

    const backupsDir = 'backups';
    if (!fs.existsSync(backupsDir)) {
        log('❌ No backups directory found', 'red');
        return [];
    }

    const backups = fs.readdirSync(backupsDir)
        .filter(item => {
            const itemPath = path.join(backupsDir, item);
            return fs.statSync(itemPath).isDirectory();
        })
        .sort()
        .reverse(); // Most recent first

    if (backups.length === 0) {
        log('❌ No backups found', 'red');
        return [];
    }

    backups.forEach((backup, index) => {
        const backupPath = path.join(backupsDir, backup);
        const stats = fs.statSync(backupPath);
        const date = stats.mtime.toLocaleString();
        log(`${index + 1}. ${backup} (${date})`, 'yellow');
    });

    return backups;
}

async function main() {
    log(`${colors.bold}🔄 Database Rollback Tool${colors.reset}`, 'blue');
    log('================================', 'blue');

    const backups = listBackups();

    if (backups.length === 0) {
        process.exit(1);
    }

    log('\n⚠️  Manual rollback required:', 'yellow');
    log('1. Stop your application', 'yellow');
    log('2. Restore database from backup', 'yellow');
    log('3. Restart your application', 'yellow');
    log('\nFor automated rollback, implement database-specific restore commands.', 'blue');
}

main();
