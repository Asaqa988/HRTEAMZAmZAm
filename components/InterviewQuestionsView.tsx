
import React, { useState } from 'react';
import { HelpCircle, Loader2, Sparkles, BrainCircuit, ShieldCheck, FileText } from 'lucide-react';
import { generateInterviewQuestions } from '../services/geminiService';
import { InterviewQuestion } from '../types';

const InterviewQuestionsView: React.FC = () => {
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('Junior');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    setQuestions([]);
    setError(null);
    
    try {
      const result = await generateInterviewQuestions(title, level, jobDescription);
      setQuestions(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">AI Interview Assistant</h2>
        <p className="text-slate-500 font-medium">Generate targeted interview questions to evaluate top-tier candidates.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Form Panel */}
        <aside className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BrainCircuit size={14} /> Generator Settings
            </h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1 uppercase tracking-widest">Role Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  placeholder="e.g. Senior HR Specialist"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1 uppercase tracking-widest">Seniority Level</label>
                <select 
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Manager">Manager</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-700 block mb-1 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} /> Job Description <span className="text-slate-400 text-[8px]">(Optional)</span>
                </label>
                <textarea 
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner h-32 resize-none"
                  placeholder="Paste job details for better precision..."
                />
              </div>
              <button 
                disabled={loading || !title.trim()}
                className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs ${
                  loading ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {loading ? 'Analyzing...' : 'Generate Set'}
              </button>
            </form>

            {error && (
              <p className="text-[10px] text-red-500 font-bold bg-red-50 p-3 rounded-lg text-center leading-tight">
                {error}
              </p>
            )}
          </div>
        </aside>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center animate-pulse bg-white border border-slate-200 rounded-[3rem] shadow-sm">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-10 animate-pulse"></div>
                <Loader2 className="animate-spin text-indigo-600 mb-6 relative" size={48} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Processing Intelligence</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Customizing questions for {level} {title}</p>
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 pb-12">
              <div className="grid grid-cols-1 gap-6">
                {questions.map((q, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-indigo-100 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-50/50 transition-colors"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {q.category}
                      </span>
                      <div className="p-2 bg-slate-50 rounded-xl text-slate-300 group-hover:text-indigo-600 transition-colors">
                        <HelpCircle size={20} />
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-black text-slate-900 leading-tight mb-6 relative z-10 pr-8">
                      {q.question}
                    </h4>
                    
                    <div className="bg-slate-50 rounded-2xl p-6 flex gap-4 items-start relative z-10 border border-slate-100">
                      <ShieldCheck size={20} className="text-green-600 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Interviewer Insight:</p>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium italic">{q.whatToLookFor}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 text-center bg-white border border-slate-200 rounded-[3rem] shadow-sm p-12">
              <div className="bg-slate-50 p-10 rounded-full mb-6">
                <BrainCircuit size={64} className="opacity-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">No Questions Generated</h3>
              <p className="text-sm font-medium mt-1">Specify a job title and seniority level to start the generation process.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewQuestionsView;
