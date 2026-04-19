import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';

function DashboardLayout({ children }) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    const saved = localStorage.getItem('sidebar-visible');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-visible', JSON.stringify(isSidebarVisible));
  }, [isSidebarVisible]);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100 font-sans transition-colors duration-300">
      {/* Sidebar with visibility control */}
      <Sidebar isVisible={isSidebarVisible} toggleVisibility={() => setIsSidebarVisible(!isSidebarVisible)} />
      
      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col h-screen overflow-y-auto relative">
        {/* Toggle Button for Sidebar (Visible when sidebar is hidden) */}
        {!isSidebarVisible && (
          <button 
            onClick={() => setIsSidebarVisible(true)}
            className="absolute top-6 left-6 z-30 p-2 bg-white rounded-xl shadow-md hover:bg-blue-50 text-blue-600 transition-all active:scale-95"
          >
            <Menu size={24} />
          </button>
        )}

        {/* We place children inside a padding wrapper */}
        <div className="w-full mx-auto p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
