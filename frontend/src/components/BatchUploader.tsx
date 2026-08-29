import React, { useState, useRef } from 'react';
import { Layers, Upload, CheckCircle2, RefreshCw, Download } from 'lucide-react';
import type { PredictionResult, Language } from '../types';
import { predictBatch, getPdfReportUrl } from '../lib/api';

interface BatchUploaderProps {
  language: Language;
}

export const BatchUploader: React.FC<BatchUploaderProps> = ({ language }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [farmAcres] = useState<number>(2.0);
  const [fieldName] = useState<string>('East Orchard');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...valid]);
  };

  const handleRunBatch = async () => {
    if (files.length === 0) return;
    setIsLoading(true);
    try {
      const res = await predictBatch(files, farmAcres, 1, language, fieldName);
      setResults(res.items || []);
    } catch (err: any) {
      alert(`Batch prediction error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setResults([]);
  };

  return (
    <div className="w-full space-y-6">
      <div className="glass-panel rounded-2xl p-5 lg:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-heading">
              <Layers className="w-5 h-5 text-forest-400" />
              {language === 'hi' ? 'बैच पत्ती स्कैनर (एकाधिक पत्तियां)' : 'Multi-Leaf Batch Scanner'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              {language === 'hi'
                ? 'एक साथ पूरे खेत की कई पत्तियों को स्कैन करके विस्तृत रिपोर्ट तैयार करें'
                : 'Upload multiple leaf images across your field to get an aggregate infection survey'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>{language === 'hi' ? 'पत्तियां जोड़ें' : 'Add Images'}</span>
            </button>
            {files.length > 0 && (
              <button
                onClick={handleClear}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-semibold"
              >
                {language === 'hi' ? 'साफ़ करें' : 'Clear All'}
              </button>
            )}
          </div>
        </div>

        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {files.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-forest-500/30 hover:border-forest-400 rounded-2xl p-10 text-center cursor-pointer bg-slate-900/30 transition flex flex-col items-center justify-center"
          >
            <Layers className="w-10 h-10 text-forest-400/60 mb-2" />
            <p className="text-sm font-semibold text-gray-300">
              {language === 'hi' ? 'कई पत्तियों की तस्वीरें चुनें (1-20 छवियाँ)' : 'Click to select multiple leaf photos (1–20 files)'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Batch processing powered by parallel neural pipeline</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{files.length} {language === 'hi' ? 'पत्तियां चुनी गईं' : 'leaves queued'}</span>
              <button
                onClick={handleRunBatch}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-forest-600 to-forest-500 text-slate-950 font-bold text-xs sm:text-sm hover:from-forest-500 hover:to-forest-400 transition flex items-center gap-2 shadow-lg shadow-forest-600/30"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'hi' ? 'प्रसंस्करण जारी...' : 'Analyzing Batch...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'hi' ? 'बैच विश्लेषण शुरू करें' : 'Process Entire Batch'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-white/5">
              {files.map((file, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden aspect-square border border-white/10 bg-black flex items-center justify-center">
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-slate-900/80 text-[10px] px-1 rounded text-gray-300 font-mono">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 lg:p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base sm:text-lg font-bold text-white font-heading">
              {language === 'hi' ? 'बैच परिणाम सारांश' : 'Batch Diagnosis Report'}
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-forest-500/20 text-forest-300 border border-forest-500/40">
              {results.length} {language === 'hi' ? 'पत्तियों का विश्लेषण संपन्न' : 'Leaves Processed'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-gray-400 bg-slate-900/60 border-b border-white/10 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">File</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Yield Impact</th>
                  <th className="py-2.5 px-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {results.map((item, idx) => (
                  <tr key={idx} className="hover:bg-forest-950/20 transition">
                    <td className="py-3 px-3 font-mono text-xs text-gray-400 truncate max-w-[120px]">
                      {item.filename}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {item.disease_name}
                    </td>
                    <td className="py-3 px-3 text-forest-400 font-mono">
                      {item.confidence}%
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.severity === 'Severe'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : item.severity === 'Moderate'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-forest-500/20 text-forest-300 border border-forest-500/30'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-red-400 font-semibold">
                      -{item.yield_impact}%
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.id && (
                        <a
                          href={getPdfReportUrl(item.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-forest-400 hover:text-forest-300 text-xs font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
