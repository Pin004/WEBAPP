// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// Middleware เพื่อให้เซิร์ฟเวอร์รับข้อมูลแบบ JSON ได้
app.use(express.json());

// สร้างและเชื่อมต่อฐานข้อมูล SQLite
const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// สร้างตาราง users ถ้ายังไม่มี
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )`);
});

// กำหนดให้เซิร์ฟเวอร์สามารถให้บริการไฟล์ในโฟลเดอร์ปัจจุบันได้
app.use(express.static(path.join(__dirname)));

// Endpoint สำหรับการสมัครสมาชิก
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    // Note: ในการใช้งานจริง ควรมีการเข้ารหัสรหัสผ่าน (hashing) ด้วย bcrypt หรือ library อื่นๆ เพื่อความปลอดภัย
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.run(sql, [username, email, password], function(err) {
        if (err) {
            // กรณีชื่อผู้ใช้หรืออีเมลซ้ำ
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้ไปแล้ว' });
            }
            return res.status(500).json({ message: err.message });
        }
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ!' });
    });
});

// Endpoint สำหรับการเข้าสู่ระบบ
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = `SELECT * FROM users WHERE email = ? AND password = ?`;
    db.get(sql, [email, password], (err, row) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        if (row) {
            // Note: ในการใช้งานจริง ควรมีการใช้ JWT หรือ Session เพื่อจัดการสถานะการเข้าสู่ระบบ
            res.json({ message: 'เข้าสู่ระบบสำเร็จ!', user: { id: row.id, username: row.username } });
        } else {
            res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
    });
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// เมื่อเซิร์ฟเวอร์ปิด ให้ปิดการเชื่อมต่อฐานข้อมูล
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});
