import Sidebar from '../components/Sidebar';

function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 font-sans transition-colors duration-300">
      {/* Sidebar gets pinned to the side naturally by flex rules */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col h-screen overflow-y-auto relative">
        {/* We place children inside a padding wrapper */}
        <div className="w-full mx-auto p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
