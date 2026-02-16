
import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Languages, Briefcase, MapPin, Mail, Phone, Globe } from 'lucide-react';
import { parseResume } from '../services/geminiService';
import { ParsedResume } from '../types';

const CVParserView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParsedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    setParsing(true);
    setResult(null);
    setError(null);

    try {
      const base64 = await fileToBase64(file);
      const data = await parseResume(base64, file.type);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to parse the CV. Ensure it's a clear PDF or Image (English/Arabic).");
    } finally {
      setParsing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Automatic CV Parser</h2>
          <p className="text-slate-500 font-medium">Extract structured candidate data from any resume (Arabic & English support).</p>
        </div>
        {result && (
          <button 
            onClick={reset}
            className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <X size={16} /> New Analysis
          </button>
        )}
      </header>

      {!result ? (
        <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="bg-indigo-50 p-8 rounded-full mb-6">
            <Upload size={48} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Upload Candidate Document</h3>
          <p className="text-slate-500 max-w-md mt-2 mb-8">
            Supported formats: PDF, PNG, JPG. Our AI will automatically detect language and extract skills, experience, and contact info.
          </p>

          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" 
            accept=".pdf,image/*"
          />
          
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-10 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-3"
            >
              <FileText size={18} /> {file ? file.name : "Choose CV File"}
            </button>
            
            {file && (
              <button 
                onClick={handleUpload}
                disabled={parsing}
                className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {parsing ? <Loader2 className="animate-spin" size={18} /> : <Languages size={18} />}
                {parsing ? "Parsing Resume..." : "Extract Data with AI"}
              </button>
            )}
          </div>

          {error && (
            <div className="mt-8 flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 px-4 py-2 rounded-xl">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-500">
          {/* Header Card */}
          <div className="lg:col-span-3 bg-indigo-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="flex flex-col md:flex-row gap-8 items-center relative">
              <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30">
                <span className="text-4xl font-black tracking-tighter">
                  {result.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-black tracking-tight">{result.fullName}</h1>
                <p className="text-xl text-indigo-200 font-bold mt-1 uppercase tracking-tighter">{result.title || "Professional Candidate"}</p>
                <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                  {result.email && <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-xl border border-white/10"><Mail size={14} /> {result.email}</div>}
                  {result.phone && <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-xl border border-white/10"><Phone size={14} /> {result.phone}</div>}
                  {result.location && <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-xl border border-white/10"><MapPin size={14} /> {result.location}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Left Column: Experience */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-8 uppercase tracking-tighter">
                <Briefcase size={20} className="text-indigo-600" /> Professional Experience
              </h3>
              <div className="space-y-8">
                {result.experience.map((exp, i) => (
                  <div key={i} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                    <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    <h4 className="font-black text-slate-900 text-lg leading-tight">{exp.title}</h4>
                    <p className="text-indigo-600 font-bold text-sm uppercase tracking-tighter mt-1">{exp.company} • {exp.duration}</p>
                    <p className="text-slate-500 text-sm mt-3 leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-8 uppercase tracking-tighter">
                <Globe size={20} className="text-indigo-600" /> Career Summary
              </h3>
              <p className="text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-6 py-2">
                {result.summary || "No professional summary provided in the document."}
              </p>
            </div>
          </div>

          {/* Right Column: Skills & Education */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6 uppercase tracking-tighter">
                <CheckCircle2 size={20} className="text-indigo-600" /> Core Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.skills.map((skill, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-100 transition-all cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6 uppercase tracking-tighter">
                <FileText size={20} className="text-indigo-600" /> Education
              </h3>
              <div className="space-y-6">
                {result.education.map((edu, i) => (
                  <div key={i}>
                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-tighter">{edu.degree}</h4>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">{edu.school}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">{edu.period}</p>
                  </div>
                ))}
              </div>
            </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6 uppercase tracking-tighter">
                <Languages size={20} className="text-indigo-600" /> Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.languages.map((lang, i) => (
                  <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVParserView;
