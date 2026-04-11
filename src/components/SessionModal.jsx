import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, User, Phone, Check } from 'lucide-react';

function SessionModal({ isOpen, onClose, onSave, targetSession, isEditMode }) {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const dropdownRef = useRef(null);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    note: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      if (isEditMode && targetSession) {
        setFormData({
          patient_id: targetSession.patient_id || '',
          date: targetSession.date || '',
          amount: targetSession.amount || '',
          note: targetSession.note || ''
        });
        // Pre-fill search if it's edit mode
        setPatientSearch(targetSession.patient_name || '');
      } else {
        setFormData({
          patient_id: '',
          date: new Date().toISOString().split('T')[0],
          amount: '',
          note: ''
        });
        setPatientSearch('');
      }
    }
  }, [isOpen, isEditMode, targetSession]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPatients = async () => {
    const result = await window.api.getPatients();
    if (result.success) setPatients(result.patients);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.phone && p.phone.includes(patientSearch))
  );

  const handleSelectPatient = (p) => {
    setFormData({ ...formData, patient_id: p.id });
    setPatientSearch(p.name);
    setIsDropdownOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patient_id) {
       // Optional: Add some warning if patient not selected from list
       return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className={`fixed inset-y-0 right-0 w-[400px] bg-white dark:bg-neutral-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-neutral-100 dark:border-neutral-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-black/20">
            <h3 className="font-bold text-lg text-neutral-800 dark:text-white">
              {isEditMode ? 'Edit Session' : t('sessions.single.add')}
            </h3>
            <button onClick={onClose} className="text-neutral-400 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
            {/* Searchable Patient Field */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">
                {t('sessions.table.patient')} *
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-neutral-300" size={16} />
                <input
                  type="text"
                  placeholder="Search by Name, ID or Phone..."
                  value={patientSearch}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all font-medium"
                  required
                />
              </div>

              {/* Dropdown List */}
              {isDropdownOpen && (
                <div className="absolute w-full mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-10 max-h-[300px] overflow-auto ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredPatients.length > 0 ? (
                    <div className="p-2 py-3 space-y-1">
                      {filteredPatients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                            formData.patient_id === p.id 
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              <User size={14} className="text-neutral-400" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-sm tracking-tight capitalize">{p.name}</p>
                              <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-400">
                                <span className="font-mono bg-neutral-50 dark:bg-neutral-950 px-1 rounded">{p.patient_id}</span>
                                {p.phone && (
                                  <span className="flex items-center gap-0.5"><Phone size={10} /> {p.phone}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {formData.patient_id === p.id && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-neutral-400 font-medium italic">No patients found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">
                  {t('sessions.table.date')} *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">
                  {t('sessions.table.price')}
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 2000"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">
                {t('sessions.table.note')}
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows="6"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all"
                placeholder="Details about the session..."
              />
            </div>

            <div className="pt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 text-sm"
              >
                Save Session
              </button>
            </div>
          </form>
        </div>
      </div>
      <div 
        onClick={onClose} 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      />
    </>
  );
}

export default SessionModal;
