import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Lock,
  Mail,
  Phone
} from 'lucide-react';
import { LinkedInProfile, SearchParams } from './types';
import { startScrapingRun, pollRunStatus, getRunResults, getMockProfiles, enrichProfiles, EnrichedProfile } from './services/apifyService';
import { generateResume, generateJobOffer } from './services/geminiService';
import ProfileCard from './components/ProfileCard';
import InsightsPanel from './components/InsightsPanel';
import ResumeModal from './components/ResumeModal';
import JobOfferModal from './components/JobOfferModal';
import CVParserView from './components/CVParserView';
import InterviewQuestionsView from './components/InterviewQuestionsView';
import KPIManagement from './components/KPIManagement';
import EnrichedProfileCard from './components/EnrichedProfileCard';
import EnrichedProfileModal from './components/EnrichedProfileModal';

type View = 'dashboard' | 'find-candidate' | 'employees' | 'payroll' | 'settings' | 'cv-parser' | 'interview-questions' | 'kpi-management' | 'talent-pools' | 'ai-analysis';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Enriched Profiles State (Persisted)
  const [enrichedProfiles, setEnrichedProfiles] = useState<EnrichedProfile[]>(() => {
    const saved = localStorage.getItem('zamzam_enriched_profiles');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse enriched profiles", e);
      return [];
    }
  });

  const [selectedEnrichedProfile, setSelectedEnrichedProfile] = useState<EnrichedProfile | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  useEffect(() => {
    localStorage.setItem('zamzam_enriched_profiles', JSON.stringify(enrichedProfiles));
  }, [enrichedProfiles]);

  const handleEnrichProfiles = async (profilesToEnrich: LinkedInProfile[]) => {
    // Deduplicate from existing enriched based on URL
    const existingUrls = new Set(enrichedProfiles.map(p => p.linkedinUrl));
    const newProfiles = profilesToEnrich.filter(p => p.profileUrl && !existingUrls.has(p.profileUrl));

    if (newProfiles.length === 0) {
      alert("All selected profiles are already enriched or have no URL.");
      setActiveView('ai-analysis');
      return;
    }

    if (confirm(`This will use Apify credits to enrich ${newProfiles.length} new profiles. Continue?`)) {
      setIsEnriching(true);
      setStatus(`Enriching ${newProfiles.length} profiles (Batching 5 at a time)...`);
      try {
        const urls = newProfiles.map(p => p.profileUrl).filter(Boolean) as string[];
        const newEnrichedData = await enrichProfiles(urls);
        setEnrichedProfiles(prev => [...newEnrichedData, ...prev]);
        setActiveView('ai-analysis');
        setStatus('');
      } catch (err: any) {
        setError(err.message || "Enrichment failed.");
      } finally {
        setIsEnriching(false);
      }
    }
  };

  // Search State with Advanced Fields (Lazy Init from LocalStorage)
  const [params, setParams] = useState<SearchParams>(() => {
    const saved = localStorage.getItem('zamzam_current_params');
    return saved ? JSON.parse(saved) : {
      title: 'HR',
      location: 'Jordan',
      yearsOfExperience: '5-10',
      limit: 20,
      actorId: 'demo-actor',
      positionLevel: 'Manager',
      targetIndustry: 'Banking',
      coreFunction: 'HR',
      subSpecialization: 'Talent Acquisition',
      skills: {
        mandatory: ['Recruitment', 'Negotiation'],
        preferred: ['LinkedIn Recruiter'],
        niceToHave: []
      },
      companyMapping: {
        target: [],
        competitor: [],
        excluded: []
      },
      geographicFlexibility: false,
      keywordsIncludes: '',
      keywordsExcludes: '',
      education: '',
      currentEmployer: ''
    };
  });

  const [results, setResults] = useState<LinkedInProfile[]>(() => {
    const saved = localStorage.getItem('zamzam_current_results');
    return saved ? JSON.parse(saved) : [];
  });

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

  // Saved Searches / Talent Pools (Lazy Init from LocalStorage)
  const [savedSearches, setSavedSearches] = useState<{ id: string; title: string; profiles: LinkedInProfile[] }[]>(() => {
    const saved = localStorage.getItem('zamzam_saved_searches');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse saved searches", e);
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<string>('current');
  const [poolsViewMode, setPoolsViewMode] = useState<'grid' | 'table'>('grid');


  // Persistence Effects (Save Only)
  useEffect(() => {
    localStorage.setItem('zamzam_saved_searches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  useEffect(() => {
    localStorage.setItem('zamzam_current_results', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem('zamzam_current_params', JSON.stringify(params));
  }, [params]);


  // Helper to update nested state
  const updateSkill = (type: 'mandatory' | 'preferred' | 'niceToHave', value: string) => {
    setParams(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: value.split(',').map(s => s.trim())
      }
    }));
  };

  const updateCompany = (type: 'target' | 'competitor' | 'excluded', value: string) => {
    setParams(prev => ({
      ...prev,
      companyMapping: {
        ...prev.companyMapping,
        [type]: value.split(',').map(s => s.trim())
      }
    }));
  };

  // ... (startScrapingRun and other existing functions)

  {/* Talent Pools View */ }
  {
    activeView === 'talent-pools' && (
      <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Talent Pools</h2>
            <p className="text-slate-500 font-medium">Manage your saved candidate lists and active pipelines.</p>
          </div>
          <button
            onClick={() => setActiveView('find-candidate')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            <Plus size={16} /> Create New Pool
          </button>
        </header>

        {savedSearches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedSearches.map(pool => (
              <div key={pool.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Users size={24} />
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                      {pool.profiles.length} Candidates
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this talent pool?")) {
                          setSavedSearches(prev => prev.filter(p => p.id !== pool.id));
                        }
                      }}
                      className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-900">{pool.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 mb-6">Last updated just now</p>

                <button
                  onClick={() => {
                    setActiveView('find-candidate');
                    setActiveTab(pool.id);
                  }}
                  className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  View Candidates <ArrowUpRight size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
              <Users size={48} className="opacity-20" />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-tighter text-slate-900">No Talent Pools</h3>
            <p className="text-sm font-medium mt-1 max-w-xs text-center">Start a search and click "Save Results" to create your first talent pool.</p>
            <button
              onClick={() => setActiveView('find-candidate')}
              className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
            >
              Go to Candidate Search
            </button>
          </div>
        )}
      </div>
    )
  }



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

      while ((currentStatus === 'RUNNING' || currentStatus === 'READY') && pollCount < 60) {
        setStatus(`Mining profiles matching "${params.title}" in ${params.location}... (${pollCount}/60s)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        currentStatus = await pollRunStatus(runId);
        pollCount++;
      }

      setStatus('Processing with Gemini Intelligence...');
      await new Promise(resolve => setTimeout(resolve, 800));

      const data = await getRunResults(runId, params.location);
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
          <SidebarItem icon={Users} label="Talent Pools (Saved)" view="talent-pools" active={activeView === 'talent-pools'} />
          <SidebarItem icon={Sparkles} label="AI Analysis (Enriched)" view="ai-analysis" active={activeView === 'ai-analysis'} />
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
            <aside className="w-96 bg-white border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="p-6">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Filter size={14} /> Advanced Discovery
                </h2>
                <form onSubmit={handleSearch} className="space-y-8">

                  {/* Consolidated Search Parameters */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-2">Search Parameters</h3>

                    {/* 1. Country / Location */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Country / Location</label>
                      <input
                        type="text"
                        value={params.location}
                        onChange={e => setParams({ ...params, location: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Jordan"
                      />
                    </div>

                    {/* 2. Job Title */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Job Title</label>
                      <input
                        type="text"
                        value={params.title}
                        onChange={e => setParams({ ...params, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. HR Manager"
                      />
                    </div>

                    {/* 3. Keywords to Include */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Keywords to Include (OR)</label>
                      <input
                        type="text"
                        value={params.keywordsIncludes || ''}
                        onChange={e => setParams({ ...params, keywordsIncludes: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Java OR Python"
                      />
                    </div>

                    {/* 4. Keywords to Exclude */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Keywords to Exclude (-)</label>
                      <input
                        type="text"
                        value={params.keywordsExcludes || ''}
                        onChange={e => setParams({ ...params, keywordsExcludes: e.target.value })}
                        className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="e.g. Recruiter OR Sales"
                      />
                    </div>

                    {/* 5. Education */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Education</label>
                      <select
                        value={params.education || ''}
                        onChange={e => setParams({ ...params, education: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">All Candidates</option>
                        <option value="Bachelor OR Bachelors OR BSc OR BA OR B.Sc">Bachelor's Degree</option>
                        <option value="Master OR Masters OR MBA OR MSc OR M.Sc">Master's Degree</option>
                        <option value="Doctorate OR PhD OR Ph.D OR Doctor">Doctoral Degree</option>
                      </select>
                    </div>

                    {/* Other Filters (Collapsable or minimal for now) */}
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Current Employer</label>
                        <input
                          type="text"
                          value={params.currentEmployer || ''}
                          onChange={e => setParams({ ...params, currentEmployer: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Google"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Exp. Years</label>
                        <select
                          value={params.yearsOfExperience}
                          onChange={e => setParams({ ...params, yearsOfExperience: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="0-1">0-1 yrs</option>
                          <option value="1-3">1-3 yrs</option>
                          <option value="3-5">3-5 yrs</option>
                          <option value="5-10">5-10 yrs</option>
                          <option value="10+">10+ yrs</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Position Level</label>
                        <select
                          value={params.positionLevel}
                          onChange={e => setParams({ ...params, positionLevel: e.target.value as any })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Manager">Manager</option>
                          <option value="Head">Head</option>
                          <option value="Director">Director</option>
                          <option value="VP">VP</option>
                          <option value="C-Level">C-Level</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={params.geographicFlexibility}
                        onChange={e => setParams({ ...params, geographicFlexibility: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Global Exp?</label>
                    </div>

                  </div>


                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs shadow-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search size={18} />
                        Find Candidates
                      </>
                    )}
                  </button>
                </form>


              </div>
            </aside>

            {/* Content Feed */}
            <div className="flex-1 flex flex-col bg-slate-50">

              {/* Tab Bar & Actions */}
              <div className="px-6 pt-6 pb-0 flex items-center justify-between border-b border-slate-200 bg-white">
                <div className="flex gap-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('current')}
                    className={`pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'current'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    Current Search
                  </button>
                  {savedSearches.map(search => (
                    <button
                      key={search.id}
                      onClick={() => setActiveTab(search.id)}
                      className={`pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === search.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      {search.title}
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{search.profiles.length}</span>
                    </button>
                  ))}
                </div>

                <div className="pb-2 flex items-center gap-2">
                  {activeTab === 'current' && results.length > 0 && (
                    <button
                      onClick={() => {
                        const title = prompt("Enter a name for this talent pool:", params.title);
                        if (title) {
                          setSavedSearches(prev => [
                            ...prev,
                            { id: Date.now().toString(), title, profiles: [...results] }
                          ]);
                          alert("Results saved to new tab!");
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                      <Plus size={14} /> Save Results
                    </button>
                  )}
                  <div className="h-4 w-px bg-slate-200 mx-2"></div>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                      <LayoutDashboard size={14} />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                      <Menu size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {activeTab === 'current' ? results.length : savedSearches.find(s => s.id === activeTab)?.profiles.length || 0} Candidates Found
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {activeTab === 'current' ? 'Global Talent Cloud' : 'Saved Talent Pool'}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {status && activeTab === 'current' ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-pulse">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                      <Loader2 className="animate-spin text-indigo-600 mb-6 relative" size={48} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">{status}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Integrating LinkedIn & Gemini Intelligence</p>
                  </div>
                ) : (activeTab === 'current' ? results : savedSearches.find(s => s.id === activeTab)?.profiles || []).length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {(activeTab === 'current' ? results : savedSearches.find(s => s.id === activeTab)?.profiles || []).map(profile => (
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
                  <InsightsPanel selectedProfile={selectedProfile} targetRole={params.title} searchParams={params} />
                </div>
              </aside>
            )}
          </div>
        )
        }
        {/* Talent Pools View */}
        {activeView === 'talent-pools' && (
          <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Talent Pools</h2>
                <p className="text-slate-500 font-medium">Manage your saved candidate lists and active pipelines.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white border border-slate-200 p-1 rounded-xl flex gap-1">
                  <button
                    onClick={() => setPoolsViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${poolsViewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutDashboard size={14} /> Grid
                  </button>
                  <button
                    onClick={() => setPoolsViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${poolsViewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Menu size={14} /> Table View
                  </button>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <button
                  onClick={() => {
                    // Get all profiles from current view
                    const profiles = savedSearches.flatMap(p => p.profiles);
                    handleEnrichProfiles(profiles);
                  }}
                  disabled={isEnriching}
                  className="bg-indigo-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-800 transition-colors shadow-lg shadow-indigo-200"
                >
                  {isEnriching ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  Analyze with AI
                </button>
                <div className="w-2"></div>
                <button
                  onClick={() => setActiveView('find-candidate')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  <Plus size={16} /> Create New Pool
                </button>
              </div>
            </header>

            {savedSearches.length > 0 ? (
              poolsViewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedSearches.map(pool => (
                    <div key={pool.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Users size={24} />
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                            {pool.profiles.length} Candidates
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this talent pool?")) {
                                setSavedSearches(prev => prev.filter(p => p.id !== pool.id));
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-slate-900">{pool.title}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1 mb-6">Last updated just now</p>

                      <button
                        onClick={() => {
                          setActiveView('find-candidate');
                          setActiveTab(pool.id);
                        }}
                        className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                      >
                        View Candidates <ArrowUpRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Candidate Name</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Title / Role</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Experience</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Location</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Source Pool</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {savedSearches.flatMap(pool => pool.profiles.map(p => ({ ...p, poolName: pool.title }))).map((candidate, idx) => (
                          <tr key={`${candidate.id}-${idx}`} className="hover:bg-indigo-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={candidate.profilePicUrl || "https://ui-avatars.com/api/?name=" + candidate.fullName} className="w-8 h-8 rounded-full object-cover" alt="" />
                                <span className="font-bold text-sm text-slate-900">{candidate.fullName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-medium text-slate-600 block max-w-[200px] truncate" title={candidate.title}>{candidate.title}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-bold text-slate-600">
                                {candidate.yearsOfExperience || 'N/A'} Yrs
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">{candidate.location}</td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                {candidate.poolName}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <a
                                href={candidate.profileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                              >
                                LinkedIn <ArrowUpRight size={12} />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <Users size={48} className="opacity-20" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tighter text-slate-900">No Talent Pools</h3>
                <p className="text-sm font-medium mt-1 max-w-xs text-center">Start a search and click "Save Results" to create your first talent pool.</p>
                <button
                  onClick={() => setActiveView('find-candidate')}
                  className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
                >
                  Go to Candidate Search
                </button>
              </div>
            )}
          </div>
        )}
        {activeView === 'cv-parser' && <CVParserView />}

        {/* Interview Questions View */}
        {activeView === 'interview-questions' && <InterviewQuestionsView />}

        {/* KPI Management View */}
        {activeView === 'kpi-management' && <KPIManagement />}

        {/* AI Analysis View */}
        {activeView === 'ai-analysis' && (
          <div className="p-8 max-w-full mx-auto w-full space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">AI Analysis</h2>
                <p className="text-slate-500 font-medium">Deep insights from enriched LinkedIn profiles (Powered by Apify & Gemini).</p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Clear all enriched data?")) setEnrichedProfiles([]);
                }}
                className="text-red-500 text-xs font-bold uppercase tracking-wider hover:underline"
              >
                Clear All Data
              </button>
            </header>

            {enrichedProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {enrichedProfiles.map((profile, idx) => (
                  <EnrichedProfileCard
                    key={idx}
                    profile={profile}
                    onClick={() => setSelectedEnrichedProfile(profile)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <Sparkles size={48} className="opacity-20" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tighter text-slate-900">No Analysis Data</h3>
                <p className="text-sm font-medium mt-1 max-w-xs text-center">Go to "Talent Pools (Saved)" and click "Analyze with AI" to enrich profiles.</p>
              </div>
            )}
          </div>
        )}

        <EnrichedProfileModal
          isOpen={!!selectedEnrichedProfile}
          onClose={() => setSelectedEnrichedProfile(null)}
          profile={selectedEnrichedProfile}
        />

        {/* Placeholder Views */}
        {
          (activeView === 'employees' || activeView === 'payroll' || activeView === 'settings') && (
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
          )
        }
      </main >

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
    </div >
  );
};

export default App;