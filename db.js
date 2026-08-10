const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function setupDatabase() {
    const db = await open({
        filename: path.join(__dirname, 'bloodlink.db'),
        driver: sqlite3.Database
    });

    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            blood_group TEXT NOT NULL,
            location TEXT NOT NULL,
            is_available INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    
    await db.exec(`
        CREATE TABLE IF NOT EXISTS blood_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_name TEXT NOT NULL,
            blood_group TEXT NOT NULL,
            bags_needed INTEGER NOT NULL,
            bags_collected INTEGER DEFAULT 0,
            hospital_location TEXT NOT NULL,
            urgency TEXT DEFAULT 'Urgent',
            contact_number TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ SQLite Database Connected & Tables Ready!');
    return db;
}

module.exports = setupDatabase;