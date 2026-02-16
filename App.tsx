import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  ArrowUpRight,
  Briefcase,
  TrendingUp,
  Clock,
  Sparkles,
  Loader2,
  Filter,
  Send,
  Languages,
  HelpCircle,
  // Fix: Added missing AlertCircle import used on line 222
  AlertCircle,
  Lock
} from 'lucide-react';
import { LinkedInProfile, SearchParams } from './types';
import { startScrapingRun, pollRunStatus, getRunResults } from './services/apifyService';
import { getMarketTrends, generateResume, generateJobOffer } from './services/geminiService';
import ProfileCard from './components/ProfileCard';
import InsightsPanel from './components/InsightsPanel';
import ResumeModal from './components/ResumeModal';
import JobOfferModal from './components/JobOfferModal';
import CVParserView from './components/CVParserView';
import InterviewQuestionsView from './components/InterviewQuestionsView';
import KPIManagement from './components/KPIManagement';

type View = 'dashboard' | 'find-candidate' | 'employees' | 'payroll' | 'settings' | 'cv-parser' | 'interview-questions' | 'kpi-management';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Existing Search States
  const [params, setParams] = useState<SearchParams>({
    title: 'HR',
    location: 'Jordan',
    yearsOfExperience: '5-10',
    limit: 20,
    actorId: 'demo-actor'
  });
  const [results, setResults] = useState<LinkedInProfile[]>([]);
  const [marketInsights, setMarketInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<LinkedInProfile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Resume states
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [currentResumeHtml, setCurrentResumeHtml] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeProfileName, setResumeProfileName] = useState('');

  // Job Offer states
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [currentOfferText, setCurrentOfferText] = useState<string | null>(null);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerProfileName, setOfferProfileName] = useState('');

  const lastTrendFetch = useRef<string>('');
  const trendFetchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeView === 'find-candidate') {
      const fetchTrends = async () => {
        const currentKey = `${params.title}-${params.location}`;
        if (lastTrendFetch.current === currentKey) return;

        try {
          const trends = await getMarketTrends(params.title, params.location);
          setMarketInsights(trends);
          lastTrendFetch.current = currentKey;
        } catch (err: any) {
          console.warn("Trend fetch skipped or limited:", err.message);
          if (err.message.includes("Rate limit")) {
            setMarketInsights("Market AI is currently on a break due to high usage. Trends will resume shortly.");
          }
        }
      };

      if (trendFetchTimeoutRef.current) window.clearTimeout(trendFetchTimeoutRef.current);
      trendFetchTimeoutRef.current = window.setTimeout(fetchTrends, 1500); // Higher debounce

      return () => {
        if (trendFetchTimeoutRef.current) window.clearTimeout(trendFetchTimeoutRef.current);
      };
    }
  }, [activeView, params.title, params.location]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedProfile(null);
    setStatus('Initializing AI Extraction Engine...');

    try {
      const runId = await startScrapingRun(params);
      let currentStatus = 'RUNNING';
      let pollCount = 0;

      while (currentStatus === 'RUNNING' && pollCount < 3) {
        setStatus(`Mining profiles matching "${params.title}" in ${params.location}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        currentStatus = await pollRunStatus(runId);
        pollCount++;
      }

      setStatus('Processing with Gemini Intelligence...');
      await new Promise(resolve => setTimeout(resolve, 800));

      const data = await getRunResults(runId);
      setResults(data.profiles);
      setStatus('');
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchCV = async (profile: LinkedInProfile) => {
    setResumeProfileName(profile.fullName);
    setIsResumeModalOpen(true);
    setResumeLoading(true);
    setCurrentResumeHtml(null);
    try {
      const html = await generateResume(profile);
      setCurrentResumeHtml(html);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI Resume.");
      setIsResumeModalOpen(false);
    } finally {
      setResumeLoading(false);
    }
  };

  const handleSendOffer = async (profile: LinkedInProfile) => {
    setOfferProfileName(profile.fullName);
    setIsOfferModalOpen(true);
    setOfferLoading(true);
    setCurrentOfferText(null);
    try {
      const text = await generateJobOffer(profile, params.title);
      setCurrentOfferText(text);
    } catch (err: any) {
      setError(err.message || "Failed to generate Job Offer.");
      setIsOfferModalOpen(false);
    } finally {
      setOfferLoading(false);
    }
  };

  const SidebarItem = ({ icon: Icon, label, view, active }: { icon: any, label: string, view: View, active: boolean }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} />
      <span className="font-bold text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <Briefcase size={20} />
              </div>
              <h1 className="font-black text-xl tracking-tighter text-slate-900">Zamzam <span className="text-indigo-600">HR</span></h1>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" view="dashboard" active={activeView === 'dashboard'} />
          <SidebarItem icon={Sparkles} label="Find Candidate (AI)" view="find-candidate" active={activeView === 'find-candidate'} />
          <SidebarItem icon={Languages} label="CV Parser (AI)" view="cv-parser" active={activeView === 'cv-parser'} />
          <SidebarItem icon={HelpCircle} label="Interview Assistant" view="interview-questions" active={activeView === 'interview-questions'} />
          <div className="py-2 px-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HR Management</span></div>
          <SidebarItem icon={Users} label="Employee Directory" view="employees" active={activeView === 'employees'} />
          <SidebarItem icon={CreditCard} label="Payroll & Finance" view="payroll" active={activeView === 'payroll'} />
          <SidebarItem icon={Lock} label="KPI Management" view="kpi-management" active={activeView === 'kpi-management'} />
          <div className="pt-8 border-t border-slate-100 mt-8">
            <SidebarItem icon={Settings} label="Settings" view="settings" active={activeView === 'settings'} />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm">
            <LogOut size={20} />
            {isSidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {error && (
          <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center justify-between shadow-sm animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              <span className="text-sm font-bold">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg"><X size={16} /></button>
          </div>
        )}

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
            <header>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Zamzam Exchange HR Portal</h2>
              <p className="text-slate-500 font-medium">Welcome back, Admin. System is running at optimal capacity.</p>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Workforce', value: '1,248', icon: Users, color: 'bg-blue-600', trend: '+12% this month' },
                { label: 'Active Recruitments', value: '34', icon: Search, color: 'bg-indigo-600', trend: '8 Pending Interviews' },
                { label: 'Payroll Status', value: 'Disbursed', icon: CreditCard, color: 'bg-green-600', trend: 'Next cycle in 12 days' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`${stat.color} p-3 rounded-2xl text-white`}>
                      <stat.icon size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-2 py-1 rounded-lg">Real-time</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-500">{stat.label}</h3>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-xs font-bold text-indigo-600 mt-2 flex items-center gap-1">
                    <TrendingUp size={12} /> {stat.trend}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-lg tracking-tight">Recent Activity</h3>
                  <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
                </div>
                <div className="divide-y divide-slate-50">
                  {[
                    { action: 'Candidate Sourced', target: 'Nazem Khair', time: '12 mins ago', icon: Sparkles },
                    { action: 'Payroll Approved', target: 'Branch 04 - Amman', time: '2 hours ago', icon: CreditCard },
                    { action: 'Leave Request', target: 'Sarah Ahmed', time: '4 hours ago', icon: Clock },
                    { action: 'New Employee', target: 'John Doe', time: 'Yesterday', icon: Plus },
                  ].map((activity, i) => (
                    <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                        <activity.icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{activity.action}</p>
                        <p className="text-xs text-slate-500">{activity.target}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Overview */}
              <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <h3 className="text-2xl font-black tracking-tight mb-4">Talent Acquisition AI</h3>
                <p className="text-indigo-100/80 mb-6 font-medium leading-relaxed">
                  Our proprietary AI integration allows you to extract top-tier talent directly from global professional networks.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveView('find-candidate')}
                    className="bg-white text-indigo-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    LinkedIn Finder <ArrowUpRight size={16} />
                  </button>
                  <button
                    onClick={() => setActiveView('cv-parser')}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform border border-white/20"
                  >
                    CV Parser <Languages size={16} />
                  </button>
                  <button
                    onClick={() => setActiveView('interview-questions')}
                    className="bg-white/10 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform border border-white/20 backdrop-blur-md"
                  >
                    Interview Set <HelpCircle size={16} />
                  </button>
                </div>
                <div className="mt-12 flex gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md flex-1">
                    <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">AI Efficiency</p>
                    <p className="text-xl font-black">94%</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md flex-1">
                    <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Time Saved</p>
                    <p className="text-xl font-black">2.4h <span className="text-[10px] font-medium">/day</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Find Candidate View */}
        {activeView === 'find-candidate' && (
          <div className="flex-1 flex overflow-hidden animate-in slide-in-from-right-8 duration-500">
            {/* Inner Sidebar for Search */}
            <aside className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col overflow-y-auto">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Filter size={14} /> Search Settings
              </h2>
              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-tighter">Job Title</label>
                  <input
                    type="text"
                    value={params.title}
                    onChange={e => setParams({ ...params, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    placeholder="e.g. HR Manager"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-tighter">Location</label>
                  <input
                    type="text"
                    value={params.location}
                    onChange={e => setParams({ ...params, location: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    placeholder="e.g. Jordan"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-tighter">Years of Experience</label>
                  <select
                    value={params.yearsOfExperience}
                    onChange={e => setParams({ ...params, yearsOfExperience: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="0-1">0 - 1 years</option>
                    <option value="1-3">1 - 3 years</option>
                    <option value="3-5">3 - 5 years</option>
                    <option value="5-10">5 - 10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
                <button
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs ${loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'
                    }`}
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  {loading ? 'Processing...' : 'Run Discovery'}
                </button>
              </form>

              {marketInsights && (
                <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
                  <h3 className="text-[10px] font-black text-indigo-300 flex items-center gap-2 mb-3 uppercase tracking-widest">
                    <TrendingUp size={14} /> Market Insight
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {marketInsights}
                  </p>
                </div>
              )}
            </aside>

            {/* Content Feed */}
            <div className="flex-1 flex flex-col">
              <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">{results.length} Candidates Found</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Talent Cloud</p>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                    <LayoutDashboard size={16} />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {status ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-pulse">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                      <Loader2 className="animate-spin text-indigo-600 mb-6 relative" size={48} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">{status}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Integrating LinkedIn & Gemini Intelligence</p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {results.map(profile => (
                      <ProfileCard
                        key={profile.id}
                        profile={profile}
                        isSelected={selectedProfile?.id === profile.id}
                        onSelect={setSelectedProfile}
                        onFetchCV={handleFetchCV}
                        onSendOffer={handleSendOffer}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="bg-slate-100 p-8 rounded-[3rem] mb-6">
                      <Search size={64} className="opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold uppercase tracking-tighter text-slate-900">Initiate Talent Discovery</h3>
                    <p className="text-sm font-medium mt-1">Enter search parameters to find the best matching candidates.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Insight Panel */}
            {selectedProfile && (
              <aside className="w-[32rem] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Intelligence Report</h3>
                    <p className="text-[10px] font-bold text-indigo-600">Gemini Powered Analysis</p>
                  </div>
                  <button onClick={() => setSelectedProfile(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <InsightsPanel selectedProfile={selectedProfile} targetRole={params.title} />
                </div>
              </aside>
            )}
          </div>
        )}

        {/* CV Parser View */}
        {activeView === 'cv-parser' && <CVParserView />}

        {/* Interview Questions View */}
        {activeView === 'interview-questions' && <InterviewQuestionsView />}

        {/* KPI Management View */}
        {activeView === 'kpi-management' && <KPIManagement />}

        {/* Placeholder Views */}
        {(activeView === 'employees' || activeView === 'payroll' || activeView === 'settings') && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 animate-in fade-in duration-500">
            <div className="bg-indigo-50 p-12 rounded-[3rem] mb-8">
              <Briefcase size={64} className="text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Under Maintenance</h2>
            <p className="text-slate-500 max-w-sm mt-2">This module is currently being optimized for the Zamzam Exchange HR infrastructure.</p>
            <button onClick={() => setActiveView('dashboard')} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
              Back to Dashboard
            </button>
          </div>
        )}
      </main>

      <ResumeModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        loading={resumeLoading}
        htmlContent={currentResumeHtml}
        name={resumeProfileName}
      />

      <JobOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        loading={offerLoading}
        offerText={currentOfferText}
        name={offerProfileName}
      />
    </div>
  );
};

export default App;