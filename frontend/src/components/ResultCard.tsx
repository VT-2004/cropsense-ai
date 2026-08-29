import type { FC } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Download, Sparkles, TrendingDown, DollarSign, Info } from 'lucide-react';
import type { PredictionResult, Language } from '../types';
import { getPdfReportUrl } from '../lib/api';

interface ResultCardProps {
  result: PredictionResult;
  language: Language;
}

export const ResultCard: FC<ResultCardProps> = ({ result, language }) => {
  const isHealthy = result.severity === 'Healthy' || result.severity_score === 0;

  const getSeverityBadge = () => {
    switch (result.severity) {
      case 'Severe':
        return {
          bg: 'bg-red-950/80 border-red-500/40 text-red-300',
          icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
          label: language === 'hi' ? 'गंभीर (Severe)' : 'Severe',
          gradient: 'from-red-500/20 to-transparent'
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: language === 'hi' ? 'मध्यम (Moderate)' : 'Moderate',
          gradient: 'from-amber-500/20 to-transparent'
        };
      case 'Mild':
        return {
          bg: 'bg-yellow-950/80 border-yellow-500/40 text-yellow-300',
          icon: <Info className="w-4 h-4 text-yellow-400" />,
          label: language === 'hi' ? 'हल्का (Mild)' : 'Mild',
          gradient: 'from-yellow-500/20 to-transparent'
        };
      default:
        return {
          bg: 'bg-forest-950/80 border-forest-500/40 text-forest-300',
          icon: <ShieldCheck className="w-4 h-4 text-forest-400" />,
          label: language === 'hi' ? 'स्वस्थ (Healthy)' : 'Healthy',
          gradient: 'from-forest-500/20 to-transparent'
        };
    }
  };

  const badge = getSeverityBadge();

  return (
    <div className="w-full glass-panel rounded-2xl p-5 lg:p-7 space-y-6 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${badge.gradient}`} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {language === 'hi' ? 'निदान परिणाम' : 'Diagnosis Result'}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-xs text-forest-400">{result.crop}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
            {result.disease_name}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold shadow-sm ${badge.bg}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </div>

          {result.id && (
            <a
              href={getPdfReportUrl(result.id)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-600/20 hover:bg-forest-600/30 text-forest-300 border border-forest-500/30 text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'PDF रिपोर्ट' : 'Export PDF'}</span>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-xl p-3.5 sm:p-4">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-forest-400" />
            {language === 'hi' ? 'विश्वास स्कोर' : 'Confidence'}
          </p>
          <p className="text-xl sm:text-2xl font-black text-forest-400 font-heading">
            {result.confidence}%
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-forest-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${result.confidence}%` }}
            />
          </div>
        </div>

        <div className="glass-card rounded-xl p-3.5 sm:p-4">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            {language === 'hi' ? 'पैदावार हानि' : 'Yield Loss'}
          </p>
          <p className={`text-xl sm:text-2xl font-black font-heading ${isHealthy ? 'text-forest-400' : 'text-red-400'}`}>
            -{result.yield_impact}%
          </p>
          <p className="text-[11px] text-gray-400 mt-1 truncate">
            {result.risk_level || (isHealthy ? 'Safe' : 'Active Risk')}
          </p>
        </div>

        <div className="glass-card rounded-xl p-3.5 sm:p-4">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            {language === 'hi' ? 'वित्तीय जोखिम' : 'Est. Loss Risk'}
          </p>
          <p className="text-xl sm:text-2xl font-black text-amber-400 font-heading">
            ${result.estimated_financial_loss?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Based on acre estimate</p>
        </div>

        <div className="glass-card rounded-xl p-3.5 sm:p-4">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            {language === 'hi' ? 'प्री-चेक स्थिति' : 'Pre-Check'}
          </p>
          <p className={`text-lg sm:text-xl font-bold ${result.pre_check === 'Healthy' ? 'text-forest-400' : 'text-amber-400'}`}>
            {result.pre_check}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">MobileNetV2 fast filter</p>
        </div>
      </div>

      {result.top3 && result.top3.length > 1 && (
        <div className="bg-slate-950/40 rounded-xl p-4 border border-white/5 space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {language === 'hi' ? 'शीर्ष 3 वर्गीकरण संभावनाएँ' : 'Top Multi-Class Probabilities'}
          </p>
          <div className="space-y-2">
            {result.top3.map((pred, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-300 truncate max-w-[70%]">{pred.class_name}</span>
                <span className="font-mono font-semibold text-forest-400">{pred.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-forest-950/20 border border-forest-500/20 rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-forest-400 mb-1.5">
          {language === 'hi' ? 'रोग का कारण व जैविक लक्षण' : 'Pathogen Profile & Underlying Cause'}
        </h4>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{result.cause}</p>
      </div>
    </div>
  );
};
