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

    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id TEXT UNIQUE NOT NULL,
      patient_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      total_price REAL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      patient_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL,
      package_id INTEGER,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );
  `);

  // Migration: Add clinical fields to packages
  try {
    db.exec("ALTER TABLE packages ADD COLUMN diagnostic TEXT;");
    db.exec("ALTER TABLE packages ADD COLUMN acr TEXT;");
    db.exec("ALTER TABLE packages ADD COLUMN radio_path TEXT;");
    // Migrate existing notes to diagnostic
    db.exec("UPDATE packages SET diagnostic = note WHERE diagnostic IS NULL AND note IS NOT NULL;");
    console.log('[System] Migration: Added "diagnostic", "acr", and "radio_path" to "packages" table.');
  } catch (err) {
    if (!err.message.includes("duplicate column name")) {
       console.error('[System] Migration error (packages clinical fields):', err.message);
    }
  }

  // Migration: Add clinical fields to sessions
  try {
    db.exec("ALTER TABLE sessions ADD COLUMN diagnostic TEXT;");
    db.exec("ALTER TABLE sessions ADD COLUMN act TEXT;");
    db.exec("ALTER TABLE sessions ADD COLUMN maladi TEXT;");
    db.exec("ALTER TABLE sessions ADD COLUMN radio_path TEXT;");
    console.log('[System] Migration: Added clinical columns to "sessions" table.');
  } catch (err) {
    if (!err.message.includes("duplicate column name")) {
       console.error('[System] Migration error (sessions clinical fields):', err.message);
    }
  }

  db.exec("PRAGMA foreign_keys = ON;");

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

// Sessions
function getSessions() {
  try {
    const stmt = db.prepare(`
      SELECT s.*, p.name as patient_name
      FROM sessions s
      JOIN patients p ON s.patient_id = p.id
      ORDER BY s.id DESC
    `);
    const sessions = stmt.all();
    return { success: true, sessions };
  } catch (err) {
    console.error('Database Get Sessions Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function getSessionsByPatient(patientId) {
  try {
    const stmt = db.prepare('SELECT * FROM sessions WHERE patient_id = ? ORDER BY date DESC');
    const sessions = stmt.all(patientId);
    return { success: true, sessions };
  } catch (err) {
    console.error('Database Get Patient Sessions Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function createSession(patient_id, date, amount, note, package_id = null, diagnostic = '', act = '', maladi = '', radio_path = '') {
  try {
    const lastStmt = db.prepare('SELECT session_id FROM sessions ORDER BY id DESC LIMIT 1');
    const last = lastStmt.get();
    let nextId = 'SS-001';
    if (last) {
      const num = parseInt(last.session_id.split('-')[1]);
      nextId = `SS-${(num + 1).toString().padStart(3, '0')}`;
    }

    const stmt = db.prepare('INSERT INTO sessions (session_id, patient_id, date, amount, package_id, note, diagnostic, act, maladi, radio_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(nextId, patient_id, date, amount, package_id, note, diagnostic, act, maladi, radio_path);
    return { success: true, message: 'Session created successfully', id: result.lastInsertRowid };
  } catch (err) {
    console.error('Database Create Session Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function updateSession(id, patient_id, date, amount, note, package_id = null, diagnostic = '', act = '', maladi = '', radio_path = '') {
  try {
    const stmt = db.prepare('UPDATE sessions SET patient_id = ?, date = ?, amount = ?, note = ?, package_id = ?, diagnostic = ?, act = ?, maladi = ?, radio_path = ? WHERE id = ?');
    stmt.run(patient_id, date, amount, note, package_id, diagnostic, act, maladi, radio_path, id);
    return { success: true, message: 'Session updated successfully' };
  } catch (err) {
    console.error('Database Update Session Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function deleteSession(id) {
  try {
    const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(id);
    return { success: true, message: 'Session deleted successfully' };
  } catch (err) {
    console.error('Database Delete Session Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function getSessionById(id) {
  try {
    const stmt = db.prepare(`
      SELECT s.*, p.name as patient_name, p.patient_id as patient_display_id
      FROM sessions s
      JOIN patients p ON s.patient_id = p.id
      WHERE s.id = ?
    `);
    const session = stmt.get(id);
    return { success: true, session };
  } catch (err) {
    console.error('Database Get Session Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

// Packages
function getPackages() {
  try {
    const stmt = db.prepare(`
      SELECT pk.*, p.name as patient_name, (SELECT COUNT(*) FROM sessions WHERE package_id = pk.id) as session_count
      FROM packages pk
      JOIN patients p ON pk.patient_id = p.id
      ORDER BY pk.id DESC
    `);
    const packages = stmt.all();
    return { success: true, packages };
  } catch (err) {
    console.error('Database Get Packages Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function getPackagesByPatient(patientId) {
  try {
    const stmt = db.prepare('SELECT * FROM packages WHERE patient_id = ? ORDER BY created_at DESC');
    const packages = stmt.all(patientId);
    return { success: true, packages };
  } catch (err) {
    console.error('Database Get Patient Packages Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function createPackage(patient_id, name, total_price, diagnostic, acr, radio_path = '') {
  try {
    const lastStmt = db.prepare('SELECT package_id FROM packages ORDER BY id DESC LIMIT 1');
    const last = lastStmt.get();
    let nextId = 'MS-001';
    if (last) {
      const num = parseInt(last.package_id.split('-')[1]);
      nextId = `MS-${(num + 1).toString().padStart(3, '0')}`;
    }

    const stmt = db.prepare('INSERT INTO packages (package_id, patient_id, name, total_price, diagnostic, acr, radio_path) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(nextId, patient_id, name, total_price, diagnostic, acr, radio_path);
    return { success: true, message: 'Package created successfully', id: result.lastInsertRowid };
  } catch (err) {
    console.error('Database Create Package Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function updatePackage(id, patient_id, name, total_price, diagnostic, acr, radio_path = '') {
  try {
    const stmt = db.prepare('UPDATE packages SET patient_id = ?, name = ?, total_price = ?, diagnostic = ?, acr = ?, radio_path = ? WHERE id = ?');
    stmt.run(patient_id, name, total_price, diagnostic, acr, radio_path, id);
    return { success: true, message: 'Package updated successfully' };
  } catch (err) {
    console.error('Database Update Package Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function getPackageById(id) {
  try {
    const stmt = db.prepare(`
      SELECT pk.*, p.name as patient_name
      FROM packages pk
      JOIN patients p ON pk.patient_id = p.id
      WHERE pk.id = ?
    `);
    const pkg = stmt.get(id);
    return { success: true, package: pkg };
  } catch (err) {
    console.error('Database Get Package Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function getSessionsByPackage(packageId) {
  try {
    const stmt = db.prepare('SELECT * FROM sessions WHERE package_id = ? ORDER BY date ASC');
    const sessions = stmt.all(packageId);
    return { success: true, sessions };
  } catch (err) {
    console.error('Database Get Package Sessions Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function deletePackage(id) {
  try {
    const stmt = db.prepare('DELETE FROM packages WHERE id = ?');
    stmt.run(id);
    return { success: true, message: 'Package deleted successfully' };
  } catch (err) {
    console.error('Database Delete Package Error:', err);
    return { success: false, message: 'Internal Server Error' };
  }
}

function getPatientById(id) {
  try {
    const stmt = db.prepare('SELECT * FROM patients WHERE id = ?');
    const patient = stmt.get(id);
    return { success: true, patient };
  } catch (err) {
    console.error('Database Get Patient By ID Error:', err);
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
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getSessions,
  getSessionsByPatient,
  createSession,
  updateSession,
  deleteSession,
  getSessionById,
  getPackages,
  getPackagesByPatient,
  getSessionsByPackage,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  ping: () => true
};
