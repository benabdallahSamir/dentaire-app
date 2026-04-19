import DashboardLayout from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionOk, setConnectionOk] = useState(true);

  // Form State
  const [targetUser, setTargetUser] = useState({ id: null, username: '', password: '', role: 'user' });
  const [errorMsg, setErrorMsg] = useState('');

  // Diagnostic Ping
  const pingBackend = async () => {
    try {
      if (window.api && window.api.ping) {
        const ok = await window.api.ping();
        setConnectionOk(ok);
      } else {
        setConnectionOk(false);
      }
    } catch {
      setConnectionOk(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      if (!window.api || !window.api.getUsers) {
        throw new Error("API bridge not found. Did you restart the app?");
      }
      const result = await window.api.getUsers();
      if (result.success) {
        setUsers(result.users);
      } else {
        setErrorMsg(result.message || "Failed to load users");
      }
    } catch (err) {
      console.error("IPC Fetch Error:", err);
      setErrorMsg("Connection error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pingBackend();
    fetchUsers();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      let result;
      if (isEditMode) {
        result = await window.api.updateUser(targetUser.id, targetUser.username, targetUser.role, targetUser.password || undefined);
      } else {
        result = await window.api.createUser(targetUser.username, targetUser.password, targetUser.role);
      }

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: isEditMode ? 'User Updated' : 'User Created',
          text: result.message,
          timer: 2000,
          showConfirmButton: false,
          background: 'var(--swal-bg)',
          color: 'var(--swal-color)'
        });
        await fetchUsers();
        setIsModalOpen(false);
        resetForm();
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      console.error("IPC Action Error:", err);
      setErrorMsg("Action failed: " + err.message);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (username === 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Cannot delete the root administrator account.',
        background: 'var(--bg-color)',
        color: 'var(--text-color)'
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to drop user "${username}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#06b6d4',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, drop!',
      background: 'var(--swal-bg)',
      color: 'var(--swal-color)'
    });

    if (isConfirmed) {
      try {
        const result = await window.api.deleteUser(id);
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Dropped!',
            text: 'User has been removed.',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--bg-color)',
            color: 'var(--text-color)'
          });
          fetchUsers();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: result.message,
            background: 'var(--bg-color)',
            color: 'var(--text-color)'
          });
        }
      } catch (err) {
        console.error("Delete Error:", err);
      }
    }
  };

  const openEditModal = (user) => {
    setTargetUser({ ...user, password: '' });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setTargetUser({ id: null, username: '', password: '', role: 'user' });
    setIsEditMode(false);
    setErrorMsg('');
  };

  // Filtered Users for Search
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Connection Warning */}
      {!connectionOk && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between text-red-600 font-bold">
          <span>⚠️ Connection to Backend Lost. Please RESTART the application.</span>
          <button onClick={() => window.location.reload()} className="underline text-sm">Retry Load</button>
        </div>
      )}

      {/* 1. Global Header (Search & Notifications) */}
      <div className="flex justify-between items-center mb-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            {t('sidebar.users')}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Manage all clinic staff and accounts.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-neutral-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            className="bg-cyan-500/10 text-cyan-600 px-4 py-2 rounded-xl text-sm font-bold border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
          >
            + New User
          </button>
        </div>
      </div>

      {/* 2. Statistical Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-neutral-200 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-neutral-500 font-medium">Total Users</p>
            <h3 className="text-3xl font-bold text-neutral-900 mt-1">{users.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-blue-500/10 text-blue-500">
            👥
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-neutral-500 font-medium">Admin Roles</p>
            <h3 className="text-3xl font-bold text-neutral-900 mt-1">{users.filter(u => u.role === 'admin').length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-purple-500/10 text-purple-500">
            🛡️
          </div>
        </div>
      </div>

      {/* 3. Main Data Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-neutral-900">System Users</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Username</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-neutral-500 italic">Finding staff records...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-neutral-500">No users match your search.</td></tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4 text-neutral-500 font-mono text-sm">#{u.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-neutral-900">{u.username}</span>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-600 font-medium capitalize">{u.role}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEditModal(u)} className="text-cyan-600 hover:underline px-2 font-bold text-sm">Edit</button>
                    <button onClick={() => handleDeleteUser(u.id, u.username)} className="text-red-600 hover:underline px-2 font-bold text-sm">Drop</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-neutral-200">
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <h3 className="text-xl font-bold text-neutral-900">
                {isEditMode ? `Edit User: ${targetUser.username}` : 'Create New Profile'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-neutral-500 hover:text-red-500 transition-colors w-8 h-8 rounded-full hover:bg-neutral-200 flex items-center justify-center">✕</button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} className="p-8 space-y-6">
              {errorMsg && (
                <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded-lg text-red-600 text-sm font-bold flex items-center gap-2">
                  <span>🛑</span> {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 mx-1">Username</label>
                <input 
                  type="text" 
                  value={targetUser.username}
                  onChange={(e) => setTargetUser({...targetUser, username: e.target.value})}
                  className="w-full p-4 bg-neutral-100 border border-neutral-200 rounded-2xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-neutral-900 font-semibold transition-all shadow-inner"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 mx-1">
                  {isEditMode ? 'New Password (Optional)' : 'Default Password'}
                </label>
                <input 
                  type="password" 
                  value={targetUser.password}
                  placeholder={isEditMode ? "Leave blank to keep same" : ""}
                  onChange={(e) => setTargetUser({...targetUser, password: e.target.value})}
                  className="w-full p-4 bg-neutral-100 border border-neutral-200 rounded-2xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-neutral-900 font-semibold transition-all shadow-inner"
                  required={!isEditMode}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 mx-1">Role Permission</label>
                <select 
                  value={targetUser.role}
                  onChange={(e) => setTargetUser({...targetUser, role: e.target.value})}
                  className="w-full p-4 bg-neutral-100 border border-neutral-200 rounded-2xl focus:border-cyan-500 outline-none text-neutral-900 font-bold transition-all cursor-pointer shadow-inner appearance-none"
                >
                  <option value="user">Standard User</option>
                  <option value="dentist">Medical Dentist</option>
                  <option value="receptionist">Clinic Receptionist</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 p-4 text-neutral-600 font-bold border border-neutral-200 rounded-2xl hover:bg-neutral-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 p-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all active:scale-95"
                >
                  {isEditMode ? 'Save Changes' : 'Confirm User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Users;
