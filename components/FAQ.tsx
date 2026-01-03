
import React, { useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-blue-600 transition-colors"
      >
        <span className="font-semibold text-slate-800">{question}</span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

const FAQ: React.FC = () => {
  const faqData = [
    {
      question: "Which languages does CareNav support?",
      answer: "CareNav is truly multi-lingual. You can type in your native script (like తెలుగు or हिन्दी) or use transliteration (Romanized text). For example, typing 'naku thala nopi' or 'mujhe sarr dard hai' works perfectly. The AI understands the context and symptoms phonetically and culturally."
    },
    {
      question: "Is this a medical diagnosis?",
      answer: "No. CareNav is an AI-driven risk-based guidance system, not a doctor. It analyzes symptoms to provide a risk level (Low, Medium, or Emergency) and suggests next steps. It cannot identify specific diseases or prescribe treatments. Always consult a professional for medical advice."
    },
    {
      question: "What do the risk levels mean?",
      answer: "• Low Risk: Symptoms usually manageable at home with rest and observation.\n• Medium Risk: You should see a doctor within 24–48 hours for evaluation.\n• High Risk (Emergency): You need immediate medical attention at the nearest emergency room."
    },
    {
      question: "How does CareNav find hospitals?",
      answer: "We use Google Maps and Search grounding to identify the nearest hospitals, clinics, and pharmacies based on your location. We also try to fetch estimated fees and accepted insurance, though you should always verify this directly with the facility."
    },
    {
      question: "Can I use voice to describe my symptoms?",
      answer: "Yes! Tap the microphone icon next to the symptom description box to dictate your symptoms in your preferred language. The system will convert your speech to text automatically."
    },
    {
      question: "Is my personal data safe?",
      answer: "CareNav processes your input to provide immediate health guidance. We do not store your medical history permanently. However, as with all AI tools, avoid sharing highly sensitive personal identifiers like social security numbers."
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mt-12 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Frequently Asked Questions
      </h2>
      <div className="divide-y divide-slate-50">
        {faqData.map((item, index) => (
          <FAQItem key={index} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
};

export default FAQ;
