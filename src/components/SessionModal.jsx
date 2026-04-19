import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { X, Search, User, Phone, Check, Activity, Stethoscope, FileSearch, Image as ImageIcon } from 'lucide-react';

function SessionModal({ isOpen, onClose, onSave, targetSession, isEditMode, defaultPatientId, lockedPatient }) {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const dropdownRef = useRef(null);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    note: '',
    diagnostic: '',
    act: '',
    maladi: '',
    radio_path: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && targetSession) {
        setFormData({
          patient_id: targetSession.patient_id || '',
          date: targetSession.date || new Date().toISOString().split('T')[0],
          amount: targetSession.amount || '',
          note: targetSession.note || '',
          diagnostic: targetSession.diagnostic || '',
          act: targetSession.act || '',
          maladi: targetSession.maladi || '',
          radio_path: targetSession.radio_path || ''
        });
        // Pre-fill search if it's edit mode
        setPatientSearch(targetSession.patient_name || '');
      } else if (defaultPatientId) {
        // Pre-fill if a default patient ID is passed
        const patient = patients.find(p => String(p.id) === String(defaultPatientId));
        if (patient) {
          setFormData({
            patient_id: patient.id,
            date: new Date().toISOString().split('T')[0],
            amount: '',
            note: '',
            diagnostic: '',
            act: '',
            maladi: '',
            radio_path: ''
          });
          setPatientSearch(patient.name);
        }
      } else {
        setFormData({
          patient_id: '',
          date: new Date().toISOString().split('T')[0],
          amount: '',
          note: '',
          diagnostic: '',
          act: '',
          maladi: '',
          radio_path: ''
        });
        setPatientSearch('');
      }
    }
  }, [isOpen, isEditMode, targetSession, defaultPatientId, patients]);

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

  const handleFileSelect = async () => {
    try {
      if (!window.api || !window.api.selectRadioFile) {
        throw new Error("File selection API not available");
      }
      
      const result = await window.api.selectRadioFile();
      if (result.success) {
        setFormData({ ...formData, radio_path: result.path });
      } else if (result.message) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message,
        });
      }
    } catch (err) {
      console.error("File selection failed:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Impossible d\'ouvrir le sélecteur de fichiers.',
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validTypes = ['image/jpeg', 'image/png'];
      
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Format non supporté',
          text: 'Veuillez déposer une image (PNG, JPG). Les PDF ne sont pas supportés pour la visualisation directe.',
        });
        return;
      }

      // Check for path (Electron specific)
      if (file.path) {
        const result = await window.api.saveRadioFromPath(file.path);
        if (result.success) {
          setFormData({ ...formData, radio_path: result.path });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: result.message || 'Échec de la sauvegarde du fichier.',
          });
        }
      }
    }
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
        className={`fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-neutral-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
            <h3 className="font-bold text-lg text-neutral-800">
              {isEditMode ? 'Edit Session' : t('sessions.single.add')}
            </h3>
            <button onClick={onClose} className="text-neutral-400 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
              {/* Searchable Patient Field - Hidden if locked */}
              {!lockedPatient && (
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
                      className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>

                  {/* Dropdown List */}
                  {isDropdownOpen && (
                    <div className="absolute w-full mt-2 bg-white border border-neutral-200 rounded-2xl shadow-xl z-10 max-h-[300px] overflow-auto ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                      {filteredPatients.length > 0 ? (
                        <div className="p-2 py-3 space-y-1">
                          {filteredPatients.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPatient(p)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                                formData.patient_id === p.id 
                                  ? 'bg-blue-50 text-blue-600' 
                                  : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                                  <User size={14} className="text-neutral-400" />
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-sm tracking-tight capitalize">{p.name}</p>
                                  <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-400">
                                    <span className="font-mono bg-neutral-50 px-1 rounded">{p.patient_id}</span>
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
              )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">
                  {t('sessions.table.date')} *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
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
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
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
                rows="3"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all mb-4"
                placeholder="Remarques générales..."
              />

              <div className="space-y-6 pt-4 border-t border-neutral-100">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Données Cliniques</h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Maladie / Antécédents</label>
                  <div className="relative">
                     <Activity className="absolute left-4 top-3.5 text-neutral-300" size={16} />
                     <input
                      type="text"
                      value={formData.maladi}
                      onChange={(e) => setFormData({ ...formData, maladi: e.target.value })}
                      placeholder="e.g. Diabète, Hypertension..."
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Diagnostic</label>
                  <div className="relative">
                     <Stethoscope className="absolute left-4 top-4 text-neutral-300" size={16} />
                     <textarea
                      value={formData.diagnostic}
                      onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
                      rows="3"
                      placeholder="Description du diagnostic..."
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Acte Dentaire</label>
                  <div className="relative">
                     <FileSearch className="absolute left-4 top-4 text-neutral-300" size={16} />
                     <textarea
                      value={formData.act}
                      onChange={(e) => setFormData({ ...formData, act: e.target.value })}
                      rows="3"
                      placeholder="Détails de l'acte effectué..."
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-2 ml-1">Radiographie (Radio)</label>
                   <div className="flex items-center gap-4">
                      <button 
                        type="button"
                        onClick={handleFileSelect}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed py-8 rounded-3xl transition-all group ${
                          isDragging 
                            ? 'border-blue-500 bg-blue-50/50 scale-[0.98]' 
                            : 'border-neutral-200 hover:border-blue-300 hover:bg-neutral-50'
                        }`}
                      >
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                           isDragging ? 'bg-blue-600 text-white animate-bounce' : 'bg-neutral-100 text-neutral-400 group-hover:bg-blue-100 group-hover:text-blue-500'
                         }`}>
                            <ImageIcon size={24} />
                         </div>
                         <div className="text-center px-4">
                            <span className="block text-xs font-black text-neutral-700 uppercase tracking-tight">
                              {formData.radio_path ? 'Fichier Prêt' : 'Joindre une Radio'}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium">
                              {formData.radio_path ? 'Cliquez pour changer' : 'Cliquez ou Glissez un fichier ici'}
                            </span>
                         </div>
                      </button>
                      {formData.radio_path && (
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, radio_path: ''})}
                          className="px-5 bg-red-50 text-red-500 rounded-3xl hover:bg-red-100 transition-colors h-[116px] flex items-center justify-center"
                        >
                           <X size={20} />
                        </button>
                      )}
                   </div>
                   {formData.radio_path && (
                     <div className="flex items-center gap-2 mt-3 ml-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-[10px] font-mono text-neutral-400 truncate max-w-xs">{formData.radio_path}</p>
                     </div>
                   )}
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-all text-sm"
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
