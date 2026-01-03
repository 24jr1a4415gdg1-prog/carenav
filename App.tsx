
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, HealthAnalysis, AppError, ReceiptAnalysisResult, NearbyHospitalsResponse, GuidanceLevel } from './types';
import { analyzeSymptoms, analyzeReceipt, findNearbyFacilities } from './services/geminiService';
import Disclaimer from './components/Disclaimer';
import HospitalList from './components/HospitalList';
import ErrorDisplay from './components/ErrorDisplay';
import FAQ from './components/FAQ';
import EmergencyNumbers from './components/EmergencyNumbers';

type Mode = 'SYMPTOMS' | 'RECEIPT' | 'FIND_NEARBY';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('SYMPTOMS');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [appError, setAppError] = useState<AppError | null>(null);
  
  const [result, setResult] = useState<{ analysis: HealthAnalysis; groundingMetadata?: any } | null>(null);
  const [nearbyResult, setNearbyResult] = useState<{ result: NearbyHospitalsResponse; groundingMetadata?: any } | null>(null);
  const [receiptResult, setReceiptResult] = useState<ReceiptAnalysisResult | null>(null);
  
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

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
        (err) => console.warn("Location permission denied", err)
      );
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({
          ...prev,
          symptoms: prev.symptoms ? `${prev.symptoms} ${transcript}` : transcript
        }));
        setIsDictating(false);
      };

      recognitionRef.current.onend = () => setIsDictating(false);
      recognitionRef.current.onerror = () => setIsDictating(false);
    }
  }, []);

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
    } else {
      if (recognitionRef.current) {
        const langMap: Record<string, string> = {
          'English': 'en-US',
          'Spanish': 'es-ES',
          'French': 'fr-FR',
          'German': 'de-DE',
          'Hindi': 'hi-IN',
          'Telugu': 'te-IN',
          'Chinese': 'zh-CN'
        };
        recognitionRef.current.lang = langMap[formData.language] || 'en-US';
        recognitionRef.current.start();
        setIsDictating(true);
      } else {
        alert("Speech input is not supported in this browser.");
      }
    }
  };

  const handleNearbySearch = async () => {
    if (!location) {
      setAppError({ type: 'INVALID_INPUT', message: 'Location Access', details: 'Location data is helpful for finding nearby support.', canRetry: false });
      return;
    }
    setLoading(true);
    setLoadingMessage('Locating local facilities...');
    setAppError(null);
    try {
      const response = await findNearbyFacilities(location, formData.language);
      setNearbyResult(response);
    } catch (err: any) { setAppError(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.symptoms.trim()) return;
    setLoading(true);
    setLoadingMessage('Reviewing information...');
    setAppError(null);
    try {
      const resp = await analyzeSymptoms(formData, location);
      setResult(resp);
    } catch (err: any) { setAppError(err); } finally { setLoading(false); }
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
      const analysis = await analyzeReceipt(base64, file.type, location);
      setReceiptResult(analysis);
    } catch (err: any) { setAppError(err); } finally { setLoading(false); }
  };

  const handleReset = () => {
    setResult(null);
    setReceiptResult(null);
    setNearbyResult(null);
    setAppError(null);
    setFormData({ symptoms: '', age: '', gender: '', language: formData.language });
  };

  const getGuidanceTheme = (level: GuidanceLevel) => {
    switch (level) {
      case GuidanceLevel.ROUTINE: return 'border-blue-200 bg-blue-50 text-blue-800';
      case GuidanceLevel.EVALUATION: return 'border-amber-200 bg-amber-50 text-amber-800';
      case GuidanceLevel.IMMEDIATE: return 'border-indigo-200 bg-indigo-50 text-indigo-800';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">CareNav</h1>
          </div>
          <select className="text-sm border-none bg-gray-50 rounded-md p-2 outline-none font-bold text-indigo-700" value={formData.language} onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}>
            <option>English</option>
            <option>Telugu</option>
            <option>Hindi</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Chinese</option>
          </select>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {appError && <ErrorDisplay error={appError} onRetry={handleSubmit} onClear={() => setAppError(null)} />}

        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-2xl mb-8 shadow-sm">
          {[
            { id: 'SYMPTOMS', label: 'Guidance' },
            { id: 'FIND_NEARBY', label: 'Local Help' },
            { id: 'RECEIPT', label: 'Bill Review' }
          ].map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id as Mode); handleReset(); }} className={`flex-1 py-3 px-4 text-xs font-bold rounded-xl transition-all ${mode === m.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'SYMPTOMS' && (
          !result ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Health Guidance</h2>
              <p className="text-gray-500 mb-8">Share how you're feeling in your native language for calm, helpful next steps.</p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <textarea required rows={6} placeholder="How can we help today?" className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg resize-none" value={formData.symptoms} onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))} />
                  <button type="button" onClick={toggleDictation} className={`absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-lg active:scale-90 ${isDictating ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </button>
                </div>
                <Disclaimer />
                <button type="submit" disabled={loading || !formData.symptoms.trim()} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:bg-gray-400 shadow-xl transition-all">{loading ? loadingMessage : 'Review My Information'}</button>
              </form>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className={`rounded-2xl shadow-lg border-t-8 p-6 md:p-8 bg-white border-indigo-600`}>
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getGuidanceTheme(result.analysis.guidanceLevel)}`}>
                    {result.analysis.guidanceLevel}
                  </span>
                  <button onClick={handleReset} className="text-sm text-indigo-600 font-bold hover:underline">New Request</button>
                </div>
                
                {result.analysis.isImmediate && result.analysis.emergencyNumbers && (
                  <EmergencyNumbers contacts={result.analysis.emergencyNumbers} highPriority={true} />
                )}

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900">Summary</h3>
                  <p className="text-gray-700 italic mt-3 text-xl leading-relaxed">"{result.analysis.explanation}"</p>
                </div>

                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mt-8">
                  <h3 className="text-xs font-black text-indigo-800 uppercase mb-2 tracking-widest">Recommended Step</h3>
                  <p className="text-2xl font-bold text-indigo-900">{result.analysis.recommendedAction}</p>
                </div>

                <HospitalList groundingMetadata={result.groundingMetadata} hospitalDetails={result.analysis.nearbyHospitals} />
              </div>
            </div>
          )
        )}

        {mode === 'FIND_NEARBY' && (
          !nearbyResult ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Local Support</h2>
              <p className="text-slate-500 mb-10 max-w-sm mx-auto">Find clinics, ambulances, and pharmacies in your immediate locality.</p>
              <button onClick={handleNearbySearch} disabled={loading} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-indigo-700 transition-all">
                {loading ? 'Finding help...' : 'Locate Nearby Help'}
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                  <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold text-gray-900">Nearby Support</h2><button onClick={handleReset} className="text-sm text-indigo-600 font-bold hover:underline">New Search</button></div>
                  {nearbyResult.result.emergencyNumbers && <EmergencyNumbers contacts={nearbyResult.result.emergencyNumbers} />}
                  <div className="my-8 p-5 bg-slate-50 border border-slate-100 rounded-2xl"><p className="text-slate-700 italic text-lg leading-relaxed">"{nearbyResult.result.summary}"</p></div>
                  <HospitalList groundingMetadata={nearbyResult.groundingMetadata} hospitalDetails={nearbyResult.result.nearbyHospitals} />
               </div>
            </div>
          )
        )}

        {mode === 'RECEIPT' && (
           !receiptResult ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Bill Review</h2>
              <p className="text-slate-500 mb-10 max-w-sm mx-auto">Compare medical fees with regional standards for helpful clarity.</p>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-indigo-700 transition-all">
                {loading ? 'Reviewing...' : 'Upload Photo'}
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className={`bg-white rounded-2xl shadow-lg border-t-8 p-6 md:p-8 ${receiptResult.isFair ? 'border-green-500' : 'border-indigo-500'}`}>
                <div className="flex justify-between items-center mb-6"><span className="font-black text-xs uppercase tracking-widest text-indigo-700">Information Review</span><button onClick={handleReset} className="text-sm text-indigo-600 font-bold hover:underline">New Review</button></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{receiptResult.hospitalName}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><p className="text-xs font-bold text-gray-400 mb-1">Total Amount</p><p className="text-2xl font-bold text-gray-900">{receiptResult.detectedFees}</p></div>
                   <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100"><p className="text-xs font-bold text-indigo-400 mb-1">Regional Average</p><p className="text-2xl font-bold text-indigo-900">{receiptResult.fairRange}</p></div>
                </div>
                <p className="text-gray-700 text-sm mb-6 leading-relaxed">{receiptResult.explanation}</p>
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                   <h3 className="font-bold mb-4 text-indigo-400">Next Steps</h3>
                   <ul className="space-y-3">{receiptResult.suggestions.map((s, i) => (<li key={i} className="flex items-start text-sm text-slate-300"><span className="mr-3 font-bold text-indigo-400">{i+1}.</span>{s}</li>))}</ul>
                </div>
              </div>
            </div>
          )
        )}

        <FAQ />
      </main>
    </div>
  );
};

export default App;
