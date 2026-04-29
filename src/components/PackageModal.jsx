import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, User, Phone, Check, Layers, DollarSign, FileText } from 'lucide-react';

function PackageModal({ isOpen, onClose, onSave, targetPackage, isEditMode, defaultPatientId, lockedPatient }) {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dropdownRef = useRef(null);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    name: '',
    total_price: '',
    diagnostic: '',
    acr: '',
    radio_path: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && targetPackage) {
        setFormData({
          patient_id: targetPackage.patient_id || '',
          name: targetPackage.name || '',
          total_price: targetPackage.total_price || '',
          diagnostic: targetPackage.diagnostic || '',
          acr: targetPackage.acr || '',
          radio_path: targetPackage.radio_path || ''
        });
        if (targetPackage.patient_name) {
          setPatientSearch(targetPackage.patient_name);
        } else {
          const patient = patients.find(p => p.id === targetPackage.patient_id);
          setPatientSearch(patient ? patient.name : '');
        }
      } else if (defaultPatientId) {
        // Pre-fill if a default patient ID is passed
        const patient = patients.find(p => String(p.id) === String(defaultPatientId));
        if (patient) {
          setFormData({
            patient_id: patient.id,
            name: '',
            total_price: '',
            diagnostic: '',
            acr: '',
            radio_path: ''
          });
          setPatientSearch(patient.name);
        }
      } else {
        setFormData({
          patient_id: '',
          name: '',
          total_price: '',
          diagnostic: '',
          acr: '',
          radio_path: ''
        });
        setPatientSearch('');
      }
    }
  }, [isOpen, isEditMode, targetPackage, defaultPatientId, patients]);

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

  const handleRadioSelect = async () => {
    const filePath = await window.api.selectRadioFile();
    if (filePath) {
      setFormData({ ...formData, radio_path: filePath });
    }
  };

  const handleRadioDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const filePath = file.path; 
      setFormData({ ...formData, radio_path: filePath });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patient_id) return;
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className={`fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-neutral-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
            <div>
              <h3 className="font-black text-xl text-neutral-900">
                {isEditMode ? 'Edit Plan' : t('sessions.multiple.add')}
              </h3>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Treatment Configuration</p>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 space-y-8">
              {/* Searchable Patient Field - Hidden if locked */}
              {!lockedPatient && (
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">
                    {t('sessions.table.patient')} *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <User className="text-blue-500" size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by Name, ID or Phone..."
                      value={patientSearch}
                      onFocus={() => setIsDropdownOpen(true)}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      className="w-full pl-16 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-bold shadow-sm"
                      required
                    />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute w-full mt-3 bg-white border border-neutral-200 rounded-3xl shadow-2xl z-10 max-h-[350px] overflow-auto ring-1 ring-black/5 animate-in fade-in slide-in-from-top-4 duration-300 p-2">
                      {filteredPatients.length > 0 ? (
                        <div className="space-y-1">
                          {filteredPatients.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPatient(p)}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                                formData.patient_id === p.id 
                                  ? 'bg-blue-50 text-blue-600' 
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center font-black text-xs">
                                  {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                  <p className="font-black text-sm tracking-tight capitalize">{p.name}</p>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                                    <span className="bg-neutral-100 px-1.5 py-0.5 rounded-md font-mono">{p.patient_id}</span>
                                    {p.phone && <span className="flex items-center gap-1">| {p.phone}</span>}
                                  </div>
                                </div>
                              </div>
                              {formData.patient_id === p.id && <Check size={18} strokeWidth={3} />}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 text-center">
                          <p className="text-sm text-neutral-400 font-bold italic">No patients matched</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            <div className="space-y-6">
               <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">
                  Plan Name *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Layers className="text-emerald-500" size={16} />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dental Implants, Orthodontics..."
                    className="w-full pl-16 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 transition-all font-bold shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">
                  Total Plan Budget *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <DollarSign className="text-amber-500" size={16} />
                  </div>
                  <input
                    type="number"
                    value={formData.total_price}
                    onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
                    placeholder="e.g. 50000"
                    className="w-full pl-16 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-amber-500 transition-all font-black shadow-sm"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">DA</div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">
                  Acte / ACR
                </label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                    <FileText className="text-neutral-500" size={16} />
                  </div>
                  <input
                    type="text"
                    value={formData.acr}
                    onChange={(e) => setFormData({ ...formData, acr: e.target.value })}
                    placeholder="e.g. Consultation..."
                    className="w-full pl-16 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">
                  Diagnostic
                </label>
                <div className="relative">
                   <div className="absolute left-4 top-5 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                    <FileText className="text-neutral-500" size={16} />
                  </div>
                  <textarea
                    value={formData.diagnostic}
                    onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
                    rows="3"
                    placeholder="Describe the treatment plan diagnostic..."
                    className="w-full pl-16 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">
                  Radiographie
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleRadioSelect} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleRadioDrop}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed py-6 rounded-2xl transition-all ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-neutral-200 hover:border-blue-300 hover:bg-neutral-50'}`}
                  >
                    <span className="text-[10px] font-bold text-neutral-500">{formData.radio_path ? 'Image sélectionnée (cliquez pour changer)' : 'Cliquer ou glisser une image'}</span>
                  </button>
                  {formData.radio_path && (
                    <button type="button" onClick={() => setFormData({...formData, radio_path: ''})} className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-100">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-5 bg-neutral-100 text-neutral-700 font-black rounded-2xl hover:bg-neutral-200 transition-all text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                {isEditMode ? 'Update Plan' : 'Establish Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div 
        onClick={onClose} 
        className={`fixed inset-0 bg-black/40 backdrop-blur-md z-40 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      />
    </>
  );
}

export default PackageModal;
