
import React, { useState } from 'react';
import { X, Copy, Check, Send, Loader2, Sparkles, MessageSquare } from 'lucide-react';

interface JobOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerText: string | null;
  loading: boolean;
  name: string;
}

const JobOfferModal: React.FC<JobOfferModalProps> = ({ isOpen, onClose, offerText, loading, name }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (offerText) {
      navigator.clipboard.writeText(offerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-xl">
              <Send size={18} />
            </div>
            <div>
              <h2 className="font-black tracking-tight">Send Job Invitation</h2>
              <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Target: {name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
              <p className="font-bold text-slate-900">Personalizing Offer...</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Gemini is matching profiles</p>
            </div>
          ) : offerText ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles size={16} />
                <span className="text-xs font-black uppercase tracking-widest">AI Suggested Message</span>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative group">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap italic">
                  {offerText}
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied to Clipboard' : 'Copy Message'}
                </button>
                <button 
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Dismiss
                </button>
              </div>
              
              <p className="text-[10px] text-center text-slate-400 font-medium">
                Tip: Personalize the message before sending to increase response rates.
              </p>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Failed to generate invitation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobOfferModal;
