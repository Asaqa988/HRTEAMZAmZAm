
import React from 'react';
import { LinkedInProfile } from '../types';
import { ExternalLink, MapPin, Briefcase, Star, FileText, Send } from 'lucide-react';

interface ProfileCardProps {
  profile: LinkedInProfile;
  isSelected: boolean;
  onSelect: (profile: LinkedInProfile) => void;
  onFetchCV: (profile: LinkedInProfile) => void;
  onSendOffer: (profile: LinkedInProfile) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, isSelected, onSelect, onFetchCV, onSendOffer }) => {
  return (
    <div 
      onClick={() => onSelect(profile)}
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex gap-4">
        <img 
          src={profile.profilePicUrl} 
          alt={profile.fullName} 
          className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://picsum.photos/200";
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-slate-900 truncate">{profile.fullName}</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFetchCV(profile);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group"
                title="Fetch CV"
              >
                <FileText size={16} />
              </button>
              <a 
                href={profile.profileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium truncate">{profile.title}</p>
          
          <div className="mt-2 flex flex-wrap gap-y-1 gap-x-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <MapPin size={12} className="text-slate-400" /> {profile.location}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Briefcase size={12} className="text-slate-400" /> {profile.company}
            </span>
            {profile.yearsOfExperience !== undefined && (
               <span className="flex items-center gap-1 font-bold">
                <Star size={12} className="text-amber-500 fill-amber-500" /> {profile.yearsOfExperience}y Exp
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex flex-wrap gap-1">
          {profile.skills && profile.skills.length > 0 && profile.skills.slice(0, 2).map((skill, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
              {skill}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button 
             onClick={(e) => {
              e.stopPropagation();
              onFetchCV(profile);
            }}
            className="text-[10px] font-black text-slate-500 hover:text-slate-900 flex items-center gap-1.5 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg transition-all"
          >
            <FileText size={12} /> CV
          </button>
          <button 
             onClick={(e) => {
              e.stopPropagation();
              onSendOffer(profile);
            }}
            className="text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm shadow-indigo-100 transition-all"
          >
            <Send size={12} /> Offer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
