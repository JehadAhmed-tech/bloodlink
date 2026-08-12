const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function setupDatabase() {
    const db = await open({
        filename: path.join(__dirname, 'bloodlink.db'),
        driver: sqlite3.Database
    });

    // Users Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            blood_group TEXT,
            location TEXT,
            phone TEXT
        )
    `);

    // Add phone column to old databases if it does not exist
try {
    await db.exec(`ALTER TABLE users ADD COLUMN phone TEXT`);
} catch (err) {
    if (!err.message.includes('duplicate column name')) {
        throw err;
    }
}

    // Blood Requests Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS blood_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_name TEXT,
            blood_group TEXT,
            hospital_location TEXT,
            contact_number TEXT,
            bags_needed INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}

module.exports = setupDatabase;