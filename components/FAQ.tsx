
import React, { useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-indigo-600 transition-all group"
      >
        <span className={`font-bold text-slate-800 transition-all ${isOpen ? 'text-indigo-600 text-lg' : 'text-base'}`}>{question}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <p className="text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const faqData = [
    {
      question: "Which languages does CareNav support?",
      answer: "CareNav is truly multi-lingual. You can type in your native script (like తెలుగు or हिन्दी) or use transliteration. For example, 'naku thala nopi' works perfectly. Our AI understands phonetics and cultural context fluently."
    },
    {
      question: "Is this a medical professional?",
      answer: "No. CareNav is an AI health guidance assistant. It provides routine care steps and help locating nearby facilities. It cannot diagnose diseases or prescribe medications. Always consult a qualified healthcare provider for medical advice."
    },
    {
      question: "What are the guidance levels?",
      answer: "• Routine Support: Steps for self-observation at home.\n• Evaluation Recommended: Helpful to schedule a visit with a professional soon.\n• Prompt Care Advised: Immediate care is recommended at your nearest facility."
    },
    {
      question: "How are hospital fees estimated?",
      answer: "Fees are estimated based on regional market pricing standards and public records. These are intended for cost clarity and comparison; always verify final costs directly with the healthcare provider."
    },
    {
      question: "Can I use voice to describe symptoms?",
      answer: "Yes! Use the microphone icon to dictate your details in any supported language. Our system handles speech-to-text with high accuracy for multi-lingual inputs."
    }
  ];

  return (
    <div className="mt-16 bg-white rounded-[40px] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-10 delay-300 duration-700">
      <div className="flex items-center space-x-3 mb-10">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Support Library</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {faqData.map((item, index) => (
          <FAQItem key={index} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
};

export default FAQ;
