import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function Sidebar() {
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
    { label: t('sidebar.patient'), icon: '👥', path: '/patient' },
    { label: t('sidebar.rendezVous'), icon: '📅', path: '/appointments' },
    { label: t('sidebar.session'), icon: '⏱️', path: '/sessions' },
    isAdmin && { label: t('sidebar.users'), icon: '👨‍⚕️', path: '/users' },
    { label: t('sidebar.setting'), icon: '⚙️', path: '/settings' },
  ].filter(Boolean);

  return (
    <aside className="w-72 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-colors duration-300 h-screen sticky top-0 shadow-lg z-20">
      
      {/* Brand Profile Block */}
      <div className="p-6 flex items-center justify-center border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        {/* Placeholder image logo from standard design */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/30">
          🦷
        </div>
        <div className="mx-4 flex flex-col justify-center">
          <h2 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">Elite Dental</h2>
          <span className="text-xs text-neutral-500 font-medium">Clinic Manager</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-4 space-y-1">
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 mx-2">Menu</p>
        
        {navItems.map((item, idx) => (
          <button 
            key={idx} 
            onClick={() => navigate(item.path)}
            className="cursor-pointer w-full flex items-center rounded-xl p-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-all group"
          >
            <span className="text-xl mx-2 group-hover:scale-110 transition-transform">{item.icon}</span>
            <span className="font-semibold">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Settings & Toggles Block (Fixed to bottom) */}
      <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 shrink-0 bg-neutral-50 dark:bg-black/20">
        
        {/* Theme Toggle */}
        <div className="flex flex-col gap-4">
          <button 
            onClick={toggleTheme} 
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors shadow-sm text-sm font-semibold text-neutral-700 dark:text-neutral-300"
          >
            <span>{theme === 'dark' ? '🌙 ' + t('theme.dark') : '☀️ ' + t('theme.light')}</span>
            <div className="w-10 h-5 bg-neutral-200 dark:bg-cyan-900 rounded-full relative transition-colors">
              <div className={`absolute top-0.5 bottom-0.5 w-4 h-4 rounded-full bg-white dark:bg-cyan-400 shadow-sm transition-all ${theme === 'dark' ? 'left-5' : 'left-1'}`}></div>
            </div>
          </button>
          
          {/* Language Selection */}
          <select 
            value={language} 
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 cursor-pointer shadow-sm transition-colors"
          >
            <option value="en">🇺🇸 English</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="ar">🇸🇦 العربية</option>
          </select>
          
          <button onClick={handleLogout} className="w-full flex items-center justify-center p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-bold text-sm mt-2 border border-red-100 dark:border-transparent">
            <span className="mx-2">👋</span> {t('sidebar.logout')}
          </button>
        </div>

      </div>
    </aside>
  );
}

export default Sidebar;
