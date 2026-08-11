const express = require('express');
const path = require('path');
const setupDatabase = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

// ১. রেজিস্টার API (সুরক্ষিত ও ফ্লেক্সিবল কোড)
app.post('/api/register', async (req, res) => {
    const { name, email, password, blood_group, location, phone } = req.body;
    
    // নাম, ইমেইল বা পাসওয়ার্ড ফাঁকা থাকলে স্পষ্ট মেসেজ দেবে
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'নাম, ইমেইল এবং পাসওয়ার্ড দেওয়া বাধ্যতামূলক!' });
    }

    try {
        const result = await db.run(
            `INSERT INTO users (name, email, password, blood_group, location, phone) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name,
                email,
                password,
                blood_group || 'A+',
                location || 'Not Specified',
                phone || ''
            ]
        );
        res.json({ success: true, message: '🎉 রেজিস্ট্রেশন সফল হয়েছে!', userId: result.lastID });
    } catch (err) {
        console.error('Register Error:', err.message);
        
        // যদি ইমেইল সত্যিই আগে থেকে জমা থাকে
        if (err.message.includes('UNIQUE') || err.message.includes('users.email')) {
            res.status(400).json({ success: false, message: 'এই ইমেইলটি দিয়ে অলরেডি অ্যাকাউন্ট খোলা আছে! দয়া করে Sign In করুন।' });
        } else {
            // অন্য কোনো ডাটাবেজ এরর হলে আসল এরর মেসেজ দেখাবে
            res.status(500).json({ success: false, message: 'ডাটাবেজে সমস্যা হয়েছে: ' + err.message });
        }
    }
});

// ২. লগইন API
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'ইমেইল এবং পাসওয়ার্ড দুটিই প্রয়োজন!' });
    }

    try {
        const user = await db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password]);
        if (user) {
            res.json({ success: true, message: 'লগইন সফল!', user });
        } else {
            res.status(401).json({ success: false, message: 'ইমেইল বা পাসওয়ার্ড ভুল!' });
        }
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ success: false, message: 'সার্ভার এরর!' });
    }
});

// ৩. রক্তদাতাদের লিস্ট দেখার API
app.get('/api/donors', async (req, res) => {
    try {
        const donors = await db.all(`SELECT id, name, blood_group, location, is_available FROM users`);
        res.json({ success: true, donors });
    } catch (err) {
        console.error('Fetch Donors Error:', err.message);
        res.status(500).json({ success: false, message: 'ডাটা আনতে সমস্যা হয়েছে!' });
    }
});

// ৪. রক্তের রিকোয়েস্ট পোস্ট করার API
app.post('/api/requests', async (req, res) => {
    const { patient_name, blood_group, hospital, contact_number, bags_needed } = req.body;
    
    console.log("👉 Form Data Received:", req.body);

    try {
        await db.run(
            `INSERT INTO blood_requests (patient_name, blood_group, hospital_location, contact_number, bags_needed) VALUES (?, ?, ?, ?, ?)`,
            [patient_name, blood_group, hospital, String(contact_number), Number(bags_needed)]
        );
        res.json({ success: true, message: 'রক্তের রিকোয়েস্ট সফলভাবে পোস্ট হয়েছে!' });
    } catch (err) {
        console.error('❌ Request Insertion Error:', err.message);
        res.status(500).json({ success: false, message: 'রিকোয়েস্ট সেভ করা যায়নি! কারণ: ' + err.message });
    }
});

// ৫. রক্তের সব রিকোয়েস্ট দেখার API (ইউজারদের জন্য)
app.get('/api/requests', async (req, res) => {
    try {
        const requests = await db.all(`SELECT *, hospital_location AS hospital FROM blood_requests ORDER BY id DESC`);
        res.json({ success: true, requests });
    } catch (err) {
        console.error('Fetch Requests Error:', err.message);
        res.status(500).json({ success: false, message: 'ডাটা আনতে সমস্যা হয়েছে!' });
    }
});

// ================= ADMIN APIS ================= //

// ১. সব ইউজার/ডোনারদের লিস্ট পাওয়ার API (অ্যাডমিনের জন্য)
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await db.all("SELECT * FROM users ORDER BY id DESC");
        res.json({ success: true, users });
    } catch (err) {
        console.error('Admin Users Fetch Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ২. সব ব্লাড রিকোয়েস্টের লিস্ট পাওয়ার API (অ্যাডমিনের জন্য)
app.get('/api/admin/requests', async (req, res) => {
    try {
        const requests = await db.all("SELECT *, hospital_location AS hospital FROM blood_requests ORDER BY id DESC");
        res.json({ success: true, requests });
    } catch (err) {
        console.error('Admin Requests Fetch Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// সার্ভার চালু করা
setupDatabase().then((database) => {
    db = database;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("❌ Database connection failed:", err);
});