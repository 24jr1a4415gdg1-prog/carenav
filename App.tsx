
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, HealthAnalysis, AppError, ReceiptAnalysisResult, NearbyHospitalsResponse, GuidanceLevel } from './types';
import { analyzeSymptoms, analyzeReceipt, findNearbyFacilities } from './services/geminiService';
import Disclaimer from './components/Disclaimer';
import HospitalList from './components/HospitalList';
import ErrorDisplay from './components/ErrorDisplay';
import FAQ from './components/FAQ';
import EmergencyNumbers from './components/EmergencyNumbers';
import GuidanceBadge from './components/GuidanceBadge';

type Mode = 'SYMPTOMS' | 'RECEIPT' | 'FIND_NEARBY';

const GUIDED_OPTIONS = {
  "Where is it?": ["Head", "Chest", "Stomach", "Back", "Limbs", "Skin", "General/Whole Body"],
  "How does it feel?": ["Sharp Pain", "Dull Ache", "Burning", "Numbness", "Itchy", "Pressure", "Cramping"],
  "Other Symptoms": ["Fever", "Cough", "Dizziness", "Nausea", "Fatigue", "Shortness of Breath"]
};

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('SYMPTOMS');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [appError, setAppError] = useState<AppError | null>(null);
  
  const [result, setResult] = useState<{ analysis: HealthAnalysis; groundingMetadata?: any } | null>(null);
  const [nearbyResult, setNearbyResult] = useState<{ result: NearbyHospitalsResponse; groundingMetadata?: any } | null>(null);
  const [receiptResult, setReceiptResult] = useState<ReceiptAnalysisResult | null>(null);
  const [receiptGrounding, setReceiptGrounding] = useState<any>(null);
  
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UserProfile>({
    symptoms: '',
    age: '',
    gender: '',
    language: 'English'
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (err) => console.warn("Location access denied", err)
      );
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        addSymptomText(transcript);
        setIsDictating(false);
      };

      recognitionRef.current.onend = () => setIsDictating(false);
      recognitionRef.current.onerror = () => setIsDictating(false);
    }
  }, []);

  const addSymptomText = (text: string) => {
    setFormData(prev => {
      const current = prev.symptoms.trim();
      const newSymptoms = current ? `${current}. ${text}` : text;
      return { ...prev, symptoms: newSymptoms };
    });
    // Visual feedback: briefly focus the textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollTo({ top: textareaRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        const langMap: Record<string, string> = {
          'English': 'en-US', 'Spanish': 'es-ES', 'French': 'fr-FR',
          'German': 'de-DE', 'Hindi': 'hi-IN', 'Telugu': 'te-IN', 'Chinese': 'zh-CN'
        };
        recognitionRef.current.lang = langMap[formData.language] || 'en-US';
        recognitionRef.current.start();
        setIsDictating(true);
      } else {
        alert("Speech input is not supported in this browser.");
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.symptoms.trim()) return;
    setLoading(true);
    setLoadingMessage('CareNav is analyzing your details...');
    setAppError(null);
    try {
      const resp = await analyzeSymptoms(formData, location);
      setResult(resp);
    } catch (err: any) { setAppError(err); } finally { setLoading(false); }
  };

  /**
   * Added handleNearbySearch to fix missing function error
   */
  const handleNearbySearch = async () => {
    if (!location) {
      setAppError({
        type: 'INVALID_INPUT',
        message: 'Location Required',
        details: 'Please enable location access in your browser to find verified nearby facilities.',
        canRetry: true
      });
      return;
    }
    setLoading(true);
    setLoadingMessage('Searching for nearby facilities...');
    setAppError(null);
    try {
      const resp = await findNearbyFacilities(location, formData.language);
      setNearbyResult(resp);
    } catch (err: any) {
      setAppError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setLoadingMessage('Reviewing document...');
    setAppError(null);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const analysisData = await analyzeReceipt(base64, file.type, location);
      setReceiptResult(analysisData.result);
      setReceiptGrounding(analysisData.groundingMetadata);
    } catch (err: any) { setAppError(err); } finally { setLoading(false); }
  };

  const handleReset = () => {
    setResult(null);
    setReceiptResult(null);
    setNearbyResult(null);
    setReceiptGrounding(null);
    setAppError(null);
    setFormData({ ...formData, symptoms: '', age: '', gender: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => { setMode('SYMPTOMS'); handleReset(); }}>
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100 transition-transform group-hover:scale-105">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">CareNav</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Health Guidance</p>
            </div>
          </div>
          
          <select 
            className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 outline-none cursor-pointer hover:bg-indigo-100 transition-colors"
            value={formData.language} 
            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
          >
            <option>English</option><option>Telugu</option><option>Hindi</option>
            <option>Spanish</option><option>French</option><option>German</option><option>Chinese</option>
          </select>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8 pb-20">
        {appError && <ErrorDisplay error={appError} onRetry={mode === 'SYMPTOMS' ? handleSubmit : handleNearbySearch} onClear={() => setAppError(null)} />}

        <nav className="grid grid-cols-3 gap-1 bg-white border border-slate-200 p-1.5 rounded-[22px] mb-10 shadow-sm">
          {[
            { id: 'SYMPTOMS', label: 'Guidance', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'FIND_NEARBY', label: 'Nearby Help', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
            { id: 'RECEIPT', label: 'Bill Review', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
          ].map((m) => (
            <button 
              key={m.id} 
              onClick={() => { setMode(m.id as Mode); handleReset(); }} 
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-4 rounded-[18px] transition-all duration-300 ${mode === m.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 translate-y-[-1px]' : 'text-slate-500 hover:bg-slate-50 active:scale-95'}`}
            >
              <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={m.icon} />
              </svg>
              <span className="text-[11px] sm:text-xs font-bold tracking-tight">{m.label}</span>
            </button>
          ))}
        </nav>

        <section className="animate-in fade-in slide-in-from-bottom-6 duration-500">
          {mode === 'SYMPTOMS' && (
            !result ? (
              <div className="space-y-6">
                <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="p-8 sm:p-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Support Guidance Bar</h2>
                      </div>
                      <button 
                        onClick={() => setFormData(prev => ({...prev, symptoms: ''}))}
                        className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Clear Bar
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="relative group">
                        <textarea 
                          ref={textareaRef}
                          required 
                          rows={4} 
                          placeholder="Your symptoms will appear here. You can type, speak, or select options below..." 
                          className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[32px] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-xl leading-relaxed resize-none font-medium placeholder:text-slate-300 group-hover:border-slate-200" 
                          value={formData.symptoms} 
                          onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))} 
                        />
                        <button 
                          type="button" 
                          onClick={toggleDictation} 
                          className={`absolute bottom-6 right-6 p-5 rounded-2xl shadow-xl transition-all active:scale-90 z-10 ${isDictating ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'}`}
                          title="Voice Input"
                        >
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-6 bg-slate-50/50 p-8 rounded-[40px] border border-slate-100">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Guided Helper (Tap to add to bar)</h3>
                        {Object.entries(GUIDED_OPTIONS).map(([category, options]) => (
                          <div key={category} className="space-y-3">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">{category}</p>
                            <div className="flex flex-wrap gap-2">
                              {options.map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => addSymptomText(opt)}
                                  className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-100 transition-all active:scale-95"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Age</label>
                          <input type="text" placeholder="Optional" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium" value={formData.age} onChange={(e) => setFormData(prev => ({...prev, age: e.target.value}))} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Gender</label>
                          <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium" value={formData.gender} onChange={(e) => setFormData(prev => ({...prev, gender: e.target.value}))}>
                            <option value="">Optional</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <Disclaimer />

                      <button 
                        type="submit" 
                        disabled={loading || !formData.symptoms.trim()} 
                        className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl hover:bg-indigo-700 disabled:bg-slate-300 shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>{loadingMessage}</span>
                          </>
                        ) : (
                          <span>Get Guidance Now</span>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                  <div className="bg-indigo-600 p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                      <GuidanceBadge level={result.analysis.guidanceLevel} />
                      <p className="text-indigo-100 mt-4 text-sm font-medium leading-relaxed max-w-md">Based on your input, here is your calm guidance path.</p>
                    </div>
                    <button onClick={handleReset} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold transition-all backdrop-blur-sm">Reset & Restart</button>
                  </div>

                  <div className="p-10 space-y-12">
                    {result.analysis.isImmediate && result.analysis.emergencyNumbers && (
                      <EmergencyNumbers contacts={result.analysis.emergencyNumbers} highPriority={true} />
                    )}

                    <section>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Support Plan Summary</h3>
                      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px]">
                        <p className="text-slate-800 italic text-2xl leading-relaxed font-semibold">"{result.analysis.supportDescription}"</p>
                      </div>
                    </section>

                    <section className="bg-indigo-50/50 p-10 rounded-[40px] border border-indigo-100/50">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Recommended Action</h3>
                      </div>
                      <p className="text-3xl sm:text-4xl font-black text-indigo-900 leading-tight tracking-tight">{result.analysis.recommendedAction}</p>
                    </section>

                    <HospitalList groundingMetadata={result.groundingMetadata} hospitalDetails={result.analysis.nearbyHospitals} />
                  </div>
                </div>
              </div>
            )
          )}

          {mode === 'FIND_NEARBY' && (
            !nearbyResult ? (
              <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 p-16 text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 transition-transform hover:rotate-6">
                  <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Locate Help Nearby</h2>
                <p className="text-slate-500 mb-12 max-w-sm mx-auto text-xl leading-relaxed font-medium">Instantly discover verified local clinics, ambulance services, and support centers.</p>
                <button onClick={handleNearbySearch} disabled={loading} className="px-16 py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center mx-auto space-x-4">
                  {loading ? (
                    <><svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Locating...</span></>
                  ) : (
                    <><span>Start Search</span><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-10 flex justify-between items-center">
                  <h2 className="text-2xl font-black text-white tracking-tight">Support Centers Found</h2>
                  <button onClick={handleReset} className="text-indigo-400 font-bold text-xs hover:text-indigo-300 transition-colors uppercase tracking-widest">New Search</button>
                </div>
                <div className="p-10 space-y-12">
                  {nearbyResult.result.emergencyNumbers && <EmergencyNumbers contacts={nearbyResult.result.emergencyNumbers} />}
                  <section>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Local Insight</h3>
                    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] font-semibold text-slate-800 italic text-xl leading-relaxed">
                      "{nearbyResult.result.summary}"
                    </div>
                  </section>
                  <HospitalList groundingMetadata={nearbyResult.groundingMetadata} hospitalDetails={nearbyResult.result.nearbyHospitals} />
                </div>
              </div>
            )
          )}

          {mode === 'RECEIPT' && (
            !receiptResult ? (
              <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 p-16 text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-10">
                  <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Review Your Bill</h2>
                <p className="text-slate-500 mb-12 max-w-sm mx-auto text-xl leading-relaxed font-medium">Upload your receipt to compare fees with regional standards and ensure fairness.</p>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={loading} 
                  className="px-16 py-6 bg-indigo-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center mx-auto space-x-4"
                >
                  {loading ? (
                    <><svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Reviewing...</span></>
                  ) : (
                    <><span>Upload Document</span><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
                <div className={`p-10 flex justify-between items-center ${receiptResult.isFair ? 'bg-green-600' : 'bg-indigo-600'}`}>
                  <h2 className="text-2xl font-black text-white tracking-tight leading-none">Billing Fairness Report</h2>
                  <button onClick={handleReset} className="px-6 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20">New Review</button>
                </div>
                <div className="p-10 space-y-12">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">{receiptResult.hospitalName}</h2>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Date of Service: <span className="text-indigo-600">{receiptResult.dateOfService}</span></p>
                    </div>
                    <div className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest border-2 shadow-sm ${receiptResult.isFair ? 'bg-green-50 text-green-700 border-green-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                      {receiptResult.isFair ? 'Fair Market Pricing' : 'Pricing Variance Detected'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detected Fees</p>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{receiptResult.detectedFees}</p>
                    </div>
                    <div className="bg-indigo-50 p-8 rounded-[40px] border border-indigo-100 shadow-sm">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Standard Regional Fair Range</p>
                      <p className="text-4xl font-black text-indigo-900 tracking-tighter">{receiptResult.fairRange}</p>
                    </div>
                  </div>

                  <section>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Expert Analysis</h3>
                    <p className="text-slate-800 leading-relaxed font-semibold text-2xl italic bg-slate-50 p-10 rounded-[40px] border border-slate-100 shadow-sm">"{receiptResult.explanation}"</p>
                  </section>

                  <section className="bg-slate-900 text-white p-10 rounded-[48px] shadow-2xl">
                    <h3 className="font-black text-indigo-400 mb-8 text-sm uppercase tracking-[0.2em]">Next Guidance Steps</h3>
                    <ul className="space-y-6">
                      {receiptResult.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start text-slate-200 font-bold text-lg leading-relaxed">
                          <span className="w-8 h-8 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-black mr-6 flex-shrink-0 mt-0.5 border border-indigo-500/20">{i+1}</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </section>

                  {receiptGrounding && <HospitalList title="Regional Pricing Verification" groundingMetadata={receiptGrounding} />}
                </div>
              </div>
            )
          )}
        </section>

        <FAQ />
      </main>
    </div>
  );
};

export default App;
