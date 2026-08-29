import React from 'react';
import { Sprout, Layers, History, Globe } from 'lucide-react';
import type { Language } from '../types';

interface NavbarProps {
  activeTab: 'single' | 'batch' | 'history' | 'insights';
  setActiveTab: (tab: 'single' | 'batch' | 'history' | 'insights') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isBackendConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  isBackendConnected,
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-forest-500/20 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-forest-600 to-forest-400 flex items-center justify-center shadow-lg shadow-forest-500/30">
            <Sprout className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-heading">
                CropSense <span className="text-forest-400">AI</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-forest-500/10 text-forest-300 border border-forest-500/30 rounded-full">
                v1.0 ML
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">
              {language === 'hi'
                ? 'कृषि रोग निदान और पैदावार संरक्षण प्रणाली'
                : 'Intelligent Crop Diagnostics & Yield Protection'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/80 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'single'
                ? 'bg-forest-600 text-white shadow-md shadow-forest-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === 'hi' ? 'पत्ती जांच' : 'Diagnose'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'batch'
                ? 'bg-forest-600 text-white shadow-md shadow-forest-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === 'hi' ? 'बैच स्कैन' : 'Batch Scan'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-forest-600 text-white shadow-md shadow-forest-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">
              {language === 'hi' ? 'इतिहास' : 'History'}
            </span>
          </button>
        </nav>

        {/* Status indicator & Language Toggle */}
        <div className="flex items-center gap-3">
          {/* Backend Health Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
              isBackendConnected
                ? 'bg-forest-950/60 text-forest-300 border-forest-500/30'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isBackendConnected ? 'bg-forest-400' : 'bg-amber-400'
              }`}
            />
            <span>{isBackendConnected ? 'Models Online' : 'Connecting...'}</span>
          </div>

          {/* Bilingual Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-white/10 text-gray-300 hover:text-forest-400 hover:border-forest-500/40 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-forest-400" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
