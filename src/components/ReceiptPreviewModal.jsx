import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Settings, ChevronRight, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

function ReceiptPreviewModal({ isOpen, onClose, selectedPackage, subSessions }) {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptRef = useRef();

  useEffect(() => {
    if (isOpen) {
      loadPrinters();
    }
  }, [isOpen]);

  const loadPrinters = async () => {
    try {
      const res = await window.api.getPrinters();
      if (res.success) {
        setPrinters(res.printers);
        const defaultPrinter = res.printers.find(p => p.isDefault);
        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.name);
        } else if (res.printers.length > 0) {
          setSelectedPrinter(res.printers[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to load printers:", err);
    }
  };

  const calculateTotalPaid = () => {
    return subSessions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  };

  const handlePrint = async () => {
    if (!selectedPrinter) {
       Swal.fire({ icon: 'warning', title: 'No Printer Selected' });
       return;
    }
    
    setIsPrinting(true);
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0; padding: 0;
            width: 80mm;
            color: #000;
          }
          .receipt-container { padding: 10px; box-sizing: border-box; }
          .text-center { text-align: center; }
          h2 { margin: 5px 0; font-size: 18px; font-weight: bold; }
          h3 { margin: 5px 0; font-size: 16px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          p { margin: 3px 0; font-size: 12px; }
          .row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px; }
          .table th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 3px; }
          .table td { padding: 3px 0; border-bottom: 1px dashed #ccc; }
          .text-right { text-align: right; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; font-style: italic; }
          
          /* Utility Classes based on Tailwind mapping */
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .w-full { width: 100%; }
          .text-sm { font-size: 14px; }
          .text-xs { font-size: 12px; }
          .font-black { font-weight: 900; }
          .font-bold { font-weight: bold; }
          .font-medium { font-weight: 500; }
          .capitalize { text-transform: capitalize; }
          .m-0 { margin: 0; }
          .mb-1 { margin-bottom: 4px; }
          .mb-3 { margin-bottom: 12px; }
          .mb-4 { margin-bottom: 16px; }
          .mt-1 { margin-top: 4px; }
          .mt-4 { margin-top: 16px; }
          .mt-8 { margin-top: 32px; }
          .pb-1 { padding-bottom: 4px; }
          .py-1 { padding-top: 4px; padding-bottom: 4px; }
          .leading-tight { line-height: 1.25; }
          .tracking-tighter { letter-spacing: -0.05em; }
        </style>
      </head>
      <body>
        ${receiptRef.current.innerHTML}
      </body>
      </html>
    `;

    try {
       const res = await window.api.printThermalReceipt(receiptHTML, selectedPrinter);
       if (res.success) {
         Swal.fire({ icon: 'success', title: 'Printed successfully!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
         onClose();
       } else {
         Swal.fire({ icon: 'error', title: 'Print Failed', text: res.message });
       }
    } catch (err) {
       Swal.fire({ icon: 'error', title: 'Print Error', text: err.message });
    } finally {
       setIsPrinting(false);
    }
  };

  if (!isOpen || !selectedPackage) return null;

  const totalPaid = calculateTotalPaid();
  const remaining = selectedPackage.total_price - totalPaid;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-neutral-100 w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-neutral-200 flex flex-col md:flex-row max-h-[90vh] animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Settings Panel */}
        <div className="w-full md:w-1/3 bg-white p-8 flex flex-col border-r border-neutral-200 overflow-y-auto">
           <div className="flex justify-between items-center mb-10">
             <div>
               <h3 className="text-2xl font-black text-neutral-900 flex items-center gap-3">
                  <Printer size={24} className="text-blue-500" /> Print Receipt
               </h3>
               <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Thermal Delivery</p>
             </div>
             <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-all">
               <X size={20} />
             </button>
           </div>

           <div className="flex-1 space-y-6">
             <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                   <Settings size={14} /> Destination Printer
                </label>
                <div className="relative">
                  <select 
                    value={selectedPrinter} 
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="w-full pl-4 pr-10 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 appearance-none outline-none"
                  >
                     <option value="" disabled>Select a printer...</option>
                     {printers.map((p, i) => (
                       <option key={i} value={p.name}>{p.name} {p.isDefault ? '(Default)' : ''}</option>
                     ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                     <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
             </div>
             
             <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Configuration Details</p>
               <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                 Receipt will be printed at exactly 80mm width standard encoding. Backgrounds and margins are dynamically removed for thermal clarity.
               </p>
             </div>
           </div>

           <button 
             onClick={handlePrint}
             disabled={isPrinting}
             className="w-full mt-6 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
           >
             {isPrinting ? <Clock className="animate-spin" size={16} /> : <Printer size={16} />}
             {isPrinting ? 'Sending to Queue...' : 'Confirm & Print'}
           </button>
        </div>

        {/* Live Preview Panel (Scaled) */}
        <div className="w-full md:w-2/3 p-8 flex items-center justify-center bg-neutral-100 overflow-y-auto">
           <div className="shadow-2xl shadow-black/10 bg-white" style={{ width: '80mm', minHeight: '100mm' }}>
              <div ref={receiptRef} className="receipt-container p-4 font-sans text-black" style={{ color: '#000', backgroundColor: '#fff' }}>
                 <div className="text-center mb-4">
                    <h2 className="text-xl font-black m-0 mb-1 leading-tight tracking-tighter">Dental Clinic</h2>
                    <p className="text-xs font-medium m-0 leading-tight">Treatment Plan Receipt</p>
                    <p className="text-[10px] m-0 mt-1">{new Date().toLocaleString()}</p>
                 </div>
                 
                 <div className="divider border-t border-dashed border-black my-2"></div>
                 
                 <div className="mb-3">
                    <h3 className="text-sm font-black m-0 mb-1 border-b border-dashed border-black pb-1">Patient Info</h3>
                    <div className="flex justify-between text-[11px] mt-1"><span className="font-bold">Name:</span> <span className="capitalize">{selectedPackage.patient_name}</span></div>
                    <div className="flex justify-between text-[11px]"><span className="font-bold">ID:</span> <span>{selectedPackage.patient_id || '---'}</span></div>
                 </div>

                 <div className="mb-3">
                    <h3 className="text-sm font-black m-0 mb-1 border-b border-dashed border-black pb-1">Plan Configuration</h3>
                    <div className="flex justify-between text-[11px] mt-1"><span className="font-bold">Plan:</span> <span className="capitalize">{selectedPackage.name}</span></div>
                    <div className="flex justify-between text-[11px]"><span className="font-bold">Ref:</span> <span>{selectedPackage.package_id}</span></div>
                 </div>

                 <div className="mb-3">
                    <h3 className="text-sm font-black m-0 mb-1 border-b border-dashed border-black pb-1">Financial Summary</h3>
                    <div className="flex justify-between text-[11px] mt-1"><span className="font-bold">Total Fee:</span> <span>{Number(selectedPackage.total_price).toLocaleString()} DA</span></div>
                    <div className="flex justify-between text-[11px]"><span className="font-bold">Total Paid:</span> <span>{totalPaid.toLocaleString()} DA</span></div>
                    <div className="flex justify-between text-[11px]"><span className="font-bold">Remaining:</span> <span>{remaining.toLocaleString()} DA</span></div>
                 </div>
                 
                 {subSessions.length > 0 && (
                   <div className="mt-4">
                      <h3 className="text-sm font-black m-0 mb-1 border-b border-dashed border-black pb-1">Sub Sessions Timeline</h3>
                      <table className="table">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="py-1">Date</th>
                            <th className="py-1 text-right">Amount (DA)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subSessions.map(s => (
                            <tr key={s.id}>
                              <td className="py-1">{s.date}</td>
                              <td className="py-1 text-right font-bold">{Number(s.amount).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                 )}

                 <div className="mt-8 text-center text-[10px] italic font-bold">
                   Thank you for choosing our clinic!
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

export default ReceiptPreviewModal;
