import { useEffect, useState, type FC } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { History, Download, Trash2, RefreshCw } from 'lucide-react';
import type { HistoryRecord, Language } from '../types';
import { getHistory, deleteHistoryRecord, getPdfReportUrl } from '../lib/api';

interface HistoryDashboardProps {
  language: Language;
}

export const HistoryDashboard: FC<HistoryDashboardProps> = ({ language }) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getHistory(50);
      setHistory(data);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'hi' ? 'क्या आप इस रिकॉर्ड को हटाना चाहते हैं?' : 'Delete this diagnostic record?')) return;
    const ok = await deleteHistoryRecord(id);
    if (ok) {
      setHistory((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const chartData = [...history].reverse().map((item, index) => ({
    name: `#${index + 1} ${item.crop || ''}`,
    confidence: item.confidence,
    yieldLoss: item.yield_impact,
    date: item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
  }));

  return (
    <div className="w-full space-y-6">
      <div className="glass-panel rounded-2xl p-5 lg:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-heading">
              <History className="w-5 h-5 text-forest-400" />
              {language === 'hi' ? 'खेत का स्वास्थ्य इतिहास व रुझान' : 'Field Health History & Time-Series Trends'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              {language === 'hi'
                ? 'समय के साथ फसल की स्थिति और निदान रिकॉर्ड का विश्लेषण'
                : 'Track disease frequency, confidence metrics, and yield impact over time'}
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{language === 'hi' ? 'ताज़ा करें' : 'Refresh'}</span>
          </button>
        </div>

        {chartData.length > 1 && (
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest-400 mb-3">
              {language === 'hi' ? 'निदान विश्वास और पैदावार हानि रुझान (%)' : 'Diagnostic Confidence & Yield Loss Timeline (%)'}
            </h3>
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="confidence" name="Confidence %" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#confidenceGrad)" />
                  <Area type="monotone" dataKey="yieldLoss" name="Yield Loss %" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#lossGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-5 lg:p-7 space-y-4">
        <h3 className="text-base font-bold text-white font-heading">
          {language === 'hi' ? 'सभी पिछले स्कैन' : 'All Past Diagnostic Scans'}
        </h3>

        {history.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs sm:text-sm">
            <History className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p>{language === 'hi' ? 'कोई इतिहास रिकॉर्ड नहीं मिला।' : 'No past diagnostic records found yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-gray-400 bg-slate-900/60 border-b border-white/10 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Field / Plot</th>
                  <th className="py-2.5 px-3">Diagnosed Condition</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Yield Loss</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-forest-950/20 transition">
                    <td className="py-3 px-3 text-gray-400 text-xs font-mono">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3 px-3 text-gray-300 font-medium">
                      {item.field_name || 'Main Plot'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {item.disease_name}
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
                    <td className="py-3 px-3 text-right space-x-2">
                      <a
                        href={getPdfReportUrl(item.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-forest-400 hover:text-forest-300 text-xs font-semibold px-2 py-1 bg-forest-950/60 rounded-lg border border-forest-500/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">PDF</span>
                      </a>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center text-red-400 hover:text-red-300 text-xs p-1 hover:bg-red-950/40 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
