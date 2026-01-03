
import React from 'react';
import { GuidanceLevel } from '../types';

interface GuidanceBadgeProps {
  level: GuidanceLevel;
}

const GuidanceBadge: React.FC<GuidanceBadgeProps> = ({ level }) => {
  const styles = {
    [GuidanceLevel.ROUTINE]: "bg-white/20 text-white border-white/30",
    [GuidanceLevel.EVALUATION]: "bg-indigo-400 text-white border-indigo-300",
    [GuidanceLevel.IMMEDIATE]: "bg-white text-indigo-600 border-white shadow-lg",
  };

  const labels = {
    [GuidanceLevel.ROUTINE]: "Routine Support",
    [GuidanceLevel.EVALUATION]: "Evaluation Recommended",
    [GuidanceLevel.IMMEDIATE]: "Prompt Care Advised",
  };

  const icons = {
    [GuidanceLevel.ROUTINE]: (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    [GuidanceLevel.EVALUATION]: (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    [GuidanceLevel.IMMEDIATE]: (
      <svg className="w-4 h-4 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`inline-flex items-center px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${styles[level]}`}>
      {icons[level]}
      {labels[level]}
    </div>
  );
};

export default GuidanceBadge;
