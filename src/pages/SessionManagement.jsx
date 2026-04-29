import DashboardLayout from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Search, User, Phone, Check } from 'lucide-react';

function SessionManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Panel States
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // View Details State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  
  // Dropdown States
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const patientDropdownRef = useRef(null);
  
  // Quick Add Patient States
  const [isQuickAddPatientOpen, setIsQuickAddPatientOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '', phone: '', dob: '', gender: 'Female', address: ''
  });

  // Filter State
  const [filters, setFilters] = useState({
    patientName: '',
    dateFrom: '',
    dateTo: ''
  });

  // Target Session
  const [targetSession, setTargetSession] = useState({
    id: null,
    patient_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    note: '',
    package_id: '',
    diagnostic: '',
    act: '',
    maladi: '',
    radio_path: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, patientsRes, packagesRes] = await Promise.all([
        window.api.getSessions(),
        window.api.getPatients(),
        window.api.getPackages()
      ]);
      
      if (sessionsRes.success) setSessions(sessionsRes.sessions || []);
      if (patientsRes.success) setPatients(patientsRes.patients || []);
      if (packagesRes.success) setPackages(packagesRes.packages || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target)) {
        setIsPatientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredFormPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.patient_id && p.patient_id.toLowerCase().includes(patientSearch.toLowerCase())) ||
    (p.phone && p.phone.includes(patientSearch))
  );

  const handleSelectPatient = (p) => {
    setTargetSession({ ...targetSession, patient_id: p.id });
    setPatientSearch(p.name);
    setIsPatientDropdownOpen(false);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!targetSession.patient_id) {
      setErrorMsg('Please select a patient.');
      return;
    }

    try {
      let result;
      if (isEditMode) {
        result = await window.api.updateSession(
          targetSession.id,
          targetSession.patient_id,
          targetSession.date,
          targetSession.amount,
          targetSession.note,
          targetSession.package_id || null,
          targetSession.diagnostic,
          targetSession.act,
          targetSession.maladi,
          targetSession.radio_path
        );
      } else {
        result = await window.api.createSession(
          targetSession.patient_id,
          targetSession.date,
          targetSession.amount,
          targetSession.note,
          targetSession.package_id || null,
          targetSession.diagnostic,
          targetSession.act,
          targetSession.maladi,
          targetSession.radio_path
        );
      }

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: isEditMode ? 'Session Updated' : 'Session Created',
          text: result.message,
          timer: 2000,
          showConfirmButton: false,
          background: 'var(--swal-bg)',
          color: 'var(--swal-color)'
        });
        fetchData();
        closePanel();
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg("Error: " + err.message);
    }
  };

  const handleQuickAddPatient = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newPatient.name || !newPatient.phone) {
      setErrorMsg('Name and Phone are required for patient.');
      return;
    }
    try {
      const result = await window.api.createPatient(
        newPatient.name,
        newPatient.phone,
        newPatient.dob,
        newPatient.gender,
        newPatient.address
      );
      if (result.success) {
        // Fetch updated patients list
        const patientsRes = await window.api.getPatients();
        if (patientsRes.success) {
          setPatients(patientsRes.patients || []);
          // Find the newly created patient (usually the last one or by matching)
          const createdPatient = (patientsRes.patients || []).find(
            p => p.name === newPatient.name && p.phone === newPatient.phone
          );
          if (createdPatient) {
            setTargetSession({...targetSession, patient_id: createdPatient.id});
            setPatientSearch(createdPatient.name);
          }
        }
        setIsQuickAddPatientOpen(false);
        setNewPatient({ name: '', phone: '', dob: '', gender: 'Female', address: '' });
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg("Error adding patient: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete session?',
      text: `Are you sure you want to remove this session?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--swal-bg)',
      color: 'var(--swal-color)'
    });

    if (isConfirmed) {
      try {
        const result = await window.api.deleteSession(id);
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Session has been removed.',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--swal-bg)',
            color: 'var(--swal-color)'
          });
          fetchData();
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const openAddPanel = () => {
    setIsEditMode(false);
    setTargetSession({
      id: null,
      patient_id: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      note: '',
      package_id: '',
      diagnostic: '',
      act: '',
      maladi: '',
      radio_path: ''
    });
    setPatientSearch('');
    setIsQuickAddPatientOpen(false);
    setIsPanelOpen(true);
  };

  const openEditPanel = (session) => {
    setIsEditMode(true);
    setTargetSession({
      id: session.id,
      patient_id: session.patient_id || '',
      date: session.date || new Date().toISOString().split('T')[0],
      amount: session.amount || '',
      note: session.note || '',
      package_id: session.package_id || '',
      diagnostic: session.diagnostic || '',
      act: session.act || '',
      maladi: session.maladi || '',
      radio_path: session.radio_path || ''
    });
    const p = patients.find(p => p.id === session.patient_id);
    setPatientSearch(p ? p.name : '');
    setIsQuickAddPatientOpen(false);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setErrorMsg('');
  };

  const handleRadioSelect = async () => {
    const result = await window.api.selectRadioFile();
    if (result.success) setTargetSession(prev => ({ ...prev, radio_path: result.path }));
  };

  const handleRadioDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.path) {
        const result = await window.api.saveRadioFromPath(file.path);
        if (result.success) setTargetSession(prev => ({ ...prev, radio_path: result.path }));
      }
    }
  };

  const openViewModal = (session, patient) => {
    setViewData({ session, patient });
    setIsViewModalOpen(true);
  };

  const clearFilters = () => {
    setFilters({ patientName: '', dateFrom: '', dateTo: '' });
  };

  // Logic for dynamic filtering
  const filteredSessions = sessions.filter(s => {
    const patient = patients.find(p => p.id === s.patient_id) || {};
    const patientName = patient.name || '';
    
    const matchesName = patientName.toLowerCase().includes(filters.patientName.toLowerCase());
    
    let matchesDate = true;
    if (filters.dateFrom || filters.dateTo) {
      const sDate = new Date(s.date);
      if (filters.dateFrom && sDate < new Date(filters.dateFrom)) matchesDate = false;
      if (filters.dateTo && sDate > new Date(filters.dateTo)) matchesDate = false;
    }

    return matchesName && matchesDate;
  });

  return (
    <DashboardLayout>
      <div className="relative h-full overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-neutral-900">Session Management</h1>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 shadow-sm transition-all hover:bg-neutral-50">🔔</button>
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">AD</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">
            <span>🛡️</span> Search & Filter
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Patient Name</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 text-sm">🔍</span>
                <input 
                  type="text" 
                  value={filters.patientName}
                  onChange={(e) => setFilters({...filters, patientName: e.target.value})}
                  placeholder="e.g. Amina" 
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Date From</label>
              <input 
                type="date" 
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Date To</label>
                <input 
                  type="date" 
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <button 
                onClick={clearFilters}
                className="h-10 px-4 bg-neutral-100 text-neutral-600 text-sm font-bold rounded-xl hover:bg-neutral-200 transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 min-h-0 bg-white border border-neutral-100 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
            <h2 className="font-bold text-neutral-800 flex items-center gap-2 uppercase tracking-tight">
              Sessions <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-black tracking-widest">{filteredSessions.length}</span>
            </h2>
            <button 
              onClick={openAddPanel}
              className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-xl shadow-blue-500/20 flex items-center gap-2 active:scale-95"
            >
              <span className="text-lg leading-none">+</span> Add Session
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 bg-neutral-50/30">
                  <th className="p-6">Date</th>
                  <th className="p-6">Patient Name</th>
                  <th className="p-6">Diagnostic</th>
                  <th className="p-6">Amount</th>
                  <th className="p-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {loading ? (
                   <tr><td colSpan="5" className="p-20 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div></td></tr>
                ) : filteredSessions.length === 0 ? (
                  <tr><td colSpan="5" className="p-20 text-center text-neutral-400 font-medium italic">No sessions found matching filters.</td></tr>
                ) : filteredSessions.map((s) => {
                  const patient = patients.find(p => p.id === s.patient_id);
                  return (
                    <tr 
                      key={s.id} 
                      onClick={() => openViewModal(s, patient)}
                      className="group hover:bg-neutral-50 transition-all text-sm cursor-pointer"
                    >
                      <td className="p-6 font-mono text-neutral-500">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="p-6 font-bold text-neutral-800 capitalize">{patient ? patient.name : 'Unknown Patient'}</td>
                      <td className="p-6 text-neutral-500 font-medium">{s.diagnostic || '-'}</td>
                      <td className="p-6 font-bold text-emerald-600">{s.amount} DA</td>
                      <td className="p-6">
                        <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openEditPanel(s)} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center hover:bg-white hover:shadow-lg transition-all text-neutral-400 hover:text-blue-500">📝</button>
                          <button onClick={() => handleDelete(s.id)} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center hover:bg-white hover:shadow-lg transition-all text-neutral-400 hover:text-red-500">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sliding Sidebar Panel */}
        <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-neutral-100 ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white z-10">
              <h3 className="font-bold text-lg text-neutral-800">{isEditMode ? 'Edit Session' : 'Add New Session'}</h3>
              <button onClick={closePanel} className="text-neutral-400 hover:text-red-500 transition-colors text-xl">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 relative">
              {errorMsg && <div className="p-3 bg-red-100 text-red-600 rounded-xl text-xs font-bold mb-4">{errorMsg}</div>}
              
              {!isQuickAddPatientOpen ? (
                <form id="sessionForm" onSubmit={handleSaveSession} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Patient *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1" ref={patientDropdownRef}>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 text-neutral-300" size={16} />
                          <input
                            type="text"
                            placeholder="Rechercher par Nom, ID ou Téléphone..."
                            value={patientSearch}
                            onFocus={() => setIsPatientDropdownOpen(true)}
                            onChange={(e) => {
                              setPatientSearch(e.target.value);
                              setIsPatientDropdownOpen(true);
                              setTargetSession({ ...targetSession, patient_id: '' });
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                            required={!targetSession.patient_id}
                          />
                        </div>

                        {isPatientDropdownOpen && (
                          <div className="absolute w-full mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 max-h-[250px] overflow-auto ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredFormPatients.length > 0 ? (
                              <div className="p-2 space-y-1">
                                {filteredFormPatients.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSelectPatient(p)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                                      targetSession.patient_id === p.id 
                                        ? 'bg-blue-50 text-blue-600' 
                                        : 'hover:bg-neutral-50 text-neutral-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                                        <User size={14} className="text-neutral-400" />
                                      </div>
                                      <div className="text-left overflow-hidden">
                                        <p className="font-bold text-sm tracking-tight capitalize truncate">{p.name}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-400">
                                          <span className="font-mono bg-neutral-50 px-1 rounded">{p.patient_id}</span>
                                          {p.phone && (
                                            <span className="flex items-center gap-0.5 truncate"><Phone size={10} /> {p.phone}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {targetSession.patient_id === p.id && <Check size={16} />}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="p-6 text-center">
                                <p className="text-sm text-neutral-400 font-medium italic">Aucun patient trouvé</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {!isEditMode && (
                        <button 
                          type="button" 
                          onClick={() => setIsQuickAddPatientOpen(true)}
                          className="px-4 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition-colors shadow-sm"
                          title="Ajout rapide"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Date *</label>
                    <input 
                      type="date" 
                      value={targetSession.date}
                      onChange={(e) => setTargetSession({...targetSession, date: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Amount *</label>
                    <input 
                      type="number" 
                      value={targetSession.amount}
                      onChange={(e) => setTargetSession({...targetSession, amount: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Diagnostic</label>
                    <input 
                      type="text" 
                      value={targetSession.diagnostic}
                      onChange={(e) => setTargetSession({...targetSession, diagnostic: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Act</label>
                    <input 
                      type="text" 
                      value={targetSession.act}
                      onChange={(e) => setTargetSession({...targetSession, act: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Package (Optional)</label>
                    <select 
                      value={targetSession.package_id || ''}
                      onChange={(e) => setTargetSession({...targetSession, package_id: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">None</option>
                      {packages
                        .filter(pkg => !targetSession.patient_id || String(pkg.patient_id) === String(targetSession.patient_id))
                        .map(pkg => (
                        <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Notes</label>
                    <textarea 
                       value={targetSession.note}
                       onChange={(e) => setTargetSession({...targetSession, note: e.target.value})}
                       rows="3"
                       className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Radiographie</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={handleRadioSelect} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleRadioDrop}
                        className={`flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed py-6 rounded-2xl transition-all ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-neutral-200 hover:border-blue-300 hover:bg-neutral-50'}`}
                      >
                        <span className="text-[10px] font-bold text-neutral-500">{targetSession.radio_path ? 'Image sélectionnée (cliquez pour changer)' : 'Cliquer ou glisser une image'}</span>
                      </button>
                      {targetSession.radio_path && (
                        <button type="button" onClick={() => setTargetSession({...targetSession, radio_path: ''})} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-100">
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                <form id="quickAddPatientForm" onSubmit={handleQuickAddPatient} className="space-y-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-blue-800">Quick Add Patient</h4>
                    <button type="button" onClick={() => setIsQuickAddPatientOpen(false)} className="text-blue-400 hover:text-blue-600 text-sm">Cancel</button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-400 uppercase mb-2 ml-1">Full Name *</label>
                    <input 
                      type="text" 
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-blue-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-400 uppercase mb-2 ml-1">Phone *</label>
                    <input 
                      type="text" 
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-blue-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-blue-400 uppercase mb-2 ml-1">DOB</label>
                      <input 
                        type="date" 
                        value={newPatient.dob}
                        onChange={(e) => setNewPatient({...newPatient, dob: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-blue-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-blue-400 uppercase mb-2 ml-1">Gender</label>
                      <select 
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-blue-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option>Female</option>
                        <option>Male</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button 
                      type="submit"
                      className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
                    >
                      Save & Select Patient
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-neutral-100 bg-white flex gap-3 z-10">
              <button 
                type="button"
                onClick={closePanel}
                className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              {!isQuickAddPatientOpen && (
                <button 
                  type="submit"
                  form="sessionForm"
                  className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                >
                  Save Session
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Backdrop for panel */}
        {isPanelOpen && <div onClick={closePanel} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" />}

        {/* View Details Modal */}
        {isViewModalOpen && viewData && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                <h3 className="font-bold text-xl text-neutral-800">Session Details</h3>
                <button onClick={() => setIsViewModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 text-neutral-500 transition-colors">✕</button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Patient Info */}
                  <div className="space-y-4 bg-blue-50/30 p-6 rounded-2xl border border-blue-50">
                    <h4 className="font-black text-blue-800 uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><span>👤</span> Patient Information</h4>
                    <div className="space-y-3 text-sm">
                      <p><span className="text-neutral-400 font-bold w-24 inline-block">Name:</span> <span className="font-bold text-neutral-800 capitalize">{viewData.patient?.name || 'N/A'}</span></p>
                      <p><span className="text-neutral-400 font-bold w-24 inline-block">Phone:</span> <span className="font-medium text-neutral-700">{viewData.patient?.phone || 'N/A'}</span></p>
                      <p><span className="text-neutral-400 font-bold w-24 inline-block">DOB:</span> <span className="font-medium text-neutral-700">{viewData.patient?.dob || 'N/A'}</span></p>
                      <p><span className="text-neutral-400 font-bold w-24 inline-block">Gender:</span> <span className="font-medium text-neutral-700">{viewData.patient?.gender || 'N/A'}</span></p>
                      <p><span className="text-neutral-400 font-bold w-24 inline-block">Address:</span> <span className="font-medium text-neutral-700">{viewData.patient?.address || 'N/A'}</span></p>
                    </div>
                  </div>
                  {/* Session Info */}
                  <div className="space-y-4 bg-emerald-50/30 p-6 rounded-2xl border border-emerald-50">
                    <h4 className="font-black text-emerald-800 uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><span>🩺</span> Session Information</h4>
                    <div className="space-y-3 text-sm">
                      <p><span className="text-neutral-400 font-bold w-24 inline-block">Date:</span> <span className="font-bold text-neutral-800">{new Date(viewData.session.date).toLocaleDateString()}</span></p>
                      <p><span className="text-neutral-400 font-bold w-24 inline-block">Amount:</span> <span className="font-black text-emerald-600">{viewData.session.amount} DA</span></p>
                      <p><span className="text-neutral-400 font-bold w-24 inline-block">Diagnostic:</span> <span className="font-medium text-neutral-700">{viewData.session.diagnostic || 'N/A'}</span></p>
                      <p><span className="text-neutral-400 font-bold w-24 inline-block">Act:</span> <span className="font-medium text-neutral-700">{viewData.session.act || 'N/A'}</span></p>
                      <p><span className="text-neutral-400 font-bold w-24 inline-block">Package:</span> <span className="font-medium text-neutral-700">{packages.find(p => p.id === viewData.session.package_id)?.name || 'None'}</span></p>
                      <div className="pt-2 border-t border-emerald-100/50 mt-2">
                        <span className="text-neutral-400 font-bold block mb-1 text-xs uppercase tracking-wider">Notes</span>
                        <p className="font-medium text-neutral-700 bg-white p-3 rounded-xl border border-emerald-50 min-h-[60px]">{viewData.session.note || 'No notes available.'}</p>
                      </div>
                      {viewData.session.radio_path && (
                        <div className="pt-2 border-t border-emerald-100/50 mt-2">
                          <button 
                            onClick={() => window.api.openRadioFile(viewData.session.radio_path)}
                            className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                          >
                            🖼️ Ouvrir Radiographie
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditPanel(viewData.session);
                  }} 
                  className="px-8 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-all active:scale-95 flex items-center gap-2"
                >
                  📝 Edit Session
                </button>
                <button onClick={() => setIsViewModalOpen(false)} className="px-8 py-2.5 bg-neutral-800 text-white font-bold rounded-xl shadow-lg hover:bg-neutral-900 transition-all active:scale-95">Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default SessionManagement;
