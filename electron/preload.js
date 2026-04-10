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
  deletePatient: (id) => ipcRenderer.invoke('deletePatient', id)
});
