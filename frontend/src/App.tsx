import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { TreatmentTimeline } from './components/TreatmentTimeline';
import { BatchUploader } from './components/BatchUploader';
import { HistoryDashboard } from './components/HistoryDashboard';
import type { PredictionResult, Language } from './types';
import { predictLeaf, checkBackendHealth } from './lib/api';
import { Award } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'history' | 'insights'>('single');
  const [language, setLanguage] = useState<Language>('en');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<PredictionResult | null>(null);

  useEffect(() => {
    const ping = async () => {
      const ok = await checkBackendHealth();
      setIsBackendConnected(ok);
    };
    ping();
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDiagnose = async (
    file: File,
    farmAcres: number,
    seasonCode: number,
    fieldName: string
  ) => {
    setIsLoading(true);
    try {
      const res = await predictLeaf(file, farmAcres, seasonCode, language, fieldName);
      setCurrentResult(res);
    } catch (err: any) {
      alert(`Diagnosis error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090e0b] text-gray-100 flex flex-col selection:bg-forest-500 selection:text-black">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        isBackendConnected={isBackendConnected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 sm:py-8 space-y-8">
        <div className="relative rounded-3xl overflow-hidden glass-panel border border-forest-500/20 p-6 sm:p-8 bg-gradient-to-r from-forest-950/80 via-slate-900/90 to-slate-950/90">
          <div className="max-w-2xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-500/10 border border-forest-500/30 text-forest-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-forest-400" />
              <span>97.45% Fine-Tuned EfficientNetB3 & Random Forest</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading leading-tight">
              {language === 'hi'
                ? 'स्मार्ट फसल रोग पहचान और पैदावार सुरक्षा'
                : 'Protect Your Crop Health with Deep Learning AI'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {language === 'hi'
                ? 'पत्तियों की तस्वीर अपलोड करें, 38 फसल रोगों का तुरंत पता लगाएं, दवा का नुस्खा पाएं और नुकसान का अनुमान लगाएं।'
                : 'Upload leaf imagery to detect 38 plant disease classes, estimate yield risk, and generate actionable treatment roadmaps in seconds.'}
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-forest-500/10 blur-3xl pointer-events-none rounded-full" />
        </div>

        {activeTab === 'single' && (
          <div className="space-y-8">
            <ImageUploader
              onDiagnose={handleDiagnose}
              isLoading={isLoading}
              language={language}
            />

            {currentResult && (
              <div className="space-y-6 animate-fade-in">
                <ResultCard result={currentResult} language={language} />
                <TreatmentTimeline
                  treatments={currentResult.treatment}
                  prevention={currentResult.prevention}
                  isHealthy={currentResult.severity === 'Healthy' || currentResult.severity_score === 0}
                  language={language}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'batch' && <BatchUploader language={language} />}

        {activeTab === 'history' && <HistoryDashboard language={language} />}
      </main>

      <footer className="glass-panel border-t border-white/5 py-6 px-4 lg:px-8 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CropSense AI. All agronomic models trained and verified.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>React Frontend</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
