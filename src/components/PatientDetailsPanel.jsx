import { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Clock, 
  CreditCard, 
  ChevronRight,
  TrendingUp,
  History,
  Layers,
  Activity
} from 'lucide-react';

function PatientDetailsPanel({ isOpen, onClose, patient }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sessions, setSessions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patient) {
      fetchPatientHistory();
    }
  }, [isOpen, patient]);

  const fetchPatientHistory = async () => {
    setLoading(true);
    try {
      const [sessionsRes, packagesRes] = await Promise.all([
        window.api.getSessionsByPatient(patient.id),
        window.api.getPackagesByPatient(patient.id)
      ]);
      
      if (sessionsRes.success) setSessions(sessionsRes.sessions);
      if (packagesRes.success) setPackages(packagesRes.packages);
    } catch (err) {
      console.error("Failed to fetch patient history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!patient) return null;

  const tabs = [
    { id: 'overview', label: 'Profile', icon: <User size={16} /> },
    { id: 'sessions', label: 'Sessions', icon: <Activity size={16} /> },
    { id: 'packages', label: 'Packages', icon: <Layers size={16} /> }
  ];

  return (
    <>
      <div 
        className={`fixed inset-y-0 right-0 w-[500px] bg-white dark:bg-neutral-900 shadow-2xl z-50 transform transition-transform duration-500 ease-out border-l border-neutral-100 dark:border-neutral-800 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header Section */}
        <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-black/20">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-3xl bg-blue-500 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-blue-500/30">
                {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white capitalize leading-tight">
                  {patient.name}
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 mt-1 uppercase tracking-widest">
                  <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                    {patient.patient_id}
                  </span>
                  <span>•</span>
                  <span>Joined {patient.created_at?.split(' ')[0]}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex p-1 bg-neutral-100/50 dark:bg-white/5 rounded-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <section>
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Contact & Personal</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3 text-neutral-400 mb-2">
                      <Phone size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Phone</span>
                    </div>
                    <p className="text-sm font-bold text-neutral-800 dark:text-white">{patient.phone || 'Not provided'}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3 text-neutral-400 mb-2">
                       <Calendar size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Date of Birth</span>
                    </div>
                    <p className="text-sm font-bold text-neutral-800 dark:text-white">{patient.dob || '--/--/----'}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3 text-neutral-400 mb-2">
                       <Activity size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Gender</span>
                    </div>
                    <p className="text-sm font-bold text-neutral-800 dark:text-white">{patient.gender || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3 text-neutral-400 mb-2">
                       <MapPin size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Address</span>
                    </div>
                    <p className="text-sm font-bold text-neutral-800 dark:text-white truncate" title={patient.address}>
                      {patient.address || 'No address saved'}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Summary</h4>
                <div className="flex gap-4">
                  <div className="flex-1 p-5 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Visits</p>
                    <p className="text-3xl font-black">{sessions.length}</p>
                  </div>
                  <div className="flex-1 p-5 rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Packages</p>
                    <p className="text-3xl font-black">{packages.length}</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {loading ? (
                <div className="flex items-center justify-center p-20 text-blue-500"><Clock className="animate-spin" /></div>
              ) : sessions.length > 0 ? (
                sessions.map((s) => (
                  <div key={s.id} className="group p-5 bg-white dark:bg-neutral-800/40 rounded-3xl border border-neutral-100 dark:border-neutral-800 hover:border-blue-500/50 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                            {s.session_id}
                          </span>
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">Treatment</span>
                        </div>
                        <h5 className="font-bold text-neutral-800 dark:text-white">Session on {s.date}</h5>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-neutral-900 dark:text-white">
                          {s.amount ? `${Number(s.amount).toLocaleString()} DA` : '--'}
                        </p>
                      </div>
                    </div>
                    {s.note && (
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">"{s.note}"</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center p-20 text-neutral-400">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History size={32} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest">No visit history</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {loading ? (
                <div className="flex items-center justify-center p-20 text-blue-500"><Clock className="animate-spin" /></div>
              ) : packages.length > 0 ? (
                packages.map((pkg) => (
                  <div key={pkg.id} className="p-5 bg-white dark:bg-neutral-800/40 rounded-3xl border border-neutral-100 dark:border-neutral-800 hover:border-emerald-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="font-black text-neutral-900 dark:text-white uppercase tracking-tight">{pkg.name}</h5>
                        <p className="text-[10px] font-mono text-neutral-400 mt-1">{pkg.package_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                          {pkg.total_price.toLocaleString()} DA
                        </p>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1 block">Total Plan Cost</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
                       <span>Plan created {pkg.created_at.split(' ')[0]}</span>
                       <button className="text-blue-500 flex items-center gap-1 hover:gap-2 transition-all">
                         View Details <ChevronRight size={12} strokeWidth={3} />
                       </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-20 text-neutral-400">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard size={32} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest">No active packages</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] animate-in fade-in duration-300" 
        />
      )}
    </>
  );
}

export default PatientDetailsPanel;
