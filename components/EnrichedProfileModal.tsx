import React from 'react';
import { EnrichedProfile } from '../services/apifyService';
import { X, MapPin, Building, Calendar, GraduationCap, Award, Globe, Mail, Phone, ExternalLink, Briefcase } from 'lucide-react';

interface EnrichedProfileModalProps {
    profile: EnrichedProfile | null;
    isOpen: boolean;
    onClose: () => void;
}

const EnrichedProfileModal: React.FC<EnrichedProfileModalProps> = ({ profile, isOpen, onClose }) => {
    if (!isOpen || !profile) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header / Cover */}
                <div className="h-32 bg-gradient-to-r from-indigo-900 to-slate-900 relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-8 pb-8">
                        {/* Profile Header Info */}
                        <div className="relative -mt-12 mb-6 flex justify-between items-end">
                            <div className="flex items-end gap-6">
                                <div className="relative">
                                    {profile.profilePic ? (
                                        <img
                                            src={profile.profilePic}
                                            alt={profile.fullName}
                                            className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-4xl border-4 border-white shadow-lg">
                                            {profile.fullName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="pb-2">
                                    <h2 className="text-3xl font-black text-slate-900">{profile.fullName}</h2>
                                    <p className="text-lg text-slate-600 font-medium">{profile.headline}</p>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>
                                        <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline font-bold">
                                            <ExternalLink size={14} /> LinkedIn Profile
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Content (Left 2 cols) */}
                            <div className="lg:col-span-2 space-y-8">

                                {/* About */}
                                {profile.about && (
                                    <section>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">About</h3>
                                        <div className="bg-slate-50 p-6 rounded-3xl text-slate-700 leading-relaxed whitespace-pre-line text-sm border border-slate-100">
                                            {profile.about}
                                        </div>
                                    </section>
                                )}

                                {/* Experience */}
                                <section>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                        <Briefcase size={16} /> Experience
                                    </h3>
                                    <div className="space-y-4">
                                        {profile.experiences.map((exp, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-indigo-200 transition-colors group">
                                                <div className="flex items-start gap-4">
                                                    {exp.logo ? (
                                                        <img src={exp.logo} alt={exp.companyName} className="w-12 h-12 rounded-xl object-contain border border-slate-100" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <Building size={20} />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-lg text-slate-900">{exp.title}</h4>
                                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                            <span>{exp.companyName}</span>
                                                            {exp.employmentType && <span className="text-slate-400">• {exp.employmentType}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 mb-3">
                                                            {exp.jobStartedOn && (
                                                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                                                    <Calendar size={12} /> {exp.jobStartedOn} - {exp.jobStillWorking ? 'Present' : exp.jobEndedOn}
                                                                </span>
                                                            )}
                                                            {exp.jobLocation && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin size={12} /> {exp.jobLocation}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Expanded Details */}
                                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                                            {exp.companyIndustry && (
                                                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded w-fit">
                                                                    {exp.companyIndustry}
                                                                </span>
                                                            )}
                                                            {exp.companySize && (
                                                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded w-fit">
                                                                    {exp.companySize} Employees
                                                                </span>
                                                            )}
                                                        </div>

                                                        {exp.jobDescription && (
                                                            <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-indigo-100 pl-4 mt-2">
                                                                {exp.jobDescription}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {profile.experiences.length === 0 && <p className="text-slate-400 italic">No experience listed.</p>}
                                    </div>
                                </section>

                                {/* Education */}
                                <section>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                        <GraduationCap size={16} /> Education
                                    </h3>
                                    <div className="space-y-3">
                                        {profile.educations.map((edu, idx) => (
                                            <div key={idx} className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <GraduationCap size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{edu.title}</h4>
                                                    <p className="text-sm text-slate-600">{edu.subtitle}</p>
                                                    {edu.period && (
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {edu.period.startedOn?.year} - {edu.period.endedOn?.year}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Sidebar Info (Right col) */}
                            <div className="space-y-8">
                                {/* Contact Info */}
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Contact Info</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <Mail size={14} />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                                <p className="text-sm font-medium text-slate-900 truncate" title={profile.email || ''}>{profile.email || 'Not available'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                <Phone size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Mobile</p>
                                                <p className="text-sm font-medium text-slate-900">{profile.mobileNumber || 'Not available'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills */}
                                {profile.skills.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                            <Award size={14} /> Skills
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.map((skill, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm">
                                                    {skill.title}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Languages */}
                                {profile.languages.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                                            <Globe size={14} /> Languages
                                        </h3>
                                        <div className="space-y-2">
                                            {profile.languages.map((lang, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                                    <span className="font-bold text-slate-700">{lang.name}</span>
                                                    <span className="text-slate-500 text-xs">{lang.proficiency}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnrichedProfileModal;
