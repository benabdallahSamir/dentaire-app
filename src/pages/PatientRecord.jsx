import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import SessionModal from '../components/SessionModal';
import PackageModal from '../components/PackageModal';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Layers, 
  ChevronRight,
  ChevronLeft,
  Plus,
  TrendingUp,
  Activity,
  CreditCard,
  DollarSign,
  FileText,
  Edit,
  Trash2,
  Stethoscope,
  FileSearch,
  Image as ImageIcon,
  X
} from 'lucide-react';

function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sessions');

  // Package detail inline state
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [subSessions, setSubSessions] = useState([]);
  const [isSubPaymentOpen, setIsSubPaymentOpen] = useState(false);
  const [isSubEditMode, setIsSubEditMode] = useState(false);
  const [targetSubSession, setTargetSubSession] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [subPaymentData, setSubPaymentData] = useState({
    amount: '', note: '', date: new Date().toISOString().split('T')[0],
    diagnostic: '', act: '', maladi: '', radio_path: ''
  });

  // Local Modal States
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [isSessionEditMode, setIsSessionEditMode] = useState(false);
  const [targetSession, setTargetSession] = useState(null);
  const [isPackageEditMode, setIsPackageEditMode] = useState(false);
  const [targetPackageToEdit, setTargetPackageToEdit] = useState(null);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const [patientRes, sessionsRes, packagesRes] = await Promise.all([
        window.api.getPatientById(id),
        window.api.getSessionsByPatient(id),
        window.api.getPackagesByPatient(id)
      ]);

      if (patientRes.success) setPatient(patientRes.patient);
      if (sessionsRes.success) setSessions(sessionsRes.sessions);
      if (packagesRes.success) setPackages(packagesRes.packages);
      
    } catch (err) {
      console.error("Failed to fetch patient records:", err);
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de charger les données.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageDetail = async (pkg) => {
    const sessRes = await window.api.getSessionsByPackage(pkg.id);
    if (sessRes.success) setSubSessions(sessRes.sessions);
    setSelectedPackage(pkg);
  };

  const handleOpenDetail = (session) => {
    setViewData({ session, patient });
    setIsViewModalOpen(true);
  };

  const handleSaveSession = async (formData) => {
    try {
      let result;
      if (isSessionEditMode && targetSession) {
        result = await window.api.updateSession(
          targetSession.id, formData.patient_id, formData.date, formData.amount, formData.note,
          targetSession.package_id, formData.diagnostic, formData.act, formData.maladi, formData.radio_path
        );
      } else {
        result = await window.api.createSession(
          formData.patient_id, formData.date, formData.amount, formData.note,
          null, formData.diagnostic, formData.act, formData.maladi, formData.radio_path
        );
      }

      if (result.success) {
        Swal.fire({ icon: 'success', title: isSessionEditMode ? 'Session Mise à jour' : 'Session Enregistrée', text: result.message, timer: 2000, showConfirmButton: false });
        setIsSessionModalOpen(false);
        setTargetSession(null);
        setIsSessionEditMode(false);
        fetchPatientData();
        // If we are editing a sub-session within a package, refresh those as well
        if (selectedPackage) {
          fetchPackageDetail(selectedPackage);
        }
      }
    } catch (err) { console.error("Save failed:", err); }
  };

  const handleSavePackage = async (formData) => {
    try {
      let result;
      if (isPackageEditMode && targetPackageToEdit) {
        result = await window.api.updatePackage(
          targetPackageToEdit.id, formData.patient_id, formData.name, formData.total_price, formData.diagnostic, formData.acr, formData.radio_path
        );
      } else {
        result = await window.api.createPackage(
          formData.patient_id, formData.name, formData.total_price, formData.diagnostic, formData.acr, formData.radio_path
        );
      }

      if (result.success) {
        Swal.fire({ icon: 'success', title: isPackageEditMode ? 'Plan Mis à jour' : 'Plan Établi', text: result.message, timer: 2000, showConfirmButton: false });
        setIsPackageModalOpen(false);
        setTargetPackageToEdit(null);
        setIsPackageEditMode(false);
        fetchPatientData();
        // If we were viewing the package, update the view state
        if (selectedPackage && (isPackageEditMode || selectedPackage.id === result.id)) {
          const updatedPackages = await window.api.getPackagesByPatient(id);
          if (updatedPackages.success) {
            const updated = updatedPackages.packages.find(p => p.id === (isPackageEditMode ? targetPackageToEdit.id : result.id));
            if (updated) setSelectedPackage(updated);
          }
        }
      }
    } catch (err) { console.error("Save failed:", err); }
  };

  const handleSaveSubSession = async (e) => {
    e.preventDefault();
    if (!subPaymentData.amount) return;
    try {
      let result;
      if (isSubEditMode && targetSubSession) {
        result = await window.api.updateSession(
          targetSubSession.id, selectedPackage.patient_id, subPaymentData.date,
          subPaymentData.amount, subPaymentData.note, selectedPackage.id,
          subPaymentData.diagnostic, subPaymentData.act, subPaymentData.maladi, subPaymentData.radio_path
        );
      } else {
        result = await window.api.createSession(
          selectedPackage.patient_id, subPaymentData.date, subPaymentData.amount,
          subPaymentData.note, selectedPackage.id,
          subPaymentData.diagnostic, subPaymentData.act, subPaymentData.maladi, subPaymentData.radio_path
        );
      }
      if (result.success) {
        Swal.fire({ icon: 'success', title: isSubEditMode ? 'Mis à jour' : 'Sous-session ajoutée', timer: 1500, showConfirmButton: false });
        setIsSubPaymentOpen(false);
        setIsSubEditMode(false);
        setTargetSubSession(null);
        setSubPaymentData({ amount: '', note: '', date: new Date().toISOString().split('T')[0], diagnostic: '', act: '', maladi: '', radio_path: '' });
        fetchPackageDetail(selectedPackage);
      }
    } catch (err) { console.error("Sub session save failed:", err); }
  };

  const handleEditSub = (s) => {
    setIsSubEditMode(true);
    setTargetSubSession(s);
    setSubPaymentData({ amount: s.amount||'', note: s.note||'', date: s.date||new Date().toISOString().split('T')[0], diagnostic: s.diagnostic||'', act: s.act||'', maladi: s.maladi||'', radio_path: s.radio_path||'' });
    setIsSubPaymentOpen(true);
  };

  const handleDeleteSub = async (s) => {
    const { isConfirmed } = await Swal.fire({ title: 'Supprimer?', text: `Supprimer ${s.session_id}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Oui, supprimer' });
    if (isConfirmed) {
      const result = await window.api.deleteSession(s.id);
      if (result.success) fetchPackageDetail(selectedPackage);
    }
  };

  const handleSubRadioSelect = async () => {
    const result = await window.api.selectRadioFile();
    if (result.success) setSubPaymentData(prev => ({ ...prev, radio_path: result.path }));
  };

  const handleSubRadioDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        Swal.fire({ icon: 'error', title: 'Format non supporté', text: 'PNG ou JPG uniquement.' });
        return;
      }
      if (file.path) {
        const result = await window.api.saveRadioFromPath(file.path);
        if (result.success) setSubPaymentData(prev => ({ ...prev, radio_path: result.path }));
      }
    }
  };

  const calculateTotalPaid = (sessions) => sessions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-full">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    </DashboardLayout>
  );

  if (!patient) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-2xl font-black text-neutral-400 uppercase tracking-widest">Patient introuvable</h1>
        <button onClick={() => navigate('/patient')} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Retour</button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500 pb-10">
        
        {/* Header Navigation */}
        <div className="flex items-center gap-4">
           <button 
            onClick={() => navigate('/patient')}
            className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-blue-500 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-0.5">Dossier Patient</h2>
            <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2">
              {patient.name}
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold ml-2">
                {patient.patient_id}
              </span>
            </h1>
          </div>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white border border-neutral-100 rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
           <div className="w-24 h-24 rounded-[32px] bg-blue-600 flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-blue-500/30 shrink-0">
             {patient.name.charAt(0).toUpperCase()}
           </div>
           <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><User size={12} className="text-blue-500" />Nom</p>
                <p className="text-sm font-bold text-neutral-900 capitalize">{patient.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Phone size={12} className="text-blue-500" />Téléphone</p>
                <p className="text-sm font-bold text-neutral-900">{patient.phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CalendarIcon size={12} className="text-blue-500" />Date de naissance</p>
                <p className="text-sm font-bold text-neutral-900">{patient.dob || '---'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><span className="text-blue-500 text-xs">🚻</span>Genre</p>
                <p className="text-sm font-bold text-neutral-900 capitalize">{patient.gender}</p>
              </div>
              <div className="md:col-span-4 mt-2">
                 <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin size={12} className="text-blue-500" />Adresse</p>
                <p className="text-sm font-medium text-neutral-500 leading-relaxed italic">
                  {patient.address || 'Aucune adresse renseignée.'}
                </p>
              </div>
           </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-4 p-1 bg-neutral-100 w-fit rounded-2xl">
          <button 
            onClick={() => { setActiveTab('sessions'); setSelectedPackage(null); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sessions' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            Sessions Simples
          </button>
          <button 
            onClick={() => setActiveTab('packages')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'packages' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            Plans de Traitement
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white border border-neutral-100 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
          
          {/* ─── SINGLE SESSIONS ─── */}
          {activeTab === 'sessions' && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
               <div className="p-8 border-b border-neutral-100 bg-neutral-50/30 flex justify-between items-center">
                 <h3 className="font-black text-neutral-900 uppercase tracking-tight flex items-center gap-3">
                   <Clock className="text-blue-500" size={20} />
                   Historique des Sessions
                   <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{sessions.length}</span>
                 </h3>
                 <button 
                   onClick={() => { setIsSessionEditMode(false); setTargetSession(null); setIsSessionModalOpen(true); }}
                   className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                 >
                   <Plus size={14} strokeWidth={3} />
                   Nouvelle Session
                 </button>
               </div>
               <div className="flex-1 overflow-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="sticky top-0 bg-neutral-50 z-10">
                     <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                       <th className="px-8 py-4">ID</th>
                       <th className="px-8 py-4">Date</th>
                       <th className="px-8 py-4">Montant</th>
                       <th className="px-8 py-4">Note</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-50">
                     {sessions.length === 0 ? (
                       <tr><td colSpan="4" className="py-20 text-center text-neutral-300 font-bold italic uppercase text-xs">Aucune session enregistrée.</td></tr>
                     ) : sessions.map(s => (
                       <tr key={s.id} onClick={() => handleOpenDetail(s)} className="hover:bg-neutral-50/50 transition-all text-sm cursor-pointer group">
                         <td className="px-8 py-5 font-mono text-neutral-400 text-xs">{s.session_id}</td>
                         <td className="px-8 py-5 font-bold text-neutral-900">{s.date}</td>
                         <td className="px-8 py-5"><span className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{Number(s.amount).toLocaleString()} DA</span></td>
                         <td className="px-8 py-5 flex items-center justify-between">
                           <span className="text-neutral-500 italic line-clamp-1 max-w-xs">{s.note || '---'}</span>
                           <ChevronRight size={14} className="text-neutral-300 group-hover:text-blue-500 transition-colors" />
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* ─── PACKAGES LIST ─── */}
          {activeTab === 'packages' && !selectedPackage && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="p-8 border-b border-neutral-100 bg-neutral-50/30 flex justify-between items-center">
                 <h3 className="font-black text-neutral-900 uppercase tracking-tight flex items-center gap-3">
                   <Layers className="text-blue-500" size={20} />
                   Plans de Traitement
                   <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{packages.length}</span>
                 </h3>
                 <button 
                   onClick={() => { setIsPackageEditMode(false); setTargetPackageToEdit(null); setIsPackageModalOpen(true); }}
                   className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                 >
                   <Plus size={14} strokeWidth={3} />
                   Nouveau Plan
                 </button>
               </div>
               <div className="flex-1 overflow-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="sticky top-0 bg-neutral-50 z-10">
                     <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                       <th className="px-8 py-4">Plan ID</th>
                       <th className="px-8 py-4">Traitement</th>
                       <th className="px-8 py-4">Budget Total</th>
                       <th className="px-8 py-4">Date</th>
                       <th className="px-8 py-4 text-right">Accéder</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-50">
                     {packages.length === 0 ? (
                       <tr><td colSpan="5" className="py-20 text-center text-neutral-300 font-bold italic uppercase text-xs">Aucun plan de traitement établi.</td></tr>
                     ) : packages.map(pkg => (
                       <tr key={pkg.id} onClick={() => fetchPackageDetail(pkg)} className="group hover:bg-neutral-50/50 transition-all text-sm cursor-pointer">
                         <td className="px-8 py-5"><span className="text-[10px] font-mono font-black text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded tracking-tighter uppercase">{pkg.package_id}</span></td>
                         <td className="px-8 py-5 font-bold text-neutral-900 capitalize group-hover:text-blue-500 transition-colors">{pkg.name}</td>
                         <td className="px-8 py-5"><span className="font-black text-neutral-900">{Number(pkg.total_price).toLocaleString()} DA</span></td>
                         <td className="px-8 py-5"><span className="text-[10px] font-black text-neutral-500 uppercase flex items-center gap-1"><CalendarIcon size={12} /> {pkg.created_at.split(/[ T]/)[0]}</span></td>
                         <td className="px-8 py-5 text-right">
                           <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all ml-auto">
                             <ChevronRight size={16} />
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* ─── PACKAGE DETAIL INLINE ─── */}
          {activeTab === 'packages' && selectedPackage && (() => {
            const totalPaid = calculateTotalPaid(subSessions);
            const remaining = selectedPackage.total_price - totalPaid;
            const progress = Math.min((totalPaid / selectedPackage.total_price) * 100, 100);

            return (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Sub-header */}
                <div className="p-8 border-b border-neutral-100 bg-neutral-50/30 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedPackage(null)} className="flex items-center gap-2 text-neutral-400 hover:text-blue-500 transition-colors text-xs font-black uppercase tracking-widest">
                      <ChevronLeft size={14} strokeWidth={3} /> Retour aux Plans
                    </button>
                    <div className="w-px h-6 bg-neutral-200"></div>
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400">{selectedPackage.package_id}</span>
                        <h3 className="font-black text-neutral-900 capitalize">{selectedPackage.name}</h3>
                      </div>
                      <button 
                        onClick={() => {
                          setIsPackageEditMode(true);
                          setTargetPackageToEdit(selectedPackage);
                          setIsPackageModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95 border border-blue-100"
                      >
                        <Edit size={14} strokeWidth={3} /> Modifier le Plan
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsSubEditMode(false); setTargetSubSession(null); setSubPaymentData({ amount: '', note: '', date: new Date().toISOString().split('T')[0], diagnostic: '', act: '', maladi: '', radio_path: '' }); setIsSubPaymentOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    <Plus size={14} strokeWidth={3} /> Ajouter Sous-Session
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="px-8 py-5 border-b border-neutral-50 bg-white grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Budget Total</p>
                    <p className="text-xl font-black text-neutral-900">{Number(selectedPackage.total_price).toLocaleString()} <span className="text-xs text-neutral-400">DA</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Payé</p>
                    <p className="text-xl font-black text-blue-600">{totalPaid.toLocaleString()} <span className="text-xs">DA</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Reste</p>
                    <p className={`text-xl font-black ${remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{remaining.toLocaleString()} <span className="text-xs">DA</span></p>
                  </div>
                  <div className="col-span-3">
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] text-neutral-400 font-bold mt-1.5">{Math.round(progress)}% réglé</p>
                  </div>
                </div>

                {/* Sub-sessions table */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-neutral-50 z-10">
                      <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
                        <th className="px-8 py-4">ID</th>
                        <th className="px-8 py-4">Date</th>
                        <th className="px-8 py-4">Montant</th>
                        <th className="px-8 py-4">Diagnostic</th>
                        <th className="px-8 py-4">Acte</th>
                        <th className="px-8 py-4">Note</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {subSessions.length === 0 ? (
                        <tr><td colSpan="7" className="py-20 text-center text-neutral-300 font-bold italic uppercase text-xs">Aucune sous-session enregistrée.</td></tr>
                      ) : subSessions.map(s => (
                        <tr key={s.id} onClick={() => handleOpenDetail(s)} className="hover:bg-blue-50/30 transition-all text-sm group cursor-pointer">
                          <td className="px-8 py-5 font-mono text-neutral-400 text-xs">{s.session_id}</td>
                          <td className="px-8 py-5 font-bold text-neutral-900">{s.date}</td>
                          <td className="px-8 py-5"><span className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{Number(s.amount).toLocaleString()} DA</span></td>
                          <td className="px-8 py-5 max-w-[150px]"><span className="text-neutral-600 text-xs line-clamp-2">{s.diagnostic || '---'}</span></td>
                          <td className="px-8 py-5 max-w-[150px]"><span className="text-neutral-600 text-xs line-clamp-2">{s.act || '---'}</span></td>
                          <td className="px-8 py-5"><span className="text-neutral-500 italic text-xs line-clamp-1">{s.note || '---'}</span></td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleEditSub(s); }} className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-white rounded-xl border border-transparent hover:border-neutral-200 transition-all"><Edit size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSub(s); }} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-white rounded-xl border border-transparent hover:border-neutral-200 transition-all"><Trash2 size={14} /></button>
                              </div>
                              <div onClick={() => handleOpenDetail(s)} className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all ml-1">
                                <ChevronRight size={16} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>

        {/* ─── SUB-SESSION FORM MODAL ─── */}
        {isSubPaymentOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-end animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSubPaymentOpen(false)} />
            <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
              <div className="p-8 border-b border-neutral-100 sticky top-0 bg-white z-10 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-neutral-900">{isSubEditMode ? 'Modifier Sous-Session' : 'Nouvelle Sous-Session'}</h3>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">{selectedPackage?.package_id} — {selectedPackage?.name}</p>
                </div>
                <button onClick={() => setIsSubPaymentOpen(false)} className="w-10 h-10 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-all">
                  <X size={20} />
                </button>
              </div>
              <form id="subSessionForm" onSubmit={handleSaveSubSession} className="flex flex-col flex-1 min-h-0">
                {/* Scrollable fields area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {/* Amount */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Montant *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-3.5 text-neutral-300" size={16} />
                      <input type="number" required value={subPaymentData.amount} onChange={e => setSubPaymentData({...subPaymentData, amount: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl font-black text-sm focus:outline-none focus:border-blue-500" placeholder="ex: 5000" />
                    </div>
                  </div>
                  {/* Date */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-3.5 text-neutral-300" size={16} />
                      <input type="date" required value={subPaymentData.date} onChange={e => setSubPaymentData({...subPaymentData, date: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl font-bold text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Données Cliniques</p>
                  </div>

                  {/* Maladie */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Maladie / Antécédents</label>
                    <div className="relative">
                      <Activity className="absolute left-4 top-3.5 text-neutral-300" size={16} />
                      <input type="text" value={subPaymentData.maladi} onChange={e => setSubPaymentData({...subPaymentData, maladi: e.target.value})} placeholder="ex: Diabète..." className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  {/* Diagnostic */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Diagnostic</label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-4 text-neutral-300" size={16} />
                      <textarea value={subPaymentData.diagnostic} onChange={e => setSubPaymentData({...subPaymentData, diagnostic: e.target.value})} rows="2" placeholder="Description..." className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  {/* Acte */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Acte Dentaire</label>
                    <div className="relative">
                      <FileSearch className="absolute left-4 top-4 text-neutral-300" size={16} />
                      <textarea value={subPaymentData.act} onChange={e => setSubPaymentData({...subPaymentData, act: e.target.value})} rows="2" placeholder="Acte effectué..." className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Notes</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 text-neutral-300" size={16} />
                      <textarea value={subPaymentData.note} onChange={e => setSubPaymentData({...subPaymentData, note: e.target.value})} rows="2" placeholder="Observations..." className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  {/* Radio */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Radiographie</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={handleSubRadioSelect} onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleSubRadioDrop}
                        className={`flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed py-6 rounded-3xl transition-all ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-neutral-200 hover:border-blue-300 hover:bg-neutral-50'}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDragging ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                          <ImageIcon size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500">{subPaymentData.radio_path ? 'Fichier Prêt — Changer' : 'Cliquer ou glisser une image'}</span>
                      </button>
                      {subPaymentData.radio_path && (
                        <button type="button" onClick={() => setSubPaymentData({...subPaymentData, radio_path: ''})} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    {subPaymentData.radio_path && (
                      <div className="flex items-center gap-2 mt-2 ml-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-[10px] font-mono text-neutral-400 truncate">{subPaymentData.radio_path}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fixed footer buttons */}
                <div className="flex gap-4 p-6 border-t border-neutral-100 bg-white shrink-0">
                  <button type="button" onClick={() => setIsSubPaymentOpen(false)} className="flex-1 py-4 bg-neutral-100 text-neutral-700 font-black rounded-2xl hover:bg-neutral-200 transition-all text-xs uppercase tracking-widest">Annuler</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest">
                    {isSubEditMode ? 'Enregistrer' : 'Confirmer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Session + Package creation modals */}
        <SessionModal 
          isOpen={isSessionModalOpen}
          onClose={() => { setIsSessionModalOpen(false); setTargetSession(null); setIsSessionEditMode(false); }}
          onSave={handleSaveSession}
          targetSession={targetSession}
          isEditMode={isSessionEditMode}
          defaultPatientId={patient.id}
          lockedPatient={true}
        />
        <PackageModal 
          isOpen={isPackageModalOpen}
          onClose={() => { setIsPackageModalOpen(false); setTargetPackageToEdit(null); setIsPackageEditMode(false); }}
          onSave={handleSavePackage}
          targetPackage={targetPackageToEdit}
          isEditMode={isPackageEditMode}
          defaultPatientId={patient.id}
          lockedPatient={true}
        />

      </div>
      {/* View Details Modal */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <h3 className="font-black text-lg text-neutral-800 uppercase tracking-tight">Détails de la Session</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 text-neutral-500 transition-colors">✕</button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Date</p>
                    <p className="text-sm font-bold text-neutral-900">{viewData.session.date}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Montant</p>
                    <p className="text-sm font-black text-blue-600">{Number(viewData.session.amount).toLocaleString()} DA</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2">Diagnostic</p>
                    <div className="bg-white border border-neutral-100 p-4 rounded-2xl text-sm font-medium text-neutral-700 min-h-[50px]">
                      {viewData.session.diagnostic || '---'}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2">Acte effectué</p>
                    <div className="bg-white border border-neutral-100 p-4 rounded-2xl text-sm font-medium text-neutral-700 min-h-[50px]">
                      {viewData.session.act || '---'}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2">Maladie / Antécédents</p>
                    <div className="bg-white border border-neutral-100 p-4 rounded-2xl text-sm font-medium text-neutral-700 min-h-[50px]">
                      {viewData.session.maladi || '---'}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2">Note / Observations</p>
                    <div className="bg-white border border-neutral-100 p-4 rounded-2xl text-sm font-medium text-neutral-700 italic min-h-[50px]">
                      {viewData.session.note || '---'}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100">
                  {viewData.session.radio_path ? (
                    <button 
                      onClick={() => window.api.openRadioFile(viewData.session.radio_path)}
                      className="w-full py-4 bg-neutral-900 text-white font-black rounded-2xl shadow-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                    >
                      <ImageIcon size={16} /> Ouvrir Radiographie
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-neutral-50 text-neutral-400 font-bold rounded-2xl border border-dashed border-neutral-200 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
                      <ImageIcon size={14} className="opacity-50" /> Pas de radiographie attachée
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsSessionEditMode(true);
                  setTargetSession(viewData.session);
                  setIsSessionModalOpen(true);
                }} 
                className="px-8 py-3 bg-blue-50 text-blue-600 font-black rounded-2xl shadow-sm hover:bg-blue-100 transition-all text-[10px] uppercase tracking-widest flex items-center gap-2 border border-blue-100"
              >
                <Edit size={14} strokeWidth={3} /> Modifier la Session
              </button>
              <button onClick={() => setIsViewModalOpen(false)} className="px-8 py-3 bg-white border border-neutral-200 text-neutral-700 font-black rounded-2xl shadow-sm hover:bg-neutral-50 transition-all text-xs uppercase tracking-widest">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default PatientRecord;
