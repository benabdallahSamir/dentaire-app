import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import Swal from 'sweetalert2';

function Auth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useContext(ThemeContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await window.api.login(username, password);
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/');
      } else {
        setError(response.message);
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: response.message,
          background: 'var(--swal-bg)',
          color: 'var(--swal-color)',
          confirmButtonColor: '#06b6d4'
        });
      }
    } catch (err) {
      console.error(err);
      setError(t('auth.errorInternal'));
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Could not connect to the database bridge.',
        background: 'var(--bg-color)',
        color: 'var(--text-color)',
        confirmButtonColor: '#06b6d4'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 bg-[url('c:/Users/ELITEBOOK/Desktop/dentaire%20app/src/design/authPage.png')] bg-cover bg-center flex items-center justify-center p-4 transition-colors duration-300">
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm transition-colors duration-300"></div>

      <div className="relative w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 relative overflow-hidden transition-all duration-500 hover:shadow-cyan-500/10">
          
          <div className="text-center mb-10 mt-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent">
              {t('auth.title')}
            </h1>
            <p className="text-neutral-600 mt-2 text-sm">{t('auth.subtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2 text-start">
              <label className="text-sm font-medium text-neutral-700 mx-1">{t('auth.username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                dir="auto"
                className="w-full bg-white/50 border border-neutral-300 text-neutral-900 rounded-xl px-4 py-3 
                focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-neutral-400"
                placeholder={t('auth.username')}
              />
            </div>

            <div className="space-y-2 text-start">
              <label className="text-sm font-medium text-neutral-700 mx-1">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="auto"
                className="w-full bg-white/50 border border-neutral-300 text-neutral-900 rounded-xl px-4 py-3 
                focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-neutral-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 
              text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/25 
              transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? t('auth.authenticating') : t('auth.signIn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Auth;
