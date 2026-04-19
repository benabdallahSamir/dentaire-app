import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import PackageModal from '../components/PackageModal';
import ReceiptPreviewModal from '../components/ReceiptPreviewModal';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit,
  ChevronRight, 
  CreditCard, 
  Calendar, 
  User, 
  TrendingUp, 
  Activity, 
  ArrowLeft,
  DollarSign,
  FileText,
  Clock,
  ArrowUpRight,
  Layers,
  X,
  Printer,
  Stethoscope,
  FileSearch,
  Image as ImageIcon
} from 'lucide-react';

function MultipleSessions() {
  const { t } = useTranslation();
  const { id: urlId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [subSessions, setSubSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterExactDate, setFilterExactDate] = useState('');
  const [filterTreatment, setFilterTreatment] = useState('all');
  
  // Modals
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubSessionEditMode, setIsSubSessionEditMode] = useState(false);
  const [targetSubSession, setTargetSubSession] = useState(null);
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
    diagnostic: '',
    act: '',
    maladi: '',
    radio_path: ''
  });
  const [isDragging, setIsDragging] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const [pkgsRes, sessionsRes] = await Promise.all([
        window.api.getPackages(),
        window.api.getSessions()
      ]);
      if (pkgsRes.success) {
        let pkgs = pkgsRes.packages;
        if (sessionsRes && sessionsRes.success) {
          pkgs = pkgs.map(p => {
             const subSess = sessionsRes.sessions.filter(s => s.package_id === p.id);
             return { ...p, subSessionsCount: subSess.length };
          });
        }
        setPackages(pkgs);
      }
    } catch (err) {
      console.error("Failed to fetch packages:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageDetails = async (pkgId) => {
    try {
      const pkgRes = await window.api.getPackageById(pkgId);
      const sessionsRes = await window.api.getSessionsByPackage(pkgId);
      
      if (pkgRes.success) setSelectedPackage(pkgRes.package);
      if (sessionsRes.success) setSubSessions(sessionsRes.sessions);
    } catch (err) {
      console.error("Failed to fetch package details:", err);
    }
  };

  useEffect(() => {
    fetchPackages();
    if (urlId) {
      fetchPackageDetails(urlId);
    }
  }, [urlId]);

  useEffect(() => {
    const patientId = searchParams.get('patientId');
    const action = searchParams.get('action');
    if (action === 'add' && patientId) {
      setIsEditMode(false);
      setSelectedPackage(null);
      setIsPackageModalOpen(true);
    }
  }, [searchParams]);

  const handleCreatePackage = async (formData) => {
    try {
      let result;
      if (isEditMode) {
        result = await window.api.updatePackage(selectedPackage.id, formData.name, formData.total_price, formData.note);
      } else {
        result = await window.api.createPackage(formData.patient_id, formData.name, formData.total_price, formData.note);
      }

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: t('sessions.multiple.title'),
          text: result.message,
          timer: 2000,
          showConfirmButton: false,
          background: 'var(--swal-bg)',
          color: 'var(--swal-color)'
        });
        setIsPackageModalOpen(false);
        fetchPackages();
        if (isEditMode) fetchPackageDetails(selectedPackage.id);
      }
    } catch (err) {
      console.error("Package operation failed:", err);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.amount) return;

    try {
      let result;
      if (isSubSessionEditMode && targetSubSession) {
        result = await window.api.updateSession(
          targetSubSession.id,
          selectedPackage.patient_id,
          paymentData.date,
          paymentData.amount,
          paymentData.note,
          selectedPackage.id,
          paymentData.diagnostic,
          paymentData.act,
          paymentData.maladi,
          paymentData.radio_path
        );
      } else {
        result = await window.api.createSession(
          selectedPackage.patient_id,
          paymentData.date,
          paymentData.amount,
          paymentData.note,
          selectedPackage.id,
          paymentData.diagnostic,
          paymentData.act,
          paymentData.maladi,
          paymentData.radio_path
        );
      }

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: isSubSessionEditMode ? 'Mise à jour' : 'Sous-session enregistrée',
          text: result.message,
          timer: 1500,
          showConfirmButton: false,
        });
        setIsPaymentModalOpen(false);
        setIsSubSessionEditMode(false);
        setTargetSubSession(null);
        setPaymentData({ amount: '', note: '', date: new Date().toISOString().split('T')[0], diagnostic: '', act: '', maladi: '', radio_path: '' });
        setIsDragging(false);
        fetchPackageDetails(selectedPackage.id);
      }
    } catch (err) {
      console.error("Payment operation failed:", err);
    }
  };

  const handleSubRadioSelect = async () => {
    const result = await window.api.selectRadioFile();
    if (result.success) {
      setPaymentData(prev => ({ ...prev, radio_path: result.path }));
    }
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
        if (result.success) setPaymentData(prev => ({ ...prev, radio_path: result.path }));
      }
    }
  };

  const handleEditSubSession = (session) => {
    setIsSubSessionEditMode(true);
    setTargetSubSession(session);
    setPaymentData({
      amount: session.amount || '',
      note: session.note || '',
      date: session.date || new Date().toISOString().split('T')[0],
      diagnostic: session.diagnostic || '',
      act: session.act || '',
      maladi: session.maladi || '',
      radio_path: session.radio_path || ''
    });
    setIsPaymentModalOpen(true);
  };

  const handleDeleteSubSession = async (id, sessionId) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Sub Session?',
      text: `Are you sure you want to remove sub session ${sessionId}? This will update the plan balance.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Yes, delete it',
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
            text: 'Sub Session has been removed.',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--swal-bg)',
            color: 'var(--swal-color)'
          });
          fetchPackageDetails(selectedPackage.id);
        }
      } catch (err) {
        console.error("Delete payment failed:", err);
      }
    }
  };

  const handleDeletePackage = async (id, pkgId) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Treatment Plan?',
      text: `You are about to delete ${pkgId}. This will also remove all associated sub session records!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Yes, delete everything',
      background: 'var(--swal-bg)',
      color: 'var(--swal-color)'
    });

    if (isConfirmed) {
      const result = await window.api.deletePackage(id);
      if (result.success) {
        setSelectedPackage(null);
        fetchPackages();
      }
    }
  };

  const calculateTotalPaid = (sessions) => {
    return sessions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  };

  const uniqueTreatments = [...new Set(packages.map(p => p.name))].filter(Boolean);

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.package_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTreatment = filterTreatment === 'all' || pkg.name === filterTreatment;

    let matchesDate = true;
    if (filterMode === 'exact_date' && filterExactDate) {
        matchesDate = pkg.created_at.startsWith(filterExactDate);
    } else if (filterMode === 'date_range') {
        const pkgDate = pkg.created_at.split(/[ T]/)[0];
        if (filterStartDate && pkgDate < filterStartDate) matchesDate = false;
        if (filterEndDate && pkgDate > filterEndDate) matchesDate = false;
    }
    
    return matchesSearch && matchesTreatment && matchesDate;
  });

  if (selectedPackage) {
    const totalPaid = calculateTotalPaid(subSessions);
    const remaining = selectedPackage.total_price - totalPaid;
    const progress = Math.min((totalPaid / selectedPackage.total_price) * 100, 100);

    return (
      <DashboardLayout>
        <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
          {/* Detailed Header */}
          <div className="flex flex-col gap-6">
            <button 
              onClick={() => { 
                if (urlId) {
                  navigate(-1);
                } else {
                  setSelectedPackage(null); 
                  fetchPackages(); 
                }
              }}
              className="flex items-center gap-2 text-neutral-400 hover:text-blue-500 transition-colors w-fit font-bold text-xs uppercase tracking-widest"
            >
              <ArrowLeft size={14} strokeWidth={3} />
              {urlId ? 'Back' : 'Back to Plans'}
            </button>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Treatment Plan</span>
                  <span className="font-mono text-neutral-400 text-sm">{selectedPackage.package_id}</span>
                </div>
                <h1 className="text-4xl font-black text-neutral-900 capitalize">
                  {selectedPackage.name}
                </h1>
                <div className="flex items-center gap-4 mt-3">
                   <div className="flex items-center gap-2 text-neutral-500 font-bold">
                    <User size={16} />
                    <span className="text-sm">{selectedPackage.patient_name}</span>
                  </div>
                  <span className="text-neutral-200">|</span>
                  <div className="flex items-center gap-2 text-neutral-500 font-bold">
                    <Calendar size={16} />
                    <span className="text-sm">Initiated {selectedPackage.created_at.split(/[ T]/)[0]}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <button 
                  onClick={() => { setIsEditMode(true); setIsPackageModalOpen(true); }}
                  className="px-6 py-3 bg-neutral-100 text-neutral-700 font-black rounded-2xl hover:bg-neutral-200 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  Edit Configuration
                </button>
                <button 
                  onClick={() => {
                    setIsSubSessionEditMode(false);
                    setTargetSubSession(null);
                    setPaymentData({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });
                    setIsPaymentModalOpen(true);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-3"
                >
                  <Plus size={16} strokeWidth={3} />
                  Record Sub Session
                </button>
              </div>
            </div>
          </div>

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="md:col-span-2 p-8 bg-white rounded-[32px] border border-neutral-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Sub Session Progress</p>
                    <h3 className="text-3xl font-black text-neutral-900">
                      {Math.round(progress)}% <span className="text-sm text-neutral-400 font-bold ml-1">Settled</span>
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Activity className="text-blue-500" />
                  </div>
                </div>
                <div className="h-3 bg-neutral-100 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-neutral-50 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase text-neutral-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Total Paid
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase text-neutral-400">
                    <span className="w-2 h-2 rounded-full bg-neutral-300"></span> Remaining
                 </div>
              </div>
            </div>

            <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100">
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Budget</p>
               <h3 className="text-3xl font-black text-emerald-900">{Number(selectedPackage.total_price).toLocaleString()} <span className="text-xs">DA</span></h3>
               <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp size={12} />
                  </div>
                  Fixed Treatment Cost
               </div>
            </div>

            <div className={`p-8 rounded-[32px] border ${remaining > 0 ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
               <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${remaining > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                  {remaining > 0 ? 'Remaining Balance' : 'Fully Settled'}
               </p>
               <h3 className={`text-3xl font-black ${remaining > 0 ? 'text-amber-900' : 'text-blue-900'}`}>
                  {Number(remaining).toLocaleString()} <span className="text-xs">DA</span>
               </h3>
               <div className={`mt-6 flex items-center gap-2 text-[10px] font-bold ${remaining > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${remaining > 0 ? 'bg-amber-100' : 'bg-blue-100'}`}>
                    <CreditCard size={12} />
                  </div>
                  Active Receivables
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sub Session History */}
            <div className="lg:col-span-2 bg-white border border-neutral-100 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
              <div className="p-8 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
                <h3 className="text-lg font-black text-neutral-900 flex items-center gap-3">
                  <Clock className="text-blue-500" size={20} />
                  Sub Sessions
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black ml-2">
                    {subSessions.length} Entries
                  </span>
                </h3>
              </div>
              
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-neutral-50">
                    <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      <th className="px-8 py-4">ID</th>
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4">Operation Note</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {subSessions.length > 0 ? subSessions.map((s) => (
                      <tr key={s.id} className="group hover:bg-neutral-50/50 transition-all text-sm">
                        <td className="px-8 py-5 font-mono text-neutral-400">{s.session_id}</td>
                        <td className="px-8 py-5 font-bold text-neutral-900">{s.date}</td>
                        <td className="px-8 py-5">
                          <span className="font-black text-blue-600 flex items-center gap-1">
                            <ArrowUpRight size={14} />
                            {Number(s.amount).toLocaleString()} DA
                          </span>
                        </td>
                        <td className="px-8 py-5">
                           <p className="text-neutral-500 italic line-clamp-1 max-w-sm" title={s.note}>
                             {s.note || '---'}
                           </p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEditSubSession(s)}
                              className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-white rounded-xl border border-transparent hover:border-neutral-200 transition-all"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSubSession(s.id, s.session_id)}
                              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-white rounded-xl border border-transparent hover:border-neutral-200 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="py-20 text-center text-neutral-400 font-bold italic tracking-wide uppercase text-xs">
                          No sub sessions have been recorded for this plan yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Plan Configuration Info */}
            <div className="space-y-8">
              <div className="p-8 bg-neutral-900 rounded-[32px] text-white shadow-2xl shadow-neutral-900/20">
                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-6">Plan Configuration</h4>
                
                <div className="space-y-6">
                   <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-neutral-500 uppercase mb-1">Scope & Notes</p>
                      <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                        {selectedPackage.note || "No additional configuration notes provided for this treatment plan."}
                      </p>
                    </div>
                  </div>

                   <button 
                    onClick={() => setIsReceiptModalOpen(true)}
                    className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Printer size={14} />
                    Print Receipt
                  </button>

                   <button 
                    onClick={() => handleDeletePackage(selectedPackage.id, selectedPackage.package_id)}
                    className="w-full mt-3 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Terminate & Delete Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Record Sub Session Modal */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setIsPaymentModalOpen(false)} />
            <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-neutral-100">
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-neutral-900">
                      {isSubSessionEditMode ? 'Update Sub Session' : 'Record Sub Session'}
                    </h3>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Allocation to {selectedPackage.package_id}</p>
                  </div>
                  <button onClick={() => setIsPaymentModalOpen(false)} className="w-10 h-10 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddPayment} className="space-y-6">
                  {/* Amount */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Montant *</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <DollarSign size={16} />
                      </div>
                      <input 
                        type="number" 
                        required 
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                        className="w-full pl-16 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl font-black text-sm focus:outline-none focus:border-blue-500"
                        placeholder="ex: 5000"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                        <Calendar size={16} />
                      </div>
                      <input 
                        type="date" 
                        required 
                        value={paymentData.date}
                        onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                        className="w-full pl-16 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl font-bold text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Clinical separator */}
                  <div className="pt-2 border-t border-neutral-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Données Cliniques</p>
                  </div>

                  {/* Maladie */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Maladie / Antécédents</label>
                    <div className="relative">
                      <Activity className="absolute left-4 top-3.5 text-neutral-300" size={16} />
                      <input
                        type="text"
                        value={paymentData.maladi}
                        onChange={(e) => setPaymentData({...paymentData, maladi: e.target.value})}
                        placeholder="ex: Diabète, Hypertension..."
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Diagnostic */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Diagnostic</label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-4 text-neutral-300" size={16} />
                      <textarea
                        value={paymentData.diagnostic}
                        onChange={(e) => setPaymentData({...paymentData, diagnostic: e.target.value})}
                        rows="2"
                        placeholder="Description du diagnostic..."
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Acte */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Acte Dentaire</label>
                    <div className="relative">
                      <FileSearch className="absolute left-4 top-4 text-neutral-300" size={16} />
                      <textarea
                        value={paymentData.act}
                        onChange={(e) => setPaymentData({...paymentData, act: e.target.value})}
                        rows="2"
                        placeholder="Détails de l'acte effectué..."
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Notes</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 text-neutral-300" size={16} />
                      <textarea 
                        rows="2"
                        value={paymentData.note}
                        onChange={(e) => setPaymentData({...paymentData, note: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Remarques générales..."
                      />
                    </div>
                  </div>

                  {/* Radio */}
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">Radiographie</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSubRadioSelect}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleSubRadioDrop}
                        className={`flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed py-6 rounded-3xl transition-all ${
                          isDragging ? 'border-blue-500 bg-blue-50/50 scale-[0.98]' : 'border-neutral-200 hover:border-blue-300 hover:bg-neutral-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                          isDragging ? 'bg-blue-600 text-white animate-bounce' : 'bg-neutral-100 text-neutral-400'
                        }`}>
                          <ImageIcon size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500">
                          {paymentData.radio_path ? 'Fichier Prêt — Cliquer pour changer' : 'Cliquer ou glisser une image'}
                        </span>
                      </button>
                      {paymentData.radio_path && (
                        <button
                          type="button"
                          onClick={() => setPaymentData({...paymentData, radio_path: ''})}
                          className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    {paymentData.radio_path && (
                      <div className="flex items-center gap-2 mt-2 ml-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-[10px] font-mono text-neutral-400 truncate">{paymentData.radio_path}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => { setIsPaymentModalOpen(false); setIsSubSessionEditMode(false); }} className="flex-1 py-5 bg-neutral-100 text-neutral-700 font-black rounded-2xl hover:bg-neutral-200 transition-all text-xs uppercase tracking-widest">Annuler</button>
                    <button type="submit" className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest">
                      {isSubSessionEditMode ? 'Enregistrer' : 'Confirmer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <PackageModal 
          isOpen={isPackageModalOpen}
          onClose={() => setIsPackageModalOpen(false)}
          onSave={handleCreatePackage}
          targetPackage={selectedPackage}
          isEditMode={isEditMode}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-neutral-100 pb-8">
          <div>
            <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-2 ml-1">Plan Management</h2>
            <h1 className="text-3xl font-black text-neutral-900 flex items-center gap-4">
              {t('sessions.multiple.title')}
              <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{packages.length} Active Records</span>
            </h1>
          </div>
          <button 
            onClick={() => { setIsEditMode(false); setIsPackageModalOpen(true); }}
            className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3 text-xs uppercase tracking-widest"
          >
            <Plus size={18} strokeWidth={3} />
            {t('sessions.multiple.add')}
          </button>
        </div>

        {/* Global Search and Filter */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-white border border-neutral-100 p-3 rounded-[32px] shadow-sm">
               <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300" size={20} />
                  <input 
                    type="text" 
                    placeholder="Lookup plan by Patient name, ID or treatment type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-neutral-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-bold placeholder:text-neutral-300 placeholder:italic"
                  />
               </div>
            </div>
            
            <div className="w-full md:w-64 bg-white border border-neutral-100 p-3 rounded-[32px] shadow-sm flex items-center">
              <select
                value={filterTreatment}
                onChange={(e) => setFilterTreatment(e.target.value)}
                className="w-full h-full bg-neutral-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-bold px-6 py-5 appearance-none outline-none capitalize"
              >
                <option value="all">All Treatments</option>
                {uniqueTreatments.map((tr, i) => (
                  <option key={i} value={tr}>{tr}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-64 bg-white border border-neutral-100 p-3 rounded-[32px] shadow-sm flex items-center">
              <select
                value={filterMode}
                onChange={(e) => {
                  setFilterMode(e.target.value);
                  setFilterExactDate('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="w-full h-full bg-neutral-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-bold px-6 py-5 appearance-none outline-none"
              >
                <option value="all">All Dates</option>
                <option value="exact_date">Specific Day</option>
                <option value="date_range">Date Range</option>
              </select>
            </div>
          </div>
          
          {(filterMode === 'exact_date' || filterMode === 'date_range') && (
            <div className="flex flex-col md:flex-row justify-end gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {filterMode === 'exact_date' && (
                <div className="w-full md:w-64 bg-white border border-neutral-100 p-3 rounded-[32px] shadow-sm flex items-center">
                  <input
                    type="date"
                    value={filterExactDate}
                    onChange={(e) => setFilterExactDate(e.target.value)}
                    className="w-full h-full bg-neutral-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-bold px-6 py-5 outline-none"
                  />
                </div>
              )}
              {filterMode === 'date_range' && (
                <>
                  <div className="w-full md:w-64 bg-white border border-neutral-100 p-3 rounded-[32px] shadow-sm flex items-center">
                    <input
                      type="date"
                      title="Start Date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full h-full bg-neutral-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-bold px-6 py-5 outline-none"
                    />
                  </div>
                  <div className="shrink-0 flex items-center text-[10px] font-black uppercase text-neutral-400">Through</div>
                  <div className="w-full md:w-64 bg-white border border-neutral-100 p-3 rounded-[32px] shadow-sm flex items-center">
                    <input
                      type="date"
                      title="End Date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full h-full bg-neutral-50 border-none rounded-[24px] text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-bold px-6 py-5 outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Table View */}
        <div className="bg-white border border-neutral-100 rounded-[32px] overflow-hidden shadow-sm">
          {loading ? (
             <div className="py-20 flex flex-col items-center justify-center text-blue-500 gap-4">
               <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="font-black text-[10px] uppercase tracking-widest">Assembling Treatment Plans...</p>
             </div>
          ) : filteredPackages.length === 0 ? (
             <div className="py-20 flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 bg-neutral-50 rounded-[32px] flex items-center justify-center">
                   <Layers className="text-neutral-200" size={40} />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-black text-neutral-400 capitalize">No active plans found</h3>
                  <p className="text-xs font-medium text-neutral-300 mt-1 italic">Try adjusting your filters or establish a new plan</p>
                </div>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-50/50 border-b border-neutral-100">
                  <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    <th className="px-8 py-6">Plan ID</th>
                    <th className="px-8 py-6">Treatment Type</th>
                    <th className="px-8 py-6">Patient Name</th>
                    <th className="px-8 py-6 text-center">Sub Sessions</th>
                    <th className="px-8 py-6">Total Fee</th>
                    <th className="px-8 py-6">Creation Date</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filteredPackages.map((pkg) => (
                    <tr 
                      key={pkg.id} 
                      onClick={() => fetchPackageDetails(pkg.id)}
                      className="group hover:bg-neutral-50/50 transition-all cursor-pointer text-sm"
                    >
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-mono font-black text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded tracking-tighter uppercase">
                          {pkg.package_id}
                        </span>
                      </td>
                      <td className="px-8 py-5 font-bold text-neutral-900 capitalize">
                        {pkg.name}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center font-black text-[10px] text-neutral-400">
                            {pkg.patient_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-neutral-800 capitalize">{pkg.patient_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                          <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{pkg.subSessionsCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-neutral-900 tracking-tight">
                        {Number(pkg.total_price).toLocaleString()} DA
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-neutral-500 flex items-center gap-1.5 uppercase tracking-tighter">
                          <Calendar size={12} /> {pkg.created_at.split(/[ T]/)[0]}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all ml-auto">
                           <ChevronRight size={18} strokeWidth={3} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PackageModal 
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        onSave={handleCreatePackage}
        targetPackage={selectedPackage}
        isEditMode={isEditMode}
        defaultPatientId={searchParams.get('patientId')}
      />

      <ReceiptPreviewModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        selectedPackage={selectedPackage}
        subSessions={subSessions}
      />
    </DashboardLayout>
  );
}

export default MultipleSessions;
