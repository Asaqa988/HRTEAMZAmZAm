import React, { useState, useEffect } from 'react';
import { LinkedInProfile, CandidateInsight, SearchParams } from '../types';
import { analyzeCandidate } from '../services/geminiService';
import { Sparkles, CheckCircle2, AlertCircle, Copy, Send, Loader2, RefreshCw, AlertTriangle, Globe, UserCheck, Briefcase } from 'lucide-react';

interface InsightsPanelProps {
  selectedProfile: LinkedInProfile | null;
  targetRole: string;
  searchParams?: SearchParams;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ selectedProfile, targetRole, searchParams }) => {
  const [insight, setInsight] = useState<CandidateInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProfile) {
      handleAnalyze();
    } else {
      setInsight(null);
      setError(null);
    }
  }, [selectedProfile]);

  const handleAnalyze = async () => {
    if (!selectedProfile) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCandidate(selectedProfile, targetRole, searchParams);
      setInsight(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze candidate.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (insight?.outreachDraft) {
      navigator.clipboard.writeText(insight.outreachDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!selectedProfile) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Sparkles size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">Select a candidate to view AI insights</p>
        <p className="text-sm">Gemini will analyze their profile against your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={20} />
          AI Analysis
        </h2>
        <div className="flex gap-2">
          {error && (
            <button onClick={handleAnalyze} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <RefreshCw size={16} />
            </button>
          )}
          {loading && <Loader2 className="animate-spin text-indigo-500" size={20} />}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-slate-100 rounded-xl"></div>
          <div className="h-40 bg-slate-100 rounded-xl"></div>
          <div className="h-32 bg-slate-100 rounded-xl"></div>
        </div>
      ) : error ? (
        <div className="p-6 text-center space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <AlertCircle className="mx-auto text-amber-500 mb-2" size={24} />
            <p className="text-sm font-bold text-amber-800">{error}</p>
          </div>
          <button
            onClick={handleAnalyze}
            className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
          >
            Retry Analysis
          </button>
        </div>
      ) : insight ? (
        <>
          {/* Match Score & Availability */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Match Score</span>
                <span className={`text-lg font-black ${insight.matchScore > 80 ? 'text-green-600' : insight.matchScore > 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {insight.matchScore}%
                </span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-1000 ${insight.matchScore > 80 ? 'bg-green-500' : insight.matchScore > 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${insight.matchScore}%` }}
                ></div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Availability</span>
                <span className={`text-lg font-black ${insight.availabilityScore > 70 ? 'text-green-600' : 'text-slate-600'}`}>
                  {insight.availabilityScore}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-1000 ${insight.availabilityScore > 70 ? 'bg-green-500' : 'bg-slate-400'}`}
                  style={{ width: `${insight.availabilityScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
              <div className="bg-white p-2 rounded-md shadow-sm text-indigo-600"><Globe size={16} /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Flexibility</p>
                <p className="text-sm font-bold text-slate-800">{insight.geographicFlexibility || 'N/A'}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
              <div className="bg-white p-2 rounded-md shadow-sm text-indigo-600"><Briefcase size={16} /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Est. Level</p>
                <p className="text-sm font-bold text-slate-800">{insight.currentLevel || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Red Flags */}
          {insight.redFlags && insight.redFlags.length > 0 && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <h3 className="font-bold text-red-800 flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
                <AlertTriangle size={14} /> Potential Concerns
              </h3>
              <ul className="space-y-1">
                {insight.redFlags.map((flag, i) => (
                  <li key={i} className="text-xs text-red-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-red-400">
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} className="text-green-500" /> Key Strengths
            </h3>
            <ul className="space-y-1">
              {insight.pros.map((pro, i) => (
                <li key={i} className="text-sm text-slate-600 pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-indigo-400">
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
              <AlertCircle size={16} className="text-amber-500" /> Gap Analysis
            </h3>
            <ul className="space-y-1">
              {insight.cons.map((con, i) => (
                <li key={i} className="text-sm text-slate-600 pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-slate-300">
                  {con}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Send size={16} className="text-indigo-500" /> Outreach Strategy
              </h3>
              <button
                onClick={handleCopy}
                className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 bg-slate-50 px-2 py-1 rounded border border-slate-200"
              >
                {copied ? 'Copied!' : <><Copy size={12} /> Copy Draft</>}
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 leading-relaxed border border-slate-200 whitespace-pre-wrap italic">
              "{insight.outreachDraft}"
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">Analysis currently unavailable.</p>
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;
