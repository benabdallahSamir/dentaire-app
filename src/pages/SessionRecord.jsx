import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import SessionModal from '../components/SessionModal';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  CreditCard, 
  FileText,
  Clock,
  Printer,
  ChevronLeft,
  Activity,
  Stethoscope,
  FileSearch,
  Image as ImageIcon,
  Edit2,
  ExternalLink,
  Maximize2,
  Download
} from 'lucide-react';

function SessionRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
  }, [id]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    try {
      const res = await window.api.getSessionById(id);
      if (res.success) {
        setSession(res.session);
        if (res.session.radio_path) {
          fetchRadioPreview(res.session.radio_path);
        } else {
          setPreviewData(null);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Session non trouvée.',
        });
      }
    } catch (err) {
      console.error("Failed to fetch session details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRadioPreview = async (fileName) => {
    setIsPreviewLoading(true);
    try {
      const res = await window.api.readRadioFile(fileName);
      if (res.success && res.mime.startsWith('image/')) {
        setPreviewData(res.data);
      } else {
        setPreviewData(null);
      }
    } catch (err) {
      console.error("Preview failed:", err);
      setPreviewData(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenRadio = async () => {
    if (session.radio_path) {
      const result = await window.api.openRadioFile(session.radio_path);
      if (result && !result.success) {
        Swal.fire({
           icon: 'error',
           title: 'Erreur',
           text: result.message || 'Impossible d\'ouvrir le fichier.',
        });
      }
    }
  };

  const handleSaveEdit = async (formData) => {
    try {
      const result = await window.api.updateSession(
        session.id,
        formData.patient_id,
        formData.date,
        formData.amount,
        formData.note,
        session.package_id,
        formData.diagnostic,
        formData.act,
        formData.maladi,
        formData.radio_path
      );

      if (result.success) {
        setIsEditModalOpen(false);
        Swal.fire({
          icon: 'success',
          title: 'Mis à jour',
          text: 'La session a été modifiée avec succès.',
          timer: 1500,
          showConfirmButton: false
        });
        fetchSessionDetails();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: result.message
        });
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4 text-neutral-400">
          <h1 className="text-xl font-black uppercase tracking-widest italic">Session not found</h1>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-neutral-100 text-neutral-600 rounded-xl font-bold">Retour</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 pb-20">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
           <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-400 hover:text-blue-500 transition-colors font-bold text-xs uppercase tracking-widest group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Retour au Dossier
          </button>
          
          <div className="flex items-center gap-3 print:hidden">
             <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 transition-all font-bold text-xs uppercase tracking-widest shadow-sm"
            >
              <Edit2 size={16} />
              Modifier
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-all font-bold text-xs uppercase tracking-widest shadow-xl shadow-neutral-900/20"
            >
              <Printer size={16} />
              Imprimer
            </button>
          </div>
        </div>

        {/* Global Content Grid */}
        <div className="w-full space-y-10">
          
          {/* Main Receipt Card */}
          <div className="max-w-3xl mx-auto w-full bg-white border border-neutral-100 rounded-[40px] shadow-2xl shadow-neutral-200/50 overflow-hidden print:border-none print:shadow-none">
             {/* Header Section */}
             <div className="p-12 border-b border-dashed border-neutral-200 relative">
                <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-neutral-100 rounded-full print:hidden"></div>
                <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-neutral-100 rounded-full print:hidden"></div>

                <div className="flex justify-between items-start mb-12">
                   <div>
                     <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-2">Fiche de Session</h2>
                     <h1 className="text-4xl font-black text-neutral-900 tracking-tight">SS-{String(session.id).padStart(3, '0')}</h1>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 italic">Date d'enregistrement</p>
                     <p className="text-sm font-bold text-neutral-900">{session.created_at?.split(' ')[0]}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-12">
                   <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <User size={12} className="text-blue-500" /> Patient
                      </p>
                      <div className="flex flex-col">
                         <span className="text-lg font-black text-neutral-900 capitalize">{session.patient_name}</span>
                         <span className="text-xs font-bold text-neutral-400 font-mono italic">ID: {session.patient_display_id}</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2 justify-end">
                         <Clock size={12} className="text-blue-500" /> Date du Soin
                      </p>
                      <span className="text-lg font-black text-neutral-900">{session.date}</span>
                   </div>
                </div>
             </div>

             {/* Details Section */}
             <div className="p-12 bg-neutral-50/50 space-y-10">
                <div className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-sm">
                   <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CreditCard size={12} className="text-blue-500" /> Règlement
                   </p>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-neutral-600">Montant réglé</span>
                      <span className="text-3xl font-black text-blue-600 font-mono tracking-tighter">
                         {Number(session.amount).toLocaleString()} <span className="text-xs">DA</span>
                      </span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      <div>
                         <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity size={12} className="text-red-500" strokeWidth={3} /> Antécédents
                         </p>
                         <p className="text-sm font-bold text-neutral-800 bg-white p-5 rounded-2xl border border-neutral-100">
                            {session.maladi || "Néant"}
                         </p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Stethoscope size={12} className="text-blue-500" strokeWidth={3} /> Diagnostic
                         </p>
                         <p className="text-sm font-medium text-neutral-600 bg-white p-5 rounded-2xl border border-neutral-100 leading-relaxed whitespace-pre-wrap">
                            {session.diagnostic || "Non spécifié"}
                         </p>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div>
                         <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileSearch size={12} className="text-blue-500" strokeWidth={3} /> Acte Médical
                         </p>
                         <p className="text-sm font-medium text-neutral-600 bg-white p-5 rounded-2xl border border-neutral-100 leading-relaxed whitespace-pre-wrap">
                            {session.act || "Non spécifié"}
                         </p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText size={12} className="text-blue-500" /> Notes
                         </p>
                         <p className="text-sm font-medium text-neutral-500 italic bg-white p-5 rounded-2xl border border-neutral-100 leading-relaxed whitespace-pre-wrap">
                            {session.note || "Aucune note."}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="pt-10 border-t border-neutral-100 text-center">
                   <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">Logiciel de Gestion Dentaire • Elite Dental</p>
                </div>
             </div>
          </div>

          {/* Radio File Section */}
          {session.radio_path && (
            <div className="max-w-3xl mx-auto w-full animate-in slide-in-from-bottom-10 duration-700">
               <div className="bg-white border border-neutral-100 rounded-[40px] shadow-xl shadow-neutral-200/50 p-10 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={28} className="text-blue-600" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Radiographie Jointe</p>
                        <p className="text-sm font-bold text-neutral-900 truncate max-w-xs">{session.radio_path}</p>
                     </div>
                  </div>
                  <button
                    onClick={handleOpenRadio}
                    className="flex-shrink-0 flex items-center gap-3 px-8 py-4 bg-neutral-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-800 hover:scale-105 transition-all active:scale-95 shadow-xl shadow-neutral-900/20"
                  >
                     <Maximize2 size={18} />
                     Voir la Radio
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>

      <SessionModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        isEditMode={true}
        targetSession={session}
        lockedPatient={true}
      />
    </DashboardLayout>
  );
}

export default SessionRecord;
