
import React from 'react';
import { EmergencyContact } from '../types';

interface EmergencyNumbersProps {
  contacts: EmergencyContact[];
  highPriority?: boolean;
}

const EmergencyNumbers: React.FC<EmergencyNumbersProps> = ({ contacts, highPriority }) => {
  if (!contacts || contacts.length === 0) return null;

  return (
    <div className={`mt-6 ${highPriority ? 'animate-in fade-in slide-in-from-top-4' : ''}`}>
      <div className={`rounded-2xl p-5 border-2 ${highPriority ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
        <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${highPriority ? 'text-red-600' : 'text-slate-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Local Emergency Contacts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contacts.map((contact, idx) => (
            <a
              key={idx}
              href={`tel:${contact.number.replace(/\s+/g, '')}`}
              className={`flex items-center justify-between px-4 py-4 rounded-xl border transition-all active:scale-95 ${
                highPriority 
                  ? 'bg-white border-red-200 hover:bg-red-100 shadow-sm' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{contact.serviceName}</span>
                <span className={`text-lg font-black ${highPriority ? 'text-red-600' : 'text-slate-800'}`}>
                  {contact.number}
                </span>
              </div>
              <div className={`p-2 rounded-full ${highPriority ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
            </a>
          ))}
        </div>
        {highPriority && (
          <p className="mt-4 text-[11px] text-red-700 font-bold italic text-center">
            TAP A NUMBER TO CALL IMMEDIATELY. DO NOT DELAY.
          </p>
        )}
      </div>
    </div>
  );
};

export default EmergencyNumbers;
