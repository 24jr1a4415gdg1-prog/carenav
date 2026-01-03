
import React, { useState } from 'react';
import { AppError } from '../types';

interface ErrorDisplayProps {
  error: AppError;
  onRetry: () => void;
  onClear: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onClear }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getTheme = () => {
    switch (error.type) {
      case 'NETWORK':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-900',
          subtext: 'text-amber-700',
          accent: 'bg-amber-100',
          iconColor: 'text-amber-500',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'AI_PROCESSING':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          subtext: 'text-blue-700',
          accent: 'bg-blue-100',
          iconColor: 'text-blue-500',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )
        };
      case 'INVALID_INPUT':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          text: 'text-indigo-900',
          subtext: 'text-indigo-700',
          accent: 'bg-indigo-100',
          iconColor: 'text-indigo-500',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          subtext: 'text-red-700',
          accent: 'bg-red-100',
          iconColor: 'text-red-500',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const theme = getTheme();

  return (
    <div className={`${theme.bg} ${theme.border} border-2 rounded-2xl shadow-sm p-6 mb-6 animate-in fade-in zoom-in-95 duration-300`}>
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 ${theme.accent} p-3 rounded-xl ${theme.iconColor}`}>
          {theme.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${theme.text}`}>{error.message}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.subtext} opacity-60`}>
              {error.type}
            </span>
          </div>
          
          <p className={`${theme.subtext} mt-2 leading-relaxed font-medium`}>
            {error.details || 'Something went wrong during the analysis process. Please check your information and try again.'}
          </p>
          
          {error.details && (
            <div className="mt-4">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className={`text-xs font-bold uppercase tracking-wider ${theme.text} underline flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity`}
              >
                {showDetails ? 'Hide' : 'Show'} Diagnostic Info
              </button>
              {showDetails && (
                <div className="mt-2 p-3 bg-black/5 rounded-lg text-xs font-mono break-all leading-tight opacity-70">
                  {error.details}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex flex-wrap gap-3">
            {error.canRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 shadow-sm text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Analysis
              </button>
            )}
            <button
              onClick={onClear}
              className={`inline-flex items-center px-6 py-3 ${theme.accent} ${theme.text} text-sm font-bold rounded-xl hover:opacity-80 active:scale-95 transition-all`}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
