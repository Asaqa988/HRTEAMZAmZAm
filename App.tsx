import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  CreditCard,
  Filter,
  MoreVertical,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  Mail,
  Linkedin,
  Globe,
  Star,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  HelpCircle,
  Languages,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Trash2,
  Pencil,
  RotateCcw,
  LogOut,
  Settings,
  User,
  MapPin,
  RefreshCw,
  Target,
  CheckSquare,
  Briefcase,
  ExternalLink,
  MapPin as Pin,
  Loader2,
  Sparkles,
  Heart,
  MessageSquare,
  Bot,
  Send,
  Plus as PlusIcon,
  Lock
} from 'lucide-react';
import { LinkedInProfile, SearchParams, ChatMessage, SavedSearch, EnrichedProfile } from './types';
import { startScrapingRun, pollRunStatus, getRunResults, getMockProfiles, enrichProfiles } from './services/apifyService';
import { generateResume, generateJobOffer, chatWithAI } from './services/geminiService';
import ProfileCard from './components/ProfileCard';
import InsightsPanel from './components/InsightsPanel';
import ResumeModal from './components/ResumeModal';
import JobOfferModal from './components/JobOfferModal';
import CVParserView from './components/CVParserView';
import InterviewQuestionsView from './components/InterviewQuestionsView';
import KPIManagement from './components/KPIManagement';
import EnrichedProfileCard from './components/EnrichedProfileCard';
import EnrichedProfileModal from './components/EnrichedProfileModal';

type View = 'dashboard' | 'find-candidate' | 'employees' | 'payroll' | 'settings' | 'cv-parser' | 'interview-questions' | 'kpi-management' | 'talent-pools' | 'ai-analysis' | 'liked-candidates' | 'ai-chatbot';

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
  const [isPoolSelectionOpen, setIsPoolSelectionOpen] = useState(false);

  // Liked Candidates State (Persisted)
  const [likedProfiles, setLikedProfiles] = useState<LinkedInProfile[]>(() => {
    const saved = localStorage.getItem('zamzam_liked_profiles');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse liked profiles", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('zamzam_liked_profiles', JSON.stringify(likedProfiles));
  }, [likedProfiles]);

  const handleToggleLike = (profile: LinkedInProfile) => {
    setLikedProfiles(prev => {
      const isLiked = prev.some(p => p.id === profile.id);
      if (isLiked) {
        return prev.filter(p => p.id !== profile.id);
      } else {
        return [profile, ...prev];
      }
    });
  };

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

    handleOpenConfirm(
      "Confirm AI Enrichment",
      `This will use AI tokens to enrich ${newProfiles.length} new profiles.This process may take a minute.Do you want to continue?`,
      async () => {
        setIsEnriching(true);
        setActiveView('ai-analysis');
        setStatus(`Enriching ${newProfiles.length} profiles...`);
        try {
          const urls = newProfiles.map(p => p.profileUrl).filter(Boolean) as string[];
          const newEnrichedData = await enrichProfiles(urls);
          setEnrichedProfiles(prev => [...newEnrichedData, ...prev]);
          setStatus('');
        } catch (err: any) {
          setError(err.message || "Enrichment failed.");
        } finally {
          setIsEnriching(false);
          setIsConfirmModalOpen(false);
        }
      },
      'primary',
      'Start Enrichment'
    );
  };

  // Search State with Advanced Fields (Lazy Init from LocalStorage)
  const [params, setParams] = useState<SearchParams>(() => {
    const saved = localStorage.getItem('zamzam_current_params');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean up legacy defaults if they sneak in from old localStorage
      if (parsed.skills?.mandatory?.includes('Recruitment') && parsed.skills?.mandatory?.includes('Negotiation')) {
        parsed.skills.mandatory = [];
      }
      return parsed;
    }
    return {
      title: 'HR',
      location: 'Jordan',
      yearsOfExperience: '5-10',
      limit: 50,
      actorId: 'demo-actor',
      positionLevel: 'Manager',
      targetIndustry: 'Banking',
      coreFunction: 'HR',
      subSpecialization: 'Talent Acquisition',
      skills: {
        mandatory: [],
        preferred: [],
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
      currentEmployer: '',
      smartExpansion: true,
      excludeSeniors: false
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

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('zamzam_chat_messages');
    return saved ? JSON.parse(saved) : [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm the **Zamzam Brain**. I have access to your saved pools and enriched profiles. How can I help you today?",
        timestamp: new Date()
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);

  // Naming Modal State
  const [isNamingModalOpen, setIsNamingModalOpen] = useState(false);
  const [namingModalData, setNamingModalData] = useState<{ mode: 'create' | 'rename', id?: string, currentName: string }>({
    mode: 'create',
    currentName: ''
  });

  const handleOpenNamingModal = (mode: 'create' | 'rename', id?: string, currentName?: string) => {
    setNamingModalData({ mode, id, currentName: currentName || '' });
    setIsNamingModalOpen(true);
  };

  const handleSavePool = (name: string) => {
    if (namingModalData.mode === 'create') {
      const newId = Date.now().toString();
      setSavedSearches(prev => [
        ...prev,
        { id: newId, title: name, profiles: [...results] }
      ]);
      setActiveTab(newId);
    } else if (namingModalData.mode === 'rename' && namingModalData.id) {
      setSavedSearches(prev => prev.map(pool =>
        pool.id === namingModalData.id ? { ...pool, title: name } : pool
      ));
    }
    setIsNamingModalOpen(false);
  };

  // Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    variant: 'danger' | 'primary';
  }>({
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => { },
    variant: 'primary'
  });

  const handleOpenConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'danger' | 'primary' = 'primary',
    confirmText: string = 'Confirm'
  ) => {
    setConfirmModalData({ title, message, onConfirm, variant, confirmText });
    setIsConfirmModalOpen(true);
  };

  useEffect(() => {
    localStorage.setItem('zamzam_chat_messages', JSON.stringify(chatMessages));
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);


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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Build context from pools and enriched data
      const fullContext = (savedSearches || []).map(pool => {
        const candidateDetails = (pool?.profiles || []).map(p => {
          const profileLink = p?.profileUrl || p?.id || 'Unknown URL';
          // Match with enriched data if available
          const enriched = (enrichedProfiles || []).find(ep => ep?.linkedinUrl === profileLink);
          if (enriched) {
            const skillsStr = (enriched.skills || []).map((s: any) => s?.title || 'Unknown Skill').slice(0, 10).join(', ');
            return `- ${p?.fullName || 'Unknown'} (${p?.title || 'No Title'}) | URL: ${profileLink} | [ENRICHED] ${enriched.about?.substring(0, 150) || 'No summary'}... | Skills: ${skillsStr} `;
          }
          return `- ${p?.fullName || 'Unknown'} (${p?.title || 'No Title'}) | URL: ${profileLink} `;
        }).join('\n');

        return `POOL: ${pool?.title || 'Unnamed Pool'} (${pool?.profiles?.length || 0} candidates) \n${candidateDetails} `;
      }).join('\n\n---\n\n');

      // Add standalone enriched profiles context (top 20 for brevity)
      const standaloneEnriched = (enrichedProfiles || [])
        .slice(0, 20)
        .map(p => `ENRICHED PROFILE: ${p?.fullName || 'Unknown'} (${p?.headline || 'No Headline'}) | URL: ${p?.linkedinUrl} | Summary: ${p?.about?.substring(0, 150)}...`)
        .join('\n');

      const finalContextString = `
      TALENT POOLS AND CANDIDATES:
      ${fullContext}

      DETAILED ENRICHED PROFILES(FALLBACK):
      ${standaloneEnriched}
`;

      const aiResponse = await chatWithAI(
        chatMessages.concat(userMessage).map(m => ({ role: m.role, content: m.content })),
        finalContextString
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "Something went wrong in the chat.");
    } finally {
      setIsChatLoading(false);
    }
  };




  const generateXRayUrl = () => {
    const countryMatch = params.location.match(/\b(Jordan|UAE|Egypt|USA|UK)\b/i);
    const countryCodeMap: any = { 'jordan': 'jo', 'uae': 'ae', 'egypt': 'eg', 'usa': 'us', 'uk': 'gb' };
    const countryCode = countryMatch ? countryCodeMap[countryMatch[0].toLowerCase()] : null;

    const TITLE_EXPANSIONS: Record<string, string[]> = {
      'finance manager': ['Finance Manager', 'Finance Lead', 'Finance Supervisor', 'Head of Finance'],
      'software quality assurance': ['QA Engineer', 'Quality Assurance Engineer', 'Software Tester', 'Test Automation Engineer'],
      'qa engineer': ['QA Engineer', 'Quality Assurance Engineer', 'Software Tester', 'Test Automation Engineer'],
      'recruiter': ['Recruiter', 'Talent Acquisition', 'Headhunter', 'Technical Recruiter'],
      'software engineer': ['Software Engineer', 'Software Developer', 'Full Stack Developer', 'Backend Engineer'],
      'marketing manager': ['Marketing Manager', 'Marketing Lead', 'Growth Manager', 'Digital Marketing Manager'],
      'project manager': ['Project Manager', 'Program Manager', 'Delivery Manager']
    };

    // Dynamic Title Expansion
    let expandedTitle = `"${params.title}"`;
    if (params.smartExpansion) {
      const key = params.title.toLowerCase().trim();
      if (TITLE_EXPANSIONS[key]) {
        expandedTitle = `(${TITLE_EXPANSIONS[key].map(t => `"${t}"`).join(" OR ")})`;
      }
    }

    // Dynamic Location Expansion
    let expandedLocation = `"${params.location}"`;
    if (params.location.includes(" ")) {
      const parts = params.location.split(" ").map(p => `"${p.trim()}"`);
      if (parts.length >= 2) {
        expandedLocation = `(${parts.join(" OR ")})`;
      }
    }

    const keywords = [
      `+ ${expandedTitle} `,
      `+ ${expandedLocation} `,
      params.keywordsIncludes ? `+ "${params.keywordsIncludes}"` : "",
      params.education ? `"${params.education}"` : "",
      params.currentEmployer ? `("${params.currentEmployer}")` : "",
      params.skills?.mandatory?.map(s => `+ "${s}"`).join(" "),
      `- intitle: "profiles" - inurl: "dir/"`,
      params.excludeSeniors ? `- "senior" - "lead" - "manager" - "director" - "head"` : "",
      params.keywordsExcludes
        ? params.keywordsExcludes.split(/OR|,/).map(k => `- "${k.trim()}"`).join(" ")
        : ""
    ].filter(Boolean).join(" ");

    const siteOperator = countryCode
      ? `site:${countryCode}.linkedin.com /in / OR site:${countryCode}.linkedin.com/pub / `
      : `site: linkedin.com /in / OR site:linkedin.com/pub / `;

    const fullQuery = `${keywords} ${siteOperator} `;
    return `https://www.google.com/search?q=${encodeURIComponent(fullQuery)}`;
  };

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
          <SidebarItem icon={Heart} label="Liked Candidates" view="liked-candidates" active={activeView === 'liked-candidates'} />
          <SidebarItem
            icon={isEnriching ? Loader2 : Sparkles}
            label={isEnriching ? "Enriching..." : "AI Analysis (Enriched)"}
            view="ai-analysis"
            active={activeView === 'ai-analysis'}
          />
          <SidebarItem icon={MessageSquare} label="AI Chatbot" view="ai-chatbot" active={activeView === 'ai-chatbot'} />
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
          <div className="flex-1 flex overflow-hidden animate-in slide-in-from-right-8 duration-500 bg-slate-50/50">
            {/* STAGE 1: Hero Search (No results yet) */}
            {activeTab === 'current' && results.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-white p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

                  <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-8 animate-bounce-subtle">
                    <Search size={48} className="text-indigo-600" />
                  </div>

                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Start Your Talent Discovery</h1>
                  <p className="text-lg text-slate-500 font-medium mb-12 max-w-2xl mx-auto">
                    Configure your search parameters below and let our AI-powered engine extract the most relevant profiles from global networks.
                  </p>

                  <form onSubmit={handleSearch} className="max-w-3xl mx-auto space-y-8 text-left">
                    <div className="grid grid-cols-2 gap-8 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                      {/* Location */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                          <input
                            type="text"
                            value={params.location}
                            onChange={e => setParams({ ...params, location: e.target.value })}
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-base font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                            placeholder="e.g. Amman, Jordan"
                          />
                        </div>
                      </div>

                      {/* Job Title */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Job Title / Role</label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                          <input
                            type="text"
                            value={params.title}
                            onChange={e => setParams({ ...params, title: e.target.value })}
                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-base font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                            placeholder="e.g. Software Engineer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 transition-all hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={params.smartExpansion}
                          onChange={(e) => setParams(prev => ({ ...prev, smartExpansion: e.target.checked }))}
                          className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Smart AI Expansion</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:border-red-300 transition-all hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={params.excludeSeniors}
                          onChange={(e) => setParams(prev => ({ ...prev, excludeSeniors: e.target.checked }))}
                          className="w-5 h-5 rounded-lg border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Exclude Seniors</span>
                      </label>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 rounded-[2rem] font-black text-base uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" size={24} />
                            Initializing Engine...
                          </>
                        ) : (
                          <>
                            <Zap size={24} />
                            Initiate Talent Discovery
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              /* STAGE 2: Results Active with Wider Sidebar */
              <>
                <aside className="w-[420px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar shadow-xl shadow-slate-200/50 z-10 shrink-0">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Advanced Controls</h2>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Refine Results</h3>
                      </div>
                      <button
                        onClick={() => {
                          localStorage.removeItem('zamzam_current_params');
                          window.location.reload();
                        }}
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        title="Reset Search"
                      >
                        <RefreshCw size={20} />
                      </button>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-10">
                      {/* Section 1: Core Target */}
                      <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 space-y-6">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          <Target size={14} className="text-indigo-500" /> Core Target
                        </h4>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 block mb-2 uppercase tracking-widest ml-1">Location</label>
                            <input
                              type="text"
                              value={params.location}
                              onChange={e => setParams({ ...params, location: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-500 block mb-2 uppercase tracking-widest ml-1">Role / Job Title</label>
                            <input
                              type="text"
                              value={params.title}
                              onChange={e => setParams({ ...params, title: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Requirements */}
                      <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 space-y-6">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          <CheckSquare size={14} className="text-purple-500" /> Requirements
                        </h4>

                        <div className="space-y-5">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 block mb-2 uppercase tracking-widest ml-1">Mandatory Keywords (OR)</label>
                            <input
                              type="text"
                              value={params.keywordsIncludes || ''}
                              onChange={e => setParams({ ...params, keywordsIncludes: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                              placeholder="e.g. Node.js OR Go"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-500 block mb-2 uppercase tracking-widest ml-1">Min. Exp</label>
                              <select
                                value={params.yearsOfExperience}
                                onChange={e => setParams({ ...params, yearsOfExperience: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm appearance-none"
                              >
                                <option value="0-1">0-1 yrs</option>
                                <option value="1-3">1-3 yrs</option>
                                <option value="3-5">3-5 yrs</option>
                                <option value="5-10">5-10 yrs</option>
                                <option value="10+">10+ yrs</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-500 block mb-2 uppercase tracking-widest ml-1">Target Level</label>
                              <select
                                value={params.positionLevel}
                                onChange={e => setParams({ ...params, positionLevel: e.target.value as any })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm appearance-none"
                              >
                                <option value="Manager">Manager</option>
                                <option value="Head">Head</option>
                                <option value="Director">Director</option>
                                <option value="VP">VP</option>
                                <option value="C-Level">C-Level</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Smart Engine */}
                      <div className="bg-indigo-900 rounded-[2.5rem] p-8 space-y-6 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={params.smartExpansion}
                                onChange={(e) => setParams(prev => ({ ...prev, smartExpansion: e.target.checked }))}
                                className="peer sr-only"
                              />
                              <div className="w-10 h-5 bg-indigo-950/50 rounded-full peer peer-checked:bg-white transition-colors border border-white/20"></div>
                              <div className="absolute top-1 left-1 w-3 h-3 bg-white/40 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-indigo-600"></div>
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Smart AI Expansion</span>
                          </label>
                        </div>

                        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                          <p className="text-[10px] text-indigo-200 font-mono break-all line-clamp-3 leading-relaxed">
                            {decodeURIComponent(generateXRayUrl().split('q=')[1])}
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-white text-indigo-900 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-98 transition-all shadow-lg shadow-black/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                          {loading ? 'Processing...' : 'Sync with AI'}
                        </button>
                      </div>

                      <div className="flex gap-4 px-2">
                        <button
                          type="button"
                          onClick={() => window.open(generateXRayUrl(), '_blank')}
                          className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={14} /> Open Manual View
                        </button>
                      </div>
                    </form>
                  </div>
                </aside>

                {/* Results Feed Area */}
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
                      <button
                        onClick={() => setActiveTab('liked')}
                        className={`pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'liked'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        Liked Candidates
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{likedProfiles.length}</span>
                      </button>

                      {savedSearches.map(pool => (
                        <button
                          key={pool.id}
                          onClick={() => setActiveTab(pool.id)}
                          className={`pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === pool.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                          {pool.title}
                          <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{pool.profiles.length}</span>
                        </button>
                      ))}
                    </div>

                    <div className="pb-2 flex items-center gap-2">
                      {activeTab === 'current' && results.length > 0 && (
                        <button
                          onClick={() => handleOpenNamingModal('create', undefined, params.title)}
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
                        {activeTab === 'current' ? 'Global Talent Cloud' : activeTab === 'liked' ? 'Your Favorites' : 'Saved Talent Pool'}
                      </p>
                    </div>
                  </div>

                  {/* Feed Content */}
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
                    ) : (activeTab === 'current' ? results : activeTab === 'liked' ? likedProfiles : savedSearches.find(s => s.id === activeTab)?.profiles || []).length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {(activeTab === 'current' ? results : activeTab === 'liked' ? likedProfiles : savedSearches.find(s => s.id === activeTab)?.profiles || []).map(profile => (
                          <ProfileCard
                            key={profile.id}
                            profile={profile}
                            isSelected={selectedProfile?.id === profile.id}
                            isLiked={likedProfiles.some(p => p.id === profile.id)}
                            onSelect={setSelectedProfile}
                            onFetchCV={handleFetchCV}
                            onSendOffer={handleSendOffer}
                            onToggleLike={handleToggleLike}
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

                {/* Insight Panel (Selected Profile) */}
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
              </>
            )}
          </div>
        )}

        {/* Liked Candidates View */}
        {
          activeView === 'liked-candidates' && (
            <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">Liked Candidates</h2>
                  <p className="text-slate-500 font-medium">Your personal favorites and top-tier talent picks.</p>
                </div>
                <button
                  onClick={() => setActiveView('find-candidate')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  <Search size={16} /> Find More
                </button>
              </header>

              {likedProfiles.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {likedProfiles.map(profile => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      isSelected={selectedProfile?.id === profile.id}
                      isLiked={true}
                      onSelect={setSelectedProfile}
                      onFetchCV={handleFetchCV}
                      onSendOffer={handleSendOffer}
                      onToggleLike={handleToggleLike}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <div className="bg-slate-50 p-6 rounded-full mb-6">
                    <Heart size={48} className="opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tighter text-slate-900">No Liked Candidates</h3>
                  <p className="text-sm font-medium mt-1 max-w-xs text-center">Heart your favorite candidates to see them here.</p>
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
        {/* Talent Pools View */}
        {
          activeView === 'talent-pools' && (
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
                    onClick={() => setIsPoolSelectionOpen(true)}
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenNamingModal('rename', pool.id, pool.title);
                              }}
                              className="p-1 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded transition-colors"
                              title="Rename Pool"
                            >
                              <Pencil size={14} />
                            </button>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                              {pool.profiles.length} Candidates
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenConfirm(
                                  "Delete Talent Pool",
                                  `Are you sure you want to delete "${pool.title}"? This action cannot be undone.`,
                                  () => {
                                    setSavedSearches(prev => prev.filter(p => p.id !== pool.id));
                                    setIsConfirmModalOpen(false);
                                  },
                                  'danger',
                                  'Delete Pool'
                                );
                              }}
                              className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors"
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
          )
        }
        {activeView === 'cv-parser' && <CVParserView />}

        {/* Interview Questions View */}
        {activeView === 'interview-questions' && <InterviewQuestionsView />}

        {/* KPI Management View */}
        {activeView === 'kpi-management' && <KPIManagement />}

        {/* AI Analysis View */}
        {
          activeView === 'ai-analysis' && (
            <div className="p-8 max-w-full mx-auto w-full space-y-8 animate-in fade-in duration-500">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">AI Analysis</h2>
                  <p className="text-slate-500 font-medium">Deep insights from enriched LinkedIn profiles (Powered by Apify & Gemini).</p>
                </div>
                <button
                  onClick={() => {
                    handleOpenConfirm(
                      "Clear Enriched Data",
                      "Are you sure you want to delete all enriched candidate data? This cannot be undone.",
                      () => {
                        setEnrichedProfiles([]);
                        setIsConfirmModalOpen(false);
                      },
                      'danger',
                      'Clear All'
                    );
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-all"
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
              ) : status ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-pulse">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                    <Loader2 className="animate-spin text-indigo-600 mb-6 relative" size={48} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">{status}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Integrating LinkedIn & Gemini Intelligence</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-4 max-w-xs mx-auto">This may take a few minutes depending on the pool size. Please do not close the portal.</p>
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
          )
        }

        {/* AI Chatbot View */}
        {
          activeView === 'ai-chatbot' && (
            <div className="h-full flex flex-col p-8 max-w-full mx-auto w-full space-y-8 animate-in fade-in duration-500 overflow-hidden">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">AI Chatbot</h2>
                  <p className="text-slate-500 font-medium">Interact with your global talent pool using advanced LLM reasoning.</p>
                </div>
                <button
                  onClick={() => {
                    handleOpenConfirm(
                      "Clear Chat History",
                      "Do you want to delete all messages in this conversation?",
                      () => {
                        setChatMessages([]);
                        setIsConfirmModalOpen(false);
                      },
                      'danger',
                      'Clear History'
                    );
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  Clear History
                </button>
              </header>

              <div className="flex-1 min-h-0 bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden relative">
                {/* Chat Messages */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar"
                >
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-3 rounded-2xl shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-purple-100 text-purple-700'
                          }`}>
                          {msg.role === 'user' ? <Users size={20} /> : <Bot size={20} />}
                        </div>
                        <div className={`p-6 rounded-[2rem] shadow-lg ${msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-purple-600 text-white rounded-tl-none border border-purple-500 shadow-purple-100'
                          }`}>
                          <div className={`prose prose-sm max-w-none text-white`}>
                            {msg.content.split('\n').map((line, i) => {
                              const trimmed = line.trim();
                              if (!trimmed) return <div key={i} className="h-2" />;

                              // Simple Headings
                              if (trimmed.startsWith('###')) {
                                return (
                                  <h3 key={i} className="text-lg font-black mt-4 mb-2 first:mt-0 text-white uppercase tracking-tight">
                                    {trimmed.replace(/^###\s*/, '')}
                                  </h3>
                                );
                              }

                              // Bold & Text Processing
                              const processText = (text: string) => {
                                const parts = text.split(/(\*\*.*?\*\*)/);
                                return parts.map((part, index) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={index} className="text-white font-black">{part.slice(2, -2)}</strong>;
                                  }
                                  return part;
                                });
                              };

                              // Bullet Points
                              if (trimmed.startsWith('-')) {
                                return (
                                  <div key={i} className="flex gap-2 items-start ml-1 mb-1">
                                    <span className="text-purple-200 mt-1.5">•</span>
                                    <span className="text-white">{processText(trimmed.replace(/^-\s*/, ''))}</span>
                                  </div>
                                );
                              }

                              return (
                                <p key={i} className="leading-relaxed mb-2 last:mb-0 text-white/95">
                                  {processText(trimmed)}
                                </p>
                              );
                            })}
                          </div>
                          <p className={`text-[10px] mt-3 font-bold uppercase tracking-widest opacity-60 ${msg.role === 'user' ? 'text-right' : ''}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] flex items-start gap-4">
                        <div className="p-3 rounded-2xl shrink-0 bg-slate-100 text-indigo-600 animate-pulse">
                          <Bot size={20} />
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] rounded-tl-none border border-slate-100 flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-8 bg-slate-50 border-t border-slate-100">
                  <form
                    onSubmit={handleSendMessage}
                    className="max-w-4xl mx-auto relative group"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask the Zamzam Brain about your candidates..."
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 pr-32 text-slate-900 font-medium shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isChatLoading}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 active:scale-95"
                      >
                        <Send size={24} />
                      </button>
                    </div>
                  </form>
                  <div className="mt-4 flex items-center justify-center gap-6 overflow-x-auto py-2 no-scrollbar">
                    <button
                      onClick={() => setChatInput("Rank candidates for HR Manager role")}
                      className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white border border-indigo-100 px-4 py-2 rounded-full hover:bg-indigo-50 transition-all shadow-sm"
                    >
                      <Zap size={10} className="inline mr-1" /> Rank Candidates
                    </button>
                    <button
                      onClick={() => setChatInput("Who has the most years of experience?")}
                      className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white border border-indigo-100 px-4 py-2 rounded-full hover:bg-indigo-50 transition-all shadow-sm"
                    >
                      <Zap size={10} className="inline mr-1" /> Compare Experience
                    </button>
                    <button
                      onClick={() => setChatInput("Summarize my talent pools")}
                      className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white border border-indigo-100 px-4 py-2 rounded-full hover:bg-indigo-50 transition-all shadow-sm"
                    >
                      <Zap size={10} className="inline mr-1" /> Pool Summary
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

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

      {/* Pool Selection Modal */}
      {
        isPoolSelectionOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Select Pool to Analyze</h3>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Cost Optimization Engine</p>
                </div>
                <button onClick={() => setIsPoolSelectionOpen(false)} className="p-3 bg-white hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                  Choose a specific talent pool to enrich with AI analysis. This prevents unnecessary token usage by only processing selected candidates.
                </p>

                <div className="space-y-3">
                  {savedSearches.length > 0 ? (
                    savedSearches.map(pool => (
                      <button
                        key={pool.id}
                        onClick={() => {
                          setIsPoolSelectionOpen(false);
                          handleEnrichProfiles(pool.profiles);
                        }}
                        className="w-full text-left p-5 rounded-3xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-100 p-3 rounded-2xl text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{pool.title}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pool.profiles.length} Candidates</p>
                          </div>
                        </div>
                        <ArrowUpRight size={18} className="text-slate-300 group-hover:text-indigo-600" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-slate-400 font-bold mb-2">No Saved Pools Found</p>
                      <button
                        onClick={() => setIsPoolSelectionOpen(false)}
                        className="text-indigo-600 font-bold text-sm hover:underline"
                      >
                        Go back to search
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => setIsPoolSelectionOpen(false)}
                  className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Cancel Selection
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Talent Pool Naming Modal */}
      {
        isNamingModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {namingModalData.mode === 'create' ? 'Name Talent Pool' : 'Rename Talent Pool'}
                  </h3>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Organize Your Pipeline</p>
                </div>
                <button onClick={() => setIsNamingModalOpen(false)} className="p-3 bg-white hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">Pool Name</label>
                <input
                  autoFocus
                  type="text"
                  defaultValue={namingModalData.currentName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSavePool((e.target as HTMLInputElement).value);
                    }
                  }}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Senior QA Amman"
                  id="naming-pool-input"
                />
                <p className="text-[10px] text-slate-400 font-medium mt-3">Press Enter to save changes</p>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsNamingModalOpen(false)}
                  className="flex-1 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById('naming-pool-input') as HTMLInputElement;
                    handleSavePool(input.value);
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Confirmation Modal */}
      {
        isConfirmModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
              <div className="p-8 text-center">
                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${confirmModalData.variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                  {confirmModalData.variant === 'danger' ? <X size={32} /> : <Zap size={32} />}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">{confirmModalData.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                  {confirmModalData.message}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmModalData.onConfirm}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${confirmModalData.variant === 'danger'
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                      }`}
                  >
                    {confirmModalData.confirmText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default App;