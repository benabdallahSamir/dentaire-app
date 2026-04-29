import DashboardLayout from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { User, Lock, Save, Shield } from 'lucide-react';

function Settings() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setFormData(prev => ({ ...prev, username: parsed.username }));
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return Swal.fire({ icon: 'error', title: 'Error', text: 'Passwords do not match' });
    }

    setLoading(true);
    try {
      const result = await window.api.updateUser(
        user.id,
        formData.username,
        user.role, // Keep existing role
        formData.password || null
      );

      if (result.success) {
        Swal.fire({ icon: 'success', title: 'Profile Updated', text: result.message, timer: 1500, showConfirmButton: false });
        // Update local storage
        const updatedUser = { ...user, username: formData.username };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        Swal.fire({ icon: 'error', title: 'Update Failed', text: result.message });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <DashboardLayout><div className="p-10 text-center">Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
            <span className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              ⚙️
            </span>
            Paramètres du Compte
          </h1>
          <p className="text-neutral-500 mt-2 font-medium">Gérez vos informations de connexion et de sécurité.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-sm">
              <div className="w-20 h-20 bg-neutral-100 rounded-3xl flex items-center justify-center text-3xl mb-4 mx-auto font-black text-neutral-400">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <h3 className="font-black text-neutral-900 capitalize">{user.username}</h3>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Shield size={12} className="text-blue-500" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{user.role}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <form onSubmit={handleUpdateProfile} className="bg-white border border-neutral-100 p-8 rounded-3xl shadow-sm space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">Nom d'utilisateur</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <User className="text-blue-500" size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full pl-16 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">Nouveau Mot de passe</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Lock className="text-neutral-400" size={16} />
                      </div>
                      <input 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Laisser vide pour ne pas changer"
                        className="w-full pl-16 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">Confirmer le Mot de passe</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Lock className="text-neutral-400" size={16} />
                      </div>
                      <input 
                        type="password" 
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="w-full pl-16 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-50 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  <Save size={16} /> {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;
