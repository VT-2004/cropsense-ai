import type { FC } from 'react';
import { CheckCircle2, Shield, Droplets } from 'lucide-react';
import type { Language } from '../types';

interface TreatmentTimelineProps {
  treatments: string[];
  prevention: string;
  isHealthy: boolean;
  language: Language;
}

export const TreatmentTimeline: FC<TreatmentTimelineProps> = ({
  treatments,
  prevention,
  isHealthy,
  language,
}) => {
  return (
    <div className="w-full glass-panel rounded-2xl p-5 lg:p-7 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-heading">
            <Droplets className="w-5 h-5 text-forest-400" />
            {language === 'hi' ? 'उपचार और रोकथाम योजना' : 'Treatment & Recovery Roadmap'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">
            {isHealthy
              ? (language === 'hi' ? 'पौधे को स्वस्थ बनाए रखने के सुझाव' : 'Maintenance guidelines to preserve high yield and leaf vigor')
              : (language === 'hi' ? 'फसल बचाने के लिए तत्काल कार्रवाई कदम' : 'Targeted chemical and biological steps to eradicate infection')}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-forest-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          {language === 'hi' ? 'चरणबद्ध उपचार निर्देश' : 'Step-by-Step Action Plan'}
        </h4>

        <div className="space-y-2.5">
          {treatments && treatments.length > 0 ? (
            treatments.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-forest-500/30 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-forest-600/20 text-forest-400 border border-forest-500/40 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">{step}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400">No specific treatment steps required.</p>
          )}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-forest-950/40 border border-forest-500/30 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-forest-500/20 flex items-center justify-center text-forest-400 shrink-0">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-forest-300 mb-1">
            {language === 'hi' ? 'दीर्घकालिक रोकथाम प्रोटोकॉल' : 'Long-Term Prevention Protocol'}
          </h4>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{prevention}</p>
        </div>
      </div>
    </div>
  );
};
