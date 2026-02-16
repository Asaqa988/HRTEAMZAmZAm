
import React, { useRef } from 'react';
import { X, Download, Printer, Loader2, Sparkles } from 'lucide-react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string | null;
  loading: boolean;
  name: string;
}

const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose, htmlContent, loading, name }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-slate-100 rounded-[2rem] w-full max-w-4xl h-full flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="font-black text-slate-900 tracking-tight">AI Resume Generator</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital PDF Artifact</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && htmlContent && (
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Printer size={16} /> Save as PDF
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-12 bg-slate-200/50 print:p-0 print:bg-white">
          <div 
            id="printable-resume"
            ref={printRef}
            className={`mx-auto bg-white shadow-xl min-h-[29.7cm] w-full max-w-[21cm] p-8 sm:p-16 transition-all duration-500 print:shadow-none print:max-w-none print:m-0 print:p-8 ${
              loading ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center py-40">
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Structuring Intelligence...</p>
                <p className="text-xs text-slate-400 mt-2">Gemini is drafting a professional narrative.</p>
              </div>
            ) : htmlContent ? (
              <div 
                className="resume-content prose prose-slate max-w-none 
                prose-h1:text-4xl prose-h1:font-black prose-h1:tracking-tighter prose-h1:mb-1 prose-h1:uppercase
                prose-h2:text-sm prose-h2:font-black prose-h2:uppercase prose-h2:tracking-[0.2em] prose-h2:text-indigo-600 prose-h2:border-b-2 prose-h2:border-indigo-100 prose-h2:pb-2 prose-h2:mt-8
                prose-p:text-sm prose-p:text-slate-600 prose-p:leading-relaxed
                prose-ul:text-sm prose-ul:text-slate-600 prose-li:mb-1"
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
              />
            ) : (
              <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
                No content generated.
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-resume, #printable-resume * {
            visibility: visible;
          }
          #printable-resume {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 2cm !important;
            box-shadow: none !important;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>
    </div>
  );
};

export default ResumeModal;
