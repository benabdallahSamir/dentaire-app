import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import SessionModal from '../components/SessionModal';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  Search,
  Calendar,
  XCircle
} from 'lucide-react';

function Sessions() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetSession, setTargetSession] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const result = await window.api.getSessions();
      if (result.success) {
        setSessions(result.sessions);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleAddClick = () => {
    setIsEditMode(false);
    setTargetSession(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (session) => {
    setIsEditMode(true);
    setTargetSession(session);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id, sessionId) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete session ${sessionId}. This action cannot be undone.`,
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
          fetchSessions();
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleSaveSession = async (formData) => {
    try {
      let result;
      if (isEditMode) {
        result = await window.api.updateSession(
          targetSession.id,
          formData.patient_id,
          formData.date,
          formData.amount,
          formData.note
        );
      } else {
        result = await window.api.createSession(
          formData.patient_id,
          formData.date,
          formData.amount,
          formData.note
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
        setIsModalOpen(false);
        fetchSessions();
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          session.session_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateQuery === '' || session.date === dateQuery;
    return matchesSearch && matchesDate;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setDateQuery('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        {/* Page Header */}
        <div className="flex flex-col border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
                Session Management
              </h2>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
                {t('sessions.title')}
              </h1>
            </div>
            <button 
              onClick={handleAddClick}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              {t('sessions.single.add')}
            </button>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-3xl shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">
                Search Patient or ID
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-3 text-neutral-300" size={18} />
                <input 
                  type="text"
                  placeholder="e.g. Fatima or SS-001"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 ml-1">
                Filter by Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3 text-neutral-300" size={18} />
                <input 
                  type="date"
                  value={dateQuery}
                  onChange={(e) => setDateQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-all uppercase"
                />
              </div>
            </div>
            {(searchQuery || dateQuery) && (
              <button 
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl text-sm font-bold transition-all"
              >
                <XCircle size={18} />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
          {/* Table Header Wrapper */}
          <div className="p-6 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-black/20">
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-3">
              Records List
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full font-bold">
                {filteredSessions.length}
              </span>
            </h3>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('sessions.table.id')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('sessions.table.patient')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('sessions.table.date')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('sessions.table.price')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('sessions.table.note')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">{t('sessions.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-20 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-20 text-center text-neutral-400 font-medium">
                      {searchQuery || dateQuery ? 'No results match your search criteria.' : 'No sessions found.'}
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group text-sm">
                      <td className="px-6 py-4 font-mono text-neutral-400">{session.session_id}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                          {session.patient_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-500">{session.date}</td>
                      <td className="px-6 py-4">
                        <span className="font-black text-neutral-700 dark:text-neutral-300">
                           {session.amount ? `${Number(session.amount).toLocaleString()} DA` : '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-neutral-400 italic line-clamp-1 max-w-[250px]" title={session.note}>
                          {session.note || '---'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(session)}
                            className="p-2 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-neutral-800 rounded-xl border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all shadow-sm shadow-transparent hover:shadow-black/5"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(session.id, session.session_id)}
                            className="p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-neutral-800 rounded-xl border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all shadow-sm shadow-transparent hover:shadow-black/5"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SessionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSession}
        targetSession={targetSession}
        isEditMode={isEditMode}
      />
    </DashboardLayout>
  );
}

export default Sessions;

