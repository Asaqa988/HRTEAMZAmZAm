import React from 'react';
import { EnrichedProfile } from '../services/apifyService'; // Adjust import path as needed
import { MapPin, Briefcase, GraduationCap, Users } from 'lucide-react';

interface EnrichedProfileCardProps {
    profile: EnrichedProfile;
    onClick: () => void;
}

const EnrichedProfileCard: React.FC<EnrichedProfileCardProps> = ({ profile, onClick }) => {
    const currentRole = profile.experiences && profile.experiences.length > 0 ? profile.experiences[0] : null;
    const education = profile.educations && profile.educations.length > 0 ? profile.educations[0] : null;

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full"
        >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                    {profile.profilePic ? (
                        <img
                            src={profile.profilePic}
                            alt={profile.fullName}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-2xl border-2 border-white shadow-md">
                            {profile.fullName.charAt(0)}
                        </div>
                    )}
                    {/* Online/Active Indicator (Fake for now) */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {profile.fullName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium truncate mb-1">{profile.headline}</p>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <MapPin size={12} />
                        <span className="truncate">{profile.location}</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1.5 bg-slate-50 rounded-lg flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{profile.connections} <span className="font-normal text-slate-400">Conn</span></span>
                </div>
                <div className="px-3 py-1.5 bg-slate-50 rounded-lg flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{profile.followers} <span className="font-normal text-slate-400">Foll</span></span>
                </div>
            </div>

            <div className="space-y-3 flex-1">
                {/* Current Role */}
                <div className="flex gap-3 items-start">
                    <div className="mt-0.5 p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Briefcase size={14} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{currentRole?.title || 'No current role'}</p>
                        <p className="text-[10px] text-slate-500">{currentRole?.companyName}</p>
                    </div>
                </div>

                {/* Education */}
                <div className="flex gap-3 items-start">
                    <div className="mt-0.5 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <GraduationCap size={14} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{education?.title || 'No education listed'}</p>
                        <p className="text-[10px] text-slate-500">{education?.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Footer / Button */}
            <div className="mt-6 pt-4 border-t border-slate-100">
                <button className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-600 hover:text-white transition-colors uppercase tracking-wider">
                    View Full Analysis
                </button>
            </div>
        </div>
    );
};

export default EnrichedProfileCard;
