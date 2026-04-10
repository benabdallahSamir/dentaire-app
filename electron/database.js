const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { app } = require('electron');

// Initialize database. We'll store it in the userData folder so it persists 
// after production builds, but during dev, it might be easier to use the local dev folder if preferred.
// For now, robustly place it in app.getPath('userData').
let db;

function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'clinic.db');
  console.log('Initializing database at:', dbPath);
  db = new Database(dbPath, { verbose: console.log });
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      dob TEXT,
      gender TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin user if no users exist
  seedAdminUser();
}

function seedAdminUser() {
  const stmt = db.prepare('SELECT COUNT(*) AS count FROM users');
  const result = stmt.get();

  if (result.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin', salt);
    
    const insertStmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    insertStmt.run('admin', hash, 'admin');
    console.log('[System] Default administrative user generated: admin / admin');
  }
}

function verifyUser(username, password) {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    
    if (!user) return { success: false, message: 'User not found' };

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return { success: false, message: 'Invalid password' };

    // Prevent passing the hashed password to to frontend
    const { password: _, ...safeUser } = user;
    return { success: true, user: safeUser };
  } catch (err) {
    console.error('Database Verification Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function getUsers() {
  try {
    // Select all users but do not send passwords
    const stmt = db.prepare('SELECT id, username, role FROM users');
    const users = stmt.all();
    return { success: true, users };
  } catch (err) {
    console.error('Database Get Users Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function createUser(username, password, role) {
  try {
    // Basic validation
    if (!username || !password || !role) {
      return { success: false, message: 'Username, password, and role are required' };
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    const result = stmt.run(username, hash, role);
    
    return { success: true, message: 'User created successfully', id: result.lastInsertRowid };
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return { success: false, message: 'Username already exists' };
    }
    console.error('Database Create User Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function deleteUser(id) {
  try {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
    return { success: true, message: 'User deleted successfully' };
  } catch (err) {
    console.error('Database Delete User Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function updateUser(id, username, role, password) {
  try {
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      const stmt = db.prepare('UPDATE users SET username = ?, role = ?, password = ? WHERE id = ?');
      stmt.run(username, role, hash, id);
    } else {
      const stmt = db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?');
      stmt.run(username, role, id);
    }
    return { success: true, message: 'User updated successfully' };
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return { success: false, message: 'Username already exists' };
    }
    console.error('Database Update User Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function getPatients() {
  try {
    const stmt = db.prepare('SELECT * FROM patients ORDER BY id DESC');
    const patients = stmt.all();
    return { success: true, patients };
  } catch (err) {
    console.error('Database Get Patients Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function createPatient(name, phone, dob, gender, address) {
  try {
    // Generate P-XXX ID
    const lastStmt = db.prepare('SELECT patient_id FROM patients ORDER BY id DESC LIMIT 1');
    const last = lastStmt.get();
    let nextId = 'P-001';
    if (last) {
      const num = parseInt(last.patient_id.split('-')[1]);
      nextId = `P-${(num + 1).toString().padStart(3, '0')}`;
    }

    const stmt = db.prepare('INSERT INTO patients (patient_id, name, phone, dob, gender, address) VALUES (?, ?, ?, ?, ?, ?)');
    const result = stmt.run(nextId, name, phone, dob, gender, address);
    return { success: true, message: 'Patient created successfully', id: result.lastInsertRowid };
  } catch (err) {
    console.error('Database Create Patient Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function updatePatient(id, name, phone, dob, gender, address) {
  try {
    const stmt = db.prepare('UPDATE patients SET name = ?, phone = ?, dob = ?, gender = ?, address = ? WHERE id = ?');
    stmt.run(name, phone, dob, gender, address, id);
    return { success: true, message: 'Patient updated successfully' };
  } catch (err) {
    console.error('Database Update Patient Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function deletePatient(id) {
  try {
    const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
    stmt.run(id);
    return { success: true, message: 'Patient deleted successfully' };
  } catch (err) {
    console.error('Database Delete Patient Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

module.exports = {
  initDB,
  verifyUser,
  getUsers,
  createUser,
  deleteUser,
  updateUser,
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  ping: () => true
};
