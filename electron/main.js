const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDB, verifyUser, getUsers, createUser, deleteUser, updateUser, getPatients, createPatient, updatePatient, deletePatient, ping } = require('./database');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the Vite dev server URL in development mode
  mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
  console.log('[System] Electron is ready. Registering IPC handlers...');

  // Register IPC handlers FIRST so they are available immediately
  ipcMain.handle('login', async (event, username, password) => {
    return verifyUser(username, password);
  });

  ipcMain.handle('getUsers', async () => {
    console.log('[IPC] Fetching users from DB...');
    return getUsers();
  });

  ipcMain.handle('createUser', async (event, username, password, role) => {
    console.log('[IPC] Creating new user in DB:', username);
    return createUser(username, password, role);
  });

  ipcMain.handle('deleteUser', async (event, id) => {
    console.log('[IPC] Deleting user ID:', id);
    return deleteUser(id);
  });

  ipcMain.handle('updateUser', async (event, id, username, role, password) => {
    console.log('[IPC] Updating user ID:', id);
    return updateUser(id, username, role, password);
  });

  ipcMain.handle('ping', async () => {
    return true;
  });

  ipcMain.handle('getPatients', async () => {
    console.log('[IPC] Fetching patients from DB...');
    return getPatients();
  });

  ipcMain.handle('createPatient', async (event, name, phone, dob, gender, address) => {
    console.log('[IPC] Creating new patient in DB:', name);
    return createPatient(name, phone, dob, gender, address);
  });

  ipcMain.handle('updatePatient', async (event, id, name, phone, dob, gender, address) => {
    console.log('[IPC] Updating patient in DB:', name);
    return updatePatient(id, name, phone, dob, gender, address);
  });

  ipcMain.handle('deletePatient', async (event, id) => {
    console.log('[IPC] Deleting patient ID:', id);
    return deletePatient(id);
  });

  // Then initialize the database
  try {
    initDB();
    console.log('[System] Database initialized successfully.');
  } catch (err) {
    console.error('[System] Database initialization FAILED:', err);
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
