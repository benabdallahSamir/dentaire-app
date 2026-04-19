const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { initDB, verifyUser, getUsers, createUser, deleteUser, updateUser, getPatients, getPatientById, createPatient, updatePatient, deletePatient, getSessions, getSessionsByPatient, createSession, updateSession, deleteSession, getPackages, getPackagesByPatient, getPackageById, getSessionsByPackage, createPackage, updatePackage, deletePackage, getSessionById, ping } = require('./database');

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

  ipcMain.handle('getPatientById', async (event, id) => {
    console.log('[IPC] Fetching patient by ID:', id);
    return getPatientById(id);
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

  // Session Handlers
  ipcMain.handle('getSessions', async () => {
    console.log('[IPC] Fetching sessions from DB...');
    return getSessions();
  });

  ipcMain.handle('createSession', async (event, patient_id, date, amount, note, package_id, diagnostic, act, maladi, radio_path) => {
    return createSession(patient_id, date, amount, note, package_id, diagnostic, act, maladi, radio_path);
  });

  ipcMain.handle('updateSession', async (event, id, patient_id, date, amount, note, package_id, diagnostic, act, maladi, radio_path) => {
    return updateSession(id, patient_id, date, amount, note, package_id, diagnostic, act, maladi, radio_path);
  });

  ipcMain.handle('deleteSession', async (event, id) => {
    console.log('[IPC] Deleting session ID:', id);
    return deleteSession(id);
  });

  ipcMain.handle('getSessionsByPatient', async (event, patientId) => {
    return getSessionsByPatient(patientId);
  });

  ipcMain.handle('getSessionById', async (event, id) => {
    return getSessionById(id);
  });

  // Package Handlers
  ipcMain.handle('getPackages', async () => {
    console.log('[IPC] Fetching packages from DB...');
    return getPackages();
  });

  ipcMain.handle('createPackage', async (event, patient_id, name, total_price, note) => {
    console.log('[IPC] Creating new package in DB');
    return createPackage(patient_id, name, total_price, note);
  });

  ipcMain.handle('updatePackage', async (event, id, name, total_price, note) => {
    console.log('[IPC] Updating package ID:', id);
    return updatePackage(id, name, total_price, note);
  });

  ipcMain.handle('getPackageById', async (event, id) => {
    return getPackageById(id);
  });

  ipcMain.handle('getSessionsByPackage', async (event, packageId) => {
    return getSessionsByPackage(packageId);
  });

  ipcMain.handle('deletePackage', async (event, id) => {
    console.log('[IPC] Deleting package ID:', id);
    return deletePackage(id);
  });

  ipcMain.handle('getPackagesByPatient', async (event, patientId) => {
    return getPackagesByPatient(patientId);
  });

  // Printing Handlers
  ipcMain.handle('getPrinters', async (event) => {
    try {
       let printers = [];
       if (event.sender.getPrintersAsync) {
           printers = await event.sender.getPrintersAsync();
       } else if (event.sender.getPrinters) {
           printers = event.sender.getPrinters();
       } else {
           // Fallback to empty array if properties don't exist
           console.log('[IPC] System is unable to index configured printers.');
       }
       return { success: true, printers };
    } catch (err) {
       console.error('[IPC] Failed to get printers:', err);
       return { success: false, message: err.message };
    }
  });

  ipcMain.handle('printThermalReceipt', async (event, htmlContent, printerName) => {
    return new Promise((resolve) => {
      try {
        const printWindow = new BrowserWindow({
          show: false,
          webPreferences: { nodeIntegration: false, contextIsolation: true }
        });
        
        const htmlURI = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        
        printWindow.loadURL(htmlURI).then(async () => {
          try {
            // Electron modern standard uses a promise. 
            // Also provide a robust fallback just in case.
            await printWindow.webContents.print({
              silent: true,
              deviceName: printerName,
              margins: { marginType: 'none' },
              printBackground: true
            });
            setTimeout(() => {
              if (!printWindow.isDestroyed()) printWindow.close();
            }, 1000);
            resolve({ success: true, message: 'Printed successfully' });
          } catch (printErr) {
            if (!printWindow.isDestroyed()) printWindow.close();
            resolve({ success: false, message: printErr.message || 'Unknown print error' });
          }
        }).catch(err => {
          if (!printWindow.isDestroyed()) printWindow.close();
          resolve({ success: false, message: 'Failed to load receipt content', err });
        });
      } catch (err) {
        resolve({ success: false, message: err.message });
      }
    });
  });

  // File Handlers for Radios
  ipcMain.handle('selectRadioFile', async (event) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      const result = await dialog.showOpenDialog(window, {
        properties: ['openFile'],
        filters: [
          { name: 'Radiographie (Image)', extensions: ['png', 'jpg', 'jpeg'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) return { success: false };

      const sourcePath = result.filePaths[0];
      const radiosDir = path.join(app.getPath('userData'), 'radios');
      
      if (!fs.existsSync(radiosDir)) {
        fs.mkdirSync(radiosDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${path.basename(sourcePath)}`;
      const destPath = path.join(radiosDir, fileName);

      fs.copyFileSync(sourcePath, destPath);
      return { success: true, path: fileName }; 
    } catch (err) {
      console.error('[IPC] selectRadioFile error:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('saveRadioFromPath', async (event, sourcePath) => {
    try {
      const radiosDir = path.join(app.getPath('userData'), 'radios');
      if (!fs.existsSync(radiosDir)) {
        fs.mkdirSync(radiosDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${path.basename(sourcePath)}`;
      const destPath = path.join(radiosDir, fileName);

      fs.copyFileSync(sourcePath, destPath);
      return { success: true, path: fileName };
    } catch (err) {
      console.error('[IPC] saveRadioFromPath error:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('openRadioFile', async (event, fileName) => {
    try {
      const fullPath = path.join(app.getPath('userData'), 'radios', fileName);
      if (fs.existsSync(fullPath)) {
        const error = await shell.openPath(fullPath);
        if (error) return { success: false, message: error };
        return { success: true };
      }
      return { success: false, message: 'Le fichier est introuvable.' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('readRadioFile', async (event, fileName) => {
    try {
      const fullPath = path.join(app.getPath('userData'), 'radios', fileName);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath);
        const ext = path.extname(fileName).toLowerCase();
        let mime = 'image/jpeg';
        if (ext === '.png') mime = 'image/png';
        if (ext === '.pdf') mime = 'application/pdf';
        
        return { success: true, data: `data:${mime};base64,${content.toString('base64')}`, mime };
      }
      return { success: false };
    } catch (err) {
      return { success: false };
    }
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
