import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  Users, 
  Calendar, 
  Clock, 
  BookOpen, 
  UserCircle, 
  Settings, 
  LogOut, 
  ChevronLeft 
} from 'lucide-react';

function Sidebar({ isVisible, toggleVisibility }) {
  const { theme, toggleTheme, language, changeLanguage } = useContext(ThemeContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to end your session?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Logout',
      background: 'var(--swal-bg)',
      color: 'var(--swal-color)'
    });

    if (isConfirmed) {
      localStorage.removeItem('user');
      navigate('/login');
      window.location.reload();
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const navItems = [
    { label: t('sidebar.patient'), icon: <Users size={18} />, path: '/patient' },
    { label: t('sidebar.rendezVous'), icon: <Calendar size={18} />, path: '/appointments' },
    { label: t('sidebar.session'), icon: <Clock size={18} />, path: '/sessions' },
    { label: t('sidebar.multiple_sessions'), icon: <BookOpen size={18} />, path: '/multiple-sessions' },
    isAdmin && { label: t('sidebar.users'), icon: <UserCircle size={18} />, path: '/users' },
    { label: t('sidebar.setting'), icon: <Settings size={18} />, path: '/settings' },
  ].filter(Boolean);

  return (
    <aside 
      className={`bg-white border-r border-neutral-200 flex flex-col transition-all duration-300 h-screen sticky top-0 shadow-lg z-20 overflow-hidden ${
        isVisible ? 'w-72 opacity-100' : 'w-0 opacity-0 border-none'
      }`}
    >
      
      {/* Brand Profile Block */}
      <div className="p-6 flex items-center justify-between border-b border-neutral-200 shrink-0">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/30">
            🦷
          </div>
          <div className="mx-3 flex flex-col justify-center whitespace-nowrap">
            <h2 className="font-bold text-base text-neutral-900 leading-tight">Elite Dental</h2>
            <span className="text-[10px] text-neutral-500 font-medium tracking-wider uppercase">Clinic Manager</span>
          </div>
        </div>
        
        {/* Toggle Button Inside Sidebar */}
        <button 
          onClick={toggleVisibility}
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4 mx-2">Menu Principal</p>
        
        {navItems.map((item, idx) => (
          <button 
            key={idx} 
            onClick={() => navigate(item.path)}
            className="cursor-pointer w-full flex items-center rounded-xl p-3 text-neutral-600 hover:bg-blue-50 hover:text-blue-600 transition-all group gap-3 whitespace-nowrap"
          >
            <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Logout Block */}
      <div className="p-6 border-t border-neutral-200 shrink-0 bg-neutral-50/50">
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm border border-red-100 hover:scale-[1.02] active:scale-95 gap-2"
        >
          <LogOut size={16} /> {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
