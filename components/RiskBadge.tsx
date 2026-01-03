
import React from 'react';
import { GuidanceLevel } from '../types';

interface RiskBadgeProps {
  level: GuidanceLevel;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  // Mapping GuidanceLevel values to visual styles
  const styles = {
    [GuidanceLevel.ROUTINE]: "bg-green-100 text-green-800 border-green-200",
    [GuidanceLevel.EVALUATION]: "bg-yellow-100 text-yellow-800 border-yellow-200",
    [GuidanceLevel.IMMEDIATE]: "bg-red-100 text-red-800 border-red-200 animate-pulse",
  };

  const icons = {
    [GuidanceLevel.ROUTINE]: (
      <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    [GuidanceLevel.EVALUATION]: (
      <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    [GuidanceLevel.IMMEDIATE]: (
      <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${styles[level]}`}>
      {icons[level]}
      {level}
    </div>
  );
};

export default RiskBadge;
