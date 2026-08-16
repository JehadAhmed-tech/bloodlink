const express = require('express');
const path = require('path');
const setupDatabase = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let db;

function requireDb(req, res, next) {
    if (!db) return res.status(503).json({ success: false, message: 'Database is starting. Please try again.' });
    next();
}

app.use('/api', requireDb);

// ================= AUTH =================
app.post('/api/register', async (req, res) => {
    try {
        const name = String(req.body.name || req.body.fullName || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const blood_group = String(req.body.blood_group || req.body.bloodGroup || '').trim();
        const location = String(req.body.location || req.body.address || 'N/A').trim() || 'N/A';
        const phone = String(req.body.phone || req.body.contact || req.body.mobile || 'N/A').trim() || 'N/A';

        if (!name || !email || !password || !blood_group) {
            return res.status(400).json({ success: false, message: 'Name, email, password and blood group are required.' });
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const result = await db.run(
            `INSERT INTO users (name, email, password, blood_group, location, phone, is_available)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [name, email, password, blood_group, location, phone]
        );

        res.json({
            success: true,
            message: 'Registration successful!',
            userId: result.lastID
        });
    } catch (err) {
        console.error('Register Error:', err.message);
        if (/UNIQUE|users\.email/i.test(err.message)) {
            return res.status(400).json({ success: false, message: 'This email already has an account. Please sign in.' });
        }
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await db.get(
            `SELECT id, name, email, blood_group, location, phone, is_available, created_at
             FROM users WHERE email = ? AND password = ?`,
            [email, password]
        );

        if (!user) return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
        res.json({ success: true, message: 'Login successful!', user });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ success: false, message: 'Could not sign in.' });
    }
});

// ================= DONORS =================
app.get('/api/donors', async (req, res) => {
    try {
        const { blood_group, location } = req.query;

        let query = `
            SELECT id, name, email, blood_group, location, phone, is_available 
            FROM users 
            WHERE COALESCE(is_available, 1) = 1
        `;
        let params = [];

        // ব্লাড গ্রুপ ফিল্টার (যদি সিলেক্ট থাকে)
        if (blood_group) {
            query += ' AND blood_group = ?';
            params.push(blood_group);
        }

        // লোকেশন বা হাসপাতালের নাম - যেকোনো আংশিক টেক্সট মিলাবে
        if (location && location.trim() !== '') {
            query += ' AND LOWER(location) LIKE LOWER(?)';
            params.push(`%${location.trim()}%`);
        }

        query += ' ORDER BY id DESC';

        const donors = await db.all(query, params);
        res.json({ success: true, donors });
    } catch (err) {
        console.error('Fetch Donors Error:', err.message);
        res.status(500).json({ success: false, message: 'Could not fetch donors' });
    }
});

app.patch('/api/donors/:id/availability', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const available = req.body.available ? 1 : 0;
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'Invalid donor id.' });

        await db.run(`UPDATE users SET is_available = ? WHERE id = ?`, [available, id]);
        const user = await db.get(`SELECT id, name, email, blood_group, location, phone, is_available, created_at FROM users WHERE id = ?`, [id]);
        if (!user) return res.status(404).json({ success: false, message: 'Donor not found.' });

        res.json({ success: true, user });
    } catch (err) {
        console.error('Availability Error:', err.message);
        res.status(500).json({ success: false, message: 'Could not update availability.' });
    }
});

// ================= BLOOD REQUESTS =================
app.post('/api/requests', async (req, res) => {
    try {
        const patient_name = String(req.body.patient_name || '').trim();
        const blood_group = String(req.body.blood_group || '').trim();
        const hospital = String(req.body.hospital || req.body.hospital_location || '').trim();
        const contact_number = String(req.body.contact_number || '').trim();
        const bags_needed = Number(req.body.bags_needed);
        const urgency = String(req.body.urgency || 'Urgent').trim();

        if (!patient_name || !blood_group || !hospital || !contact_number || !Number.isInteger(bags_needed) || bags_needed < 1) {
            return res.status(400).json({ success: false, message: 'Please fill all request fields correctly.' });
        }

        const result = await db.run(
            `INSERT INTO blood_requests
             (patient_name, blood_group, hospital_location, contact_number, bags_needed, bags_collected, urgency)
             VALUES (?, ?, ?, ?, ?, 0, ?)`,
            [patient_name, blood_group, hospital, contact_number, bags_needed, urgency]
        );

        res.json({ success: true, message: 'Blood request posted successfully!', requestId: result.lastID });
    } catch (err) {
        console.error('Request Insertion Error:', err.message);
        res.status(500).json({ success: false, message: 'Could not save the request.' });
    }
});

app.get('/api/requests', async (req, res) => {
    try {
        const requests = await db.all(`
            SELECT id, patient_name, blood_group, bags_needed, bags_collected,
                   hospital_location, hospital_location AS hospital, urgency,
                   contact_number, created_at
            FROM blood_requests
            ORDER BY id DESC
        `);
        res.json({ success: true, requests });
    } catch (err) {
        console.error('Fetch Requests Error:', err.message);
        res.status(500).json({ success: false, message: 'Could not load requests.' });
    }
});

app.post('/api/requests/:id/respond', async (req, res) => {
    try {
        const requestId = Number(req.params.id);
        const donorId = req.body.donor_id ? Number(req.body.donor_id) : null;
        if (!Number.isInteger(requestId) || requestId < 1) return res.status(400).json({ success: false, message: 'Invalid request id.' });

        await db.run(
            `INSERT INTO donation_responses (request_id, donor_id, status) VALUES (?, ?, 'Responded')`,
            [requestId, donorId]
        );
        res.json({ success: true, message: 'Response recorded successfully.' });
    } catch (err) {
        if (/UNIQUE/i.test(err.message)) {
            return res.json({ success: true, message: 'You already responded to this request.' });
        }
        console.error('Response Error:', err.message);
        res.status(500).json({ success: false, message: 'Could not record response.' });
    }
});

// ================= ADMIN =================
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await db.all(`SELECT * FROM users ORDER BY id DESC`);
        res.json({ success: true, users });
    } catch (err) {
        console.error('Admin Users Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/admin/requests', async (req, res) => {
    try {
        const requests = await db.all(`
            SELECT id, patient_name, blood_group, bags_needed, bags_collected,
                   hospital_location, hospital_location AS hospital, urgency,
                   contact_number, created_at
            FROM blood_requests ORDER BY id DESC
        `);
        res.json({ success: true, requests });
    } catch (err) {
        console.error('Admin Requests Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/requests/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'Invalid request id.' });
        await db.run(`DELETE FROM blood_requests WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Request deleted successfully.' });
    } catch (err) {
        console.error('Delete Error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

// ================= START =================
setupDatabase()
    .then(database => {
        db = database;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    });

    