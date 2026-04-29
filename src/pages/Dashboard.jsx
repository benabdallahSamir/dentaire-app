import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts';
import {
  Users, BarChart2, Plus, Pencil, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, X, Check, ShieldCheck, UserCircle, TrendingUp, Calendar, Activity, BookOpen, Clock
} from 'lucide-react';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const DAYS   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

function fmt(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// Group items by date field (date or created_at) → { 'YYYY-MM-DD': count }
function groupByDate(items) {
  const map = {};
  items.forEach(p => {
    const day = (p.date || p.created_at || '').split(' ')[0] || (p.date || p.created_at || '').split('T')[0];
    if (day) map[day] = (map[day] || 0) + 1;
  });
  return map;
}

// ─────────────────────────────────────────────
// Custom Tooltips for charts
// ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-blue-100 rounded-2xl shadow-xl px-4 py-3">
        <p className="text-xs font-black text-neutral-400 uppercase mb-1">{label}</p>
        <p className="text-2xl font-black text-blue-600">{payload[0].value}</p>
        <p className="text-[10px] text-neutral-400">patients</p>
      </div>
    );
  }
  return null;
};

const MultiTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-neutral-100 rounded-2xl shadow-xl px-4 py-3 min-w-[150px]">
        <p className="text-xs font-black text-neutral-400 uppercase mb-2 border-b border-neutral-50 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex justify-between items-center gap-4 mb-1">
            <span style={{ color: entry.color }} className="text-[10px] font-bold uppercase">{entry.name}</span>
            <span style={{ color: entry.color }} className="text-lg font-black">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────
// SECTION 1: User Management
// ─────────────────────────────────────────────
function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ id: null, username: '', password: '', role: 'user' });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.api.getUsers();
      if (res.success) setUsers(res.users);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd = () => {
    setEditMode(false);
    setForm({ id: null, username: '', password: '', role: 'user' });
    setErrorMsg('');
    setShowPwd(false);
    setShowPanel(true);
  };

  const openEdit = (u) => {
    setEditMode(true);
    setForm({ id: u.id, username: u.username, password: '', role: u.role });
    setErrorMsg('');
    setShowPwd(false);
    setShowPanel(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      let res;
      if (editMode) {
        res = await window.api.updateUser(form.id, form.username, form.role, form.password || undefined);
      } else {
        if (!form.password) { setErrorMsg('Password is required'); return; }
        res = await window.api.createUser(form.username, form.password, form.role);
      }
      if (res.success) {
        Swal.fire({ icon: 'success', title: editMode ? 'User Updated' : 'User Created', timer: 1500, showConfirmButton: false, background: 'var(--swal-bg)', color: 'var(--swal-color)' });
        fetchUsers();
        setShowPanel(false);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser.id) {
      Swal.fire({ icon: 'warning', title: 'Cannot delete yourself', timer: 2000, showConfirmButton: false });
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: `Delete "${u.username}"?`, icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete', background: 'var(--swal-bg)', color: 'var(--swal-color)'
    });
    if (isConfirmed) {
      const res = await window.api.deleteUser(u.id);
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
        fetchUsers();
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Users size={15} className="text-white" />
            </span>
            Gestion des Utilisateurs
          </h2>
          <p className="text-sm text-neutral-400 mt-1 ml-10">Créer, modifier et supprimer les comptes</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95 transition-all"
        >
          <Plus size={16} /> Nouvel utilisateur
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: users.length, color: 'from-blue-500 to-cyan-500', icon: <Users size={16}/> },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'from-violet-500 to-purple-600', icon: <ShieldCheck size={16}/> },
          { label: 'Utilisateurs', value: users.filter(u => u.role === 'user').length, color: 'from-emerald-500 to-teal-500', icon: <UserCircle size={16}/> },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-neutral-900">{stat.value}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 bg-neutral-50">
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                <tr><td colSpan="3" className="p-16 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent" />
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="3" className="p-16 text-center text-neutral-400 italic text-sm">Aucun utilisateur trouvé.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-neutral-50/60 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm ${u.role === 'admin' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}`}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-neutral-900">{u.username}</p>
                        <p className="text-[10px] text-neutral-400">ID #{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {u.role === 'admin' ? <ShieldCheck size={10}/> : <UserCircle size={10}/>}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(u)} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-all">
                        <Pencil size={14}/>
                      </button>
                      <button onClick={() => handleDelete(u)} disabled={u.id === currentUser.id} className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-neutral-100 ${showPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-purple-50">
            <div>
              <h3 className="font-black text-lg text-neutral-900">{editMode ? 'Modifier' : 'Nouvel'} utilisateur</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{editMode ? 'Laissez le mot de passe vide pour ne pas le changer' : 'Remplissez tous les champs'}</p>
            </div>
            <button onClick={() => setShowPanel(false)} className="w-8 h-8 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors">
              <X size={16}/>
            </button>
          </div>
          <form onSubmit={handleSave} className="flex-1 overflow-auto p-6 space-y-5">
            {errorMsg && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2"><X size={12}/>{errorMsg}</div>}
            
            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase mb-2 ml-1 tracking-wider">Nom d'utilisateur *</label>
              <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-all font-medium"
                placeholder="ex: dr.benali" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase mb-2 ml-1 tracking-wider">
                Mot de passe {editMode && <span className="normal-case text-neutral-300">(optionnel)</span>}
              </label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} {...(!editMode && { required: true })}
                  className="w-full px-4 py-3 pr-12 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-all font-medium"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-3.5 text-neutral-400 hover:text-neutral-700 transition-colors">
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-400 uppercase mb-2 ml-1 tracking-wider">Rôle *</label>
              <div className="grid grid-cols-2 gap-3">
                {['user', 'admin'].map(r => (
                  <button key={r} type="button" onClick={() => setForm({...form, role: r})}
                    className={`py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                      form.role === r
                        ? r === 'admin' ? 'bg-purple-100 border-purple-400 text-purple-700' : 'bg-blue-100 border-blue-400 text-blue-700'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100'
                    }`}>
                    {r === 'admin' ? <ShieldCheck size={14}/> : <UserCircle size={14}/>}
                    {r === 'admin' ? 'Admin' : 'Utilisateur'}
                    {form.role === r && <Check size={12}/>}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setShowPanel(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors text-sm">
                Annuler
              </button>
              <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all text-sm flex items-center justify-center gap-2">
                <Check size={14}/> {editMode ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {showPanel && <div onClick={() => setShowPanel(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />}
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION 2: Patient Statistics
// ─────────────────────────────────────────────
function PatientsStatsSection() {
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('week'); // 'week' | 'month' | 'year'

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [res, resSessions] = await Promise.all([
          window.api.getPatients(),
          window.api.getSessions()
        ]);
        if (res.success) setPatients(res.patients);
        if (resSessions.success) setSessions(resSessions.sessions);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dateMap = groupByDate(patients);

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const key = fmt(d);
    return { name: `${DAYS[d.getDay()]} ${d.getDate()}`, patients: dateMap[key] || 0, date: key };
  });

  const monthData = (() => {
    const year = selectedMonthYear;
    const month = selectedMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const weeks = [];
    let cursor = new Date(firstDay);
    let weekNum = 1;
    while (cursor <= lastDay) {
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());
      let count = 0;
      const tmp = new Date(cursor);
      while (tmp <= weekEnd) {
        count += dateMap[fmt(tmp)] || 0;
        tmp.setDate(tmp.getDate() + 1);
      }
      weeks.push({ name: `Sem ${weekNum} (${cursor.getDate()}-${weekEnd.getDate()})`, patients: count });
      cursor.setDate(cursor.getDate() + 7);
      weekNum++;
    }
    return weeks;
  })();

  const yearData = MONTHS.map((m, idx) => {
    let count = 0;
    const daysInMonth = new Date(selectedYear, idx + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${selectedYear}-${String(idx+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      count += dateMap[key] || 0;
    }
    return { name: m, patients: count };
  });

  const chartData = mode === 'week' ? weekData : mode === 'month' ? monthData : yearData;
  const totalInView = chartData.reduce((s, d) => s + d.patients, 0);
  const maxInView   = Math.max(...chartData.map(d => d.patients), 1);

  const MODES = [
    { key: 'week',  label: 'Semaine', icon: <Calendar size={14}/> },
    { key: 'month', label: 'Mois',    icon: <Activity size={14}/> },
    { key: 'year',  label: 'Année',   icon: <TrendingUp size={14}/> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Users size={15} className="text-white" />
            </span>
            Admissions Patients
          </h2>
          <p className="text-sm text-neutral-400 mt-1 ml-10">Évolution de l'inscription de nouveaux patients</p>
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-2xl">
          {MODES.map(m => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === m.key ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 relative z-10 flex-wrap">
        {mode === 'week' && (
          <div className="flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all">
              <ChevronLeft size={14}/>
            </button>
            <span className="text-sm font-bold text-neutral-700 min-w-[180px] text-center">
              {weekStart.toLocaleDateString('fr-FR', { day:'numeric', month:'long' })} – {addDays(weekStart, 6).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
            </span>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all">
              <ChevronRight size={14}/>
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="text-[10px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-700 transition-colors ml-1">
              Aujourd'hui
            </button>
          </div>
        )}

        {mode === 'month' && (
          <div className="flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <button onClick={() => {
              if (selectedMonth === 0) { setSelectedMonth(11); setSelectedMonthYear(y => y - 1); }
              else setSelectedMonth(m => m - 1);
            }} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all">
              <ChevronLeft size={14}/>
            </button>
            <span className="text-sm font-bold text-neutral-700 min-w-[140px] text-center">
              {MONTHS[selectedMonth]} {selectedMonthYear}
            </span>
            <button onClick={() => {
              if (selectedMonth === 11) { setSelectedMonth(0); setSelectedMonthYear(y => y + 1); }
              else setSelectedMonth(m => m + 1);
            }} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all">
              <ChevronRight size={14}/>
            </button>
          </div>
        )}

        {mode === 'year' && (
          <div className="flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <button onClick={() => setSelectedYear(y => y - 1)} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all">
              <ChevronLeft size={14}/>
            </button>
            <span className="text-sm font-bold text-neutral-700 min-w-[60px] text-center">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all">
              <ChevronRight size={14}/>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <div className="bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm text-center">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Total période</p>
            <p className="text-xl font-black text-blue-600">{totalInView}</p>
          </div>
          <div className="bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm text-center">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Max</p>
            <p className="text-xl font-black text-emerald-500">{maxInView}</p>
          </div>
          <div className="bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm text-center">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Patients</p>
            <p className="text-xl font-black text-neutral-700">{patients.length}</p>
          </div>
          <div className="bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm text-center">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Sous-sessions</p>
            <p className="text-xl font-black text-blue-600">{sessions.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={8}/>
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}/>
              <Area type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2.5} fill="url(#blueGrad)" dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }} activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// SECTION 3: Sessions & Packages Statistics
// ─────────────────────────────────────────────
function SessionsStatsSection() {
  const [sessions, setSessions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('week'); // 'week' | 'month' | 'year'

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [resS, resP] = await Promise.all([
          window.api.getSessions(),
          window.api.getPackages()
        ]);
        if (resS.success) setSessions(resS.sessions);
        if (resP.success) setPackages(resP.packages);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sessMap = groupByDate(sessions);
  const packMap = groupByDate(packages);

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const key = fmt(d);
    return { name: `${DAYS[d.getDay()]} ${d.getDate()}`, "Sessions simples": sessMap[key] || 0, "Sessions multiples (Packages)": packMap[key] || 0 };
  });

  const monthData = (() => {
    const year = selectedMonthYear;
    const month = selectedMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const weeks = [];
    let cursor = new Date(firstDay);
    let weekNum = 1;
    while (cursor <= lastDay) {
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());
      
      let sCount = 0;
      let pCount = 0;
      
      const tmp = new Date(cursor);
      while (tmp <= weekEnd) {
        const key = fmt(tmp);
        sCount += sessMap[key] || 0;
        pCount += packMap[key] || 0;
        tmp.setDate(tmp.getDate() + 1);
      }
      weeks.push({ name: `Sem ${weekNum}`, "Sessions simples": sCount, "Sessions multiples (Packages)": pCount });
      cursor.setDate(cursor.getDate() + 7);
      weekNum++;
    }
    return weeks;
  })();

  const yearData = MONTHS.map((m, idx) => {
    let sCount = 0;
    let pCount = 0;
    const daysInMonth = new Date(selectedYear, idx + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${selectedYear}-${String(idx+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      sCount += sessMap[key] || 0;
      pCount += packMap[key] || 0;
    }
    return { name: m, "Sessions simples": sCount, "Sessions multiples (Packages)": pCount };
  });

  const chartData = mode === 'week' ? weekData : mode === 'month' ? monthData : yearData;

  const sumSessions = chartData.reduce((s, d) => s + d["Sessions simples"], 0);
  const sumPackages = chartData.reduce((s, d) => s + d["Sessions multiples (Packages)"], 0);

  const MODES = [
    { key: 'week',  label: 'Semaine', icon: <Calendar size={14}/> },
    { key: 'month', label: 'Mois',    icon: <Activity size={14}/> },
    { key: 'year',  label: 'Année',   icon: <TrendingUp size={14}/> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Clock size={15} className="text-white" />
            </span>
            Traitements & Sessions
          </h2>
          <p className="text-sm text-neutral-400 mt-1 ml-10">Créations de sessions et sessions multiples (packages)</p>
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-2xl">
          {MODES.map(m => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === m.key ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 relative z-10 flex-wrap">
        {mode === 'week' && (
          <div className="flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-all">
              <ChevronLeft size={14}/>
            </button>
            <span className="text-sm font-bold text-neutral-700 min-w-[180px] text-center">
              {weekStart.toLocaleDateString('fr-FR', { day:'numeric', month:'long' })} – {addDays(weekStart, 6).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
            </span>
            <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-all">
              <ChevronRight size={14}/>
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="text-[10px] font-black uppercase tracking-wider text-emerald-500 hover:text-emerald-700 transition-colors ml-1">
              Aujourd'hui
            </button>
          </div>
        )}

        {mode === 'month' && (
          <div className="flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <button onClick={() => {
              if (selectedMonth === 0) { setSelectedMonth(11); setSelectedMonthYear(y => y - 1); }
              else setSelectedMonth(m => m - 1);
            }} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-all">
              <ChevronLeft size={14}/>
            </button>
            <span className="text-sm font-bold text-neutral-700 min-w-[140px] text-center">
              {MONTHS[selectedMonth]} {selectedMonthYear}
            </span>
            <button onClick={() => {
              if (selectedMonth === 11) { setSelectedMonth(0); setSelectedMonthYear(y => y + 1); }
              else setSelectedMonth(m => m + 1);
            }} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-all">
              <ChevronRight size={14}/>
            </button>
          </div>
        )}

        {mode === 'year' && (
          <div className="flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <button onClick={() => setSelectedYear(y => y - 1)} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-all">
              <ChevronLeft size={14}/>
            </button>
            <span className="text-sm font-bold text-neutral-700 min-w-[60px] text-center">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="w-7 h-7 rounded-xl bg-neutral-50 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-all">
              <ChevronRight size={14}/>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <div className="bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm text-center">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Sessions simples période</p>
            <p className="text-xl font-black text-rose-600">{sumSessions}</p>
          </div>
          <div className="bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm text-center">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Packages période</p>
            <p className="text-xl font-black text-emerald-600">{sumPackages}</p>
          </div>
          <div className="bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm text-center">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Total Sessions</p>
            <p className="text-xl font-black text-neutral-700">{sessions.length}</p>
          </div>
          <div className="bg-white border border-neutral-100 rounded-2xl px-4 py-2.5 shadow-sm text-center">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Total Packages</p>
            <p className="text-xl font-black text-emerald-600">{packages.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6 mt-4">
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={8}/>
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<MultiTooltip />} cursor={{ fill: '#f8fafc' }}/>
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Bar dataKey="Sessions simples" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Sessions multiples (Packages)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD PAGE
// ─────────────────────────────────────────────
function Dashboard() {
  const [activeTab, setActiveTab] = useState('patients');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const TABS = [
    { key: 'patients', label: 'Patients', icon: <Users size={16}/>, color: 'text-blue-600', activeBg: 'bg-blue-50 border-blue-200 text-blue-700' },
    { key: 'sessions', label: 'Sessions', icon: <BookOpen size={16}/>, color: 'text-emerald-600', activeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { key: 'users', label: 'Utilisateurs', icon: <ShieldCheck size={16}/>, color: 'text-violet-600', activeBg: 'bg-violet-50 border-violet-200 text-violet-700' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Administration</p>
            <h1 className="text-3xl font-black text-neutral-900">Tableau de bord</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-neutral-900">{user.username}</p>
              <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-black uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-500/30">
              {user.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6 border-b border-neutral-100 pb-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-2xl text-sm font-bold border-b-2 transition-all -mb-px whitespace-nowrap ${
                activeTab === tab.key
                  ? `${tab.activeBg} border-current`
                  : 'text-neutral-400 border-transparent hover:text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-10">
        {activeTab === 'patients' && <PatientsStatsSection />}
        {activeTab === 'sessions' && <SessionsStatsSection />}
        {activeTab === 'users' && <UsersSection />}
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
