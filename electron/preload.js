const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  getUsers: () => ipcRenderer.invoke('getUsers'),
  createUser: (username, password, role) => ipcRenderer.invoke('createUser', username, password, role),
  deleteUser: (id) => ipcRenderer.invoke('deleteUser', id),
  updateUser: (id, username, role, password) => ipcRenderer.invoke('updateUser', id, username, role, password),
  ping: () => ipcRenderer.invoke('ping'),
  getPatients: () => ipcRenderer.invoke('getPatients'),
  createPatient: (name, phone, dob, gender, address) => ipcRenderer.invoke('createPatient', name, phone, dob, gender, address),
  updatePatient: (id, name, phone, dob, gender, address) => ipcRenderer.invoke('updatePatient', id, name, phone, dob, gender, address),
  deletePatient: (id) => ipcRenderer.invoke('deletePatient', id),
  getSessions: () => ipcRenderer.invoke('getSessions'),
  getSessionsByPatient: (patientId) => ipcRenderer.invoke('getSessionsByPatient', patientId),
  createSession: (patient_id, date, amount, note) => ipcRenderer.invoke('createSession', patient_id, date, amount, note),
  updateSession: (id, patient_id, date, amount, note) => ipcRenderer.invoke('updateSession', id, patient_id, date, amount, note),
  deleteSession: (id) => ipcRenderer.invoke('deleteSession', id),
  getPackages: () => ipcRenderer.invoke('getPackages'),
  getPackagesByPatient: (patientId) => ipcRenderer.invoke('getPackagesByPatient', patientId),
  createPackage: (package_id, patient_id, name, total_price, status) => ipcRenderer.invoke('createPackage', package_id, patient_id, name, total_price, status),
  deletePackage: (id) => ipcRenderer.invoke('deletePackage', id)
});
