import React, { useState, useRef } from 'react';
import { Lock, Upload, FileText, AlertCircle, CheckCircle2, TrendingUp, X, Scale, Loader2, Send, Image as ImageIcon } from 'lucide-react';
import { measureKPIPerformance } from '../services/geminiService';

const KPIManagement: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');

  // Measure KPI States
  const [loading, setLoading] = useState(false);
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    category: '',
    kpi: '',
    actual2025: '',
    target2026: '',
    weight: '',
    dueDate: '',
    comments: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMeasure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawFile) {
      setError("Please upload a Report (Image) first.");
      return;
    }

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(rawFile.type)) {
      setError("Invalid file type. Please upload a valid image (JPEG, PNG, WEBP, GIF) of your KPI table.");
      return;
    }
    setLoading(true);
    setAnalysisResult(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(rawFile);
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Remove data url prefix
        const base64Content = base64.split(',')[1];

        try {
          // Pass mimeType (e.g., image/png) to the service
          const result = await measureKPIPerformance(base64Content, rawFile.type, formData);
          setAnalysisResult(result);
        } catch (err: any) {
          setError(err.message || "Analysis failed");
        } finally {
          setLoading(false);
        }
      };
    } catch (err) {
      setError("Failed to process file");
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        const fileUrl = URL.createObjectURL(file);
        setPreviewUrl(fileUrl);
        setFileName(file.name);
        setFileType(file.type);
        setRawFile(file);
        setError('');
      } else {
        setError('Please upload a valid PDF or Image file.');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -mr-8 -mt-8 z-0"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-indigo-600 p-4 rounded-2xl text-white mb-6 shadow-lg shadow-indigo-200">
              <Lock size={32} />
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">KPI Management</h2>
            <p className="text-slate-500 mb-8 font-medium">Restricted Access Area. Authenticate to proceed.</p>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900"
                  placeholder="Enter Access Key"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-500 text-xs font-bold bg-red-50 py-2 rounded-lg animate-in slide-in-from-top-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-xl shadow-indigo-100"
              >
                Verify Access
              </button>
            </form>
          </div>
        </div>
        <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Secured by Zamzam Enterprise Security</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 animate-in slide-in-from-bottom-8 duration-500">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <TrendingUp className="text-indigo-600" size={32} />
            KPI Management
          </h2>
          <p className="text-slate-500 font-medium mt-1">Monitor and analyze key performance indicators.</p>
        </div>
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-green-100">
          <CheckCircle2 size={16} /> Authenticated
        </div>
      </header>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <button
              onClick={triggerFileInput}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
            >
              <Upload size={16} /> Upload New Report
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="application/pdf,image/*"
            />
            {fileName && (
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                {fileType.startsWith('image/') ? (
                  <ImageIcon size={16} className="text-blue-500" />
                ) : (
                  <FileText size={16} className="text-red-500" />
                )}
                {fileName}
              </div>
            )}

            {fileName && (
              <button
                onClick={() => setIsMeasureModalOpen(true)}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-2"
              >
                <Scale size={16} /> Measure KPI
              </button>
            )}
          </div>
          {error && <span className="text-red-500 text-xs font-bold">{error}</span>}
        </div>

        <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            fileType.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt="KPI Report Preview"
                className="max-w-full max-h-full rounded-2xl shadow-2xl border border-slate-200 object-contain"
              />
            ) : (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-2xl shadow-2xl border border-slate-200"
                title="KPI Report Viewer"
              />
            )
          ) : (
            <div className="text-center text-slate-400">
              <div className="bg-white p-8 rounded-[3rem] shadow-sm inline-block mb-6">
                <FileText size={64} className="opacity-20" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-600">No Report Loaded</h3>
              <p className="text-sm font-medium mt-1">Upload a PDF or Image of your KPI table to view the analysis.</p>
              <button
                onClick={triggerFileInput}
                className="mt-6 text-indigo-600 font-bold hover:underline"
              >
                Browse Files
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Measure KPI Modal */}
      {isMeasureModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Measure Performance</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Strategic Analysis</p>
              </div>
              <button onClick={() => setIsMeasureModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!analysisResult ? (
                <form onSubmit={handleMeasure} className="space-y-4">
                  <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-xs font-bold flex gap-2 items-start mb-4">
                    <AlertCircle size={16} className="mt-0.5" />
                    <div>
                      Tip: For best results, use an Image (Screenshot) of your KPI table.
                      <br />
                      If you uploaded a PDF, ensure it's clear and readable.
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-tighter">Category</label>
                      <input
                        required
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Financial"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-tighter">KPI Name</label>
                      <input
                        required
                        value={formData.kpi}
                        onChange={e => setFormData({ ...formData, kpi: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Revenue Growth"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-tighter">2025 Actual</label>
                      <input
                        required
                        value={formData.actual2025}
                        onChange={e => setFormData({ ...formData, actual2025: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. $1.2M"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-tighter">2026 Target</label>
                      <input
                        required
                        value={formData.target2026}
                        onChange={e => setFormData({ ...formData, target2026: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. $1.5M"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-tighter">Weight %</label>
                      <input
                        value={formData.weight}
                        onChange={e => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. 20%"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-tighter">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-tighter">Comments</label>
                    <textarea
                      value={formData.comments}
                      onChange={e => setFormData({ ...formData, comments: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Additional context..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    {loading ? 'Analyzing Performance...' : 'Run Analysis'}
                  </button>
                </form>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 prose prose-sm max-w-none">
                    <h4 className="text-emerald-700 font-bold mb-4 flex items-center gap-2">
                      <CheckCircle2 size={18} /> Analysis Complete
                    </h4>
                    <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {analysisResult}
                    </div>
                  </div>
                  <button
                    onClick={() => setAnalysisResult(null)}
                    className="mt-6 w-full py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Analyze Another KPI
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIManagement;
