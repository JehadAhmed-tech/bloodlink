const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function addColumnIfMissing(db, table, column, definition) {
    try {
        await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (err) {
        if (!/duplicate column name/i.test(err.message)) throw err;
    }
}

async function setupDatabase() {
    const db = await open({
        filename: path.join(__dirname, 'bloodlink.db'),
        driver: sqlite3.Database
    });

    // Users table. The extra columns keep compatibility with older BloodLink DBs.
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            blood_group TEXT NOT NULL,
            location TEXT DEFAULT 'N/A',
            phone TEXT DEFAULT 'N/A',
            is_available INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Safe migrations for an existing bloodlink.db.
    await addColumnIfMissing(db, 'users', 'phone', "TEXT DEFAULT 'N/A'");
    await addColumnIfMissing(db, 'users', 'is_available', 'INTEGER DEFAULT 1');
    await addColumnIfMissing(db, 'users', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

    // Blood requests table.
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

    await addColumnIfMissing(db, 'blood_requests', 'bags_collected', 'INTEGER DEFAULT 0');
    await addColumnIfMissing(db, 'blood_requests', 'urgency', "TEXT DEFAULT 'Urgent'");
    await addColumnIfMissing(db, 'blood_requests', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

    // Responses are persisted so Respond is not just a visual button.
    await db.exec(`
        CREATE TABLE IF NOT EXISTS donation_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER NOT NULL,
            donor_id INTEGER,
            status TEXT DEFAULT 'Responded',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(request_id, donor_id)
        )
    `);

    return db;
}

module.exports = setupDatabase;
