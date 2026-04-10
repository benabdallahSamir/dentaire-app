import DashboardLayout from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

function PatientManagement() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filter State
  const [filters, setFilters] = useState({
    name: '',
    patientId: '',
    phone: '',
    dobFrom: '',
    dobTo: ''
  });

  // Form State
  const [targetPatient, setTargetPatient] = useState({
    id: null,
    name: '',
    phone: '',
    dob: '',
    gender: 'Female',
    address: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const result = await window.api.getPatients();
      if (result.success) {
        setPatients(result.patients);
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      let result;
      if (isEditMode) {
        result = await window.api.updatePatient(
          targetPatient.id,
          targetPatient.name,
          targetPatient.phone,
          targetPatient.dob,
          targetPatient.gender,
          targetPatient.address
        );
      } else {
        result = await window.api.createPatient(
          targetPatient.name,
          targetPatient.phone,
          targetPatient.dob,
          targetPatient.gender,
          targetPatient.address
        );
      }

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: isEditMode ? 'Patient Updated' : 'Patient Registered',
          text: result.message,
          timer: 2000,
          showConfirmButton: false,
          background: 'var(--bg-color)',
          color: 'var(--text-color)'
        });
        fetchPatients();
        closePanel();
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg("Error: " + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete record?',
      text: `Are you sure you want to remove the medical record for "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--bg-color)',
      color: 'var(--text-color)'
    });

    if (isConfirmed) {
      try {
        const result = await window.api.deletePatient(id);
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Patient record has been removed.',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--bg-color)',
            color: 'var(--text-color)'
          });
          fetchPatients();
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const openAddPanel = () => {
    setIsEditMode(false);
    setTargetPatient({ id: null, name: '', phone: '', dob: '', gender: 'Female', address: '' });
    setIsPanelOpen(true);
  };

  const openEditPanel = (patient) => {
    setIsEditMode(true);
    setTargetPatient({ ...patient });
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setErrorMsg('');
  };

  const clearFilters = () => {
    setFilters({ name: '', patientId: '', phone: '', dobFrom: '', dobTo: '' });
  };

  // Logic for dynamic filtering
  const filteredPatients = patients.filter(p => {
    const matchesName = p.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesId = p.patient_id.toLowerCase().includes(filters.patientId.toLowerCase());
    const matchesPhone = p.phone.includes(filters.phone);
    
    let matchesDob = true;
    if (filters.dobFrom || filters.dobTo) {
      const pDob = new Date(p.dob);
      if (filters.dobFrom && pDob < new Date(filters.dobFrom)) matchesDob = false;
      if (filters.dobTo && pDob > new Date(filters.dobTo)) matchesDob = false;
    }

    return matchesName && matchesId && matchesPhone && matchesDob;
  });

  return (
    <DashboardLayout>
      <div className="relative h-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Patient Management</h1>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-500 shadow-sm">🔔</button>
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">AD</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 rounded-2xl shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">
            <span>🛡️</span> Search & Filter
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Name</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">🔍</span>
                <input 
                  type="text" 
                  value={filters.name}
                  onChange={(e) => setFilters({...filters, name: e.target.value})}
                  placeholder="e.g. Amina" 
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Patient ID</label>
              <input 
                type="text" 
                value={filters.patientId}
                onChange={(e) => setFilters({...filters, patientId: e.target.value})}
                placeholder="P-001" 
                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Phone</label>
              <input 
                type="text" 
                value={filters.phone}
                onChange={(e) => setFilters({...filters, phone: e.target.value})}
                placeholder="0661..." 
                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">DOB From</label>
              <input 
                type="date" 
                value={filters.dobFrom}
                onChange={(e) => setFilters({...filters, dobFrom: e.target.value})}
                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">DOB To</label>
                <input 
                  type="date" 
                  value={filters.dobTo}
                  onChange={(e) => setFilters({...filters, dobTo: e.target.value})}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all"
                />
              </div>
              <button 
                onClick={clearFilters}
                className="h-10 px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors whitespace-nowrap"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 min-h-0 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-black/20">
            <h2 className="font-bold text-neutral-800 dark:text-white flex items-center gap-2">
              Patient records <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full">{filteredPatients.length}</span>
            </h2>
            <button 
              onClick={openAddPanel}
              className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Add Patient
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-neutral-900 z-10">
                <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
                  <th className="p-6">ID</th>
                  <th className="p-6">Name</th>
                  <th className="p-6">Phone</th>
                  <th className="p-6">DOB</th>
                  <th className="p-6">Address</th>
                  <th className="p-6">Created</th>
                  <th className="p-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                {loading ? (
                   <tr><td colSpan="7" className="p-10 text-center text-neutral-400">Loading patients...</td></tr>
                ) : filteredPatients.length === 0 ? (
                  <tr><td colSpan="7" className="p-10 text-center text-neutral-400">No records found matching filters.</td></tr>
                ) : filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-sm">
                    <td className="p-6 font-mono text-neutral-400">{p.patient_id}</td>
                    <td className="p-6 font-bold text-neutral-800 dark:text-white">{p.name}</td>
                    <td className="p-6 text-neutral-500">{p.phone}</td>
                    <td className="p-6 text-neutral-500">{p.dob}</td>
                    <td className="p-6 text-neutral-400 max-w-xs truncate">{p.address}</td>
                    <td className="p-6 text-neutral-400">{p.created_at.split(' ')[0]}</td>
                    <td className="p-6">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEditPanel(p)} className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">📝</button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-red-500">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sliding Sidebar Panel */}
        <div className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-neutral-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-neutral-100 dark:border-neutral-800 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-neutral-800 dark:text-white">{isEditMode ? 'Edit patient' : 'Add new patient'}</h3>
              <button onClick={closePanel} className="text-neutral-400 hover:text-red-500 transition-colors text-xl">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-auto p-6 space-y-6">
              {errorMsg && <div className="p-3 bg-red-100 text-red-600 rounded-xl text-xs font-bold">{errorMsg}</div>}
              
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Full Name *</label>
                <input 
                  type="text" 
                  value={targetPatient.name}
                  onChange={(e) => setTargetPatient({...targetPatient, name: e.target.value})}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Phone *</label>
                <input 
                  type="text" 
                  value={targetPatient.phone}
                  onChange={(e) => setTargetPatient({...targetPatient, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={targetPatient.dob}
                  onChange={(e) => setTargetPatient({...targetPatient, dob: e.target.value})}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Gender</label>
                <select 
                  value={targetPatient.gender}
                  onChange={(e) => setTargetPatient({...targetPatient, gender: e.target.value})}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                >
                  <option>Female</option>
                  <option>Male</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Address</label>
                <textarea 
                   value={targetPatient.address}
                   onChange={(e) => setTargetPatient({...targetPatient, address: e.target.value})}
                   rows="3"
                   className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={closePanel}
                  className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Backdrop for panel */}
        {isPanelOpen && <div onClick={closePanel} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" />}

      </div>
    </DashboardLayout>
  );
}

export default PatientManagement;
