import { useState, useRef, type FC, type FormEvent, type DragEvent } from 'react';
import { Upload, Camera, MapPin, Calendar, Layers, Sparkles } from 'lucide-react';
import type { Language } from '../types';

interface ImageUploaderProps {
  onDiagnose: (file: File, farmAcres: number, seasonCode: number, fieldName: string) => Promise<void>;
  isLoading: boolean;
  language: Language;
}

export const ImageUploader: FC<ImageUploaderProps> = ({
  onDiagnose,
  isLoading,
  language,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [farmAcres, setFarmAcres] = useState<number>(1.0);
  const [seasonCode, setSeasonCode] = useState<number>(1);
  const [fieldName, setFieldName] = useState<string>('North Plot #4');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(language === 'hi' ? 'कृपया केवल छवि (Image) फ़ाइल चुनें।' : 'Please upload an image file.');
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    if (isCameraActive) stopCamera();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      alert(language === 'hi' ? 'कैमरा शुरू नहीं हो सका।' : 'Unable to access camera.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_leaf_${Date.now()}.jpg`, { type: 'image/jpeg' });
          handleFileChange(file);
        }
      }, 'image/jpeg');
    }
    stopCamera();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    onDiagnose(selectedFile, farmAcres, seasonCode, fieldName);
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 lg:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-forest-400" />
            {language === 'hi' ? 'पत्ती की तस्वीर अपलोड करें' : 'Crop Leaf AI Diagnosis'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            {language === 'hi'
              ? 'स्पष्ट पत्ती की तस्वीर खींचें या ड्रैग करके छोड़ें'
              : 'Snap or drag a clear crop leaf photo for disease & yield loss analysis'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col justify-center">
            {isCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-forest-500/40 aspect-video flex flex-col items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-5 py-2.5 rounded-full bg-forest-500 hover:bg-forest-400 text-slate-950 font-bold shadow-lg shadow-forest-500/40 text-sm transition-all"
                  >
                    {language === 'hi' ? 'तस्वीर खींचें' : 'Capture Snapshot'}
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 rounded-full bg-slate-800 text-gray-300 hover:bg-slate-700 text-sm"
                  >
                    {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-forest-500/30 bg-slate-950/60 aspect-video flex items-center justify-center group">
                <img src={previewUrl} alt="Leaf Preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold"
                  >
                    {language === 'hi' ? 'दूसरी तस्वीर चुनें' : 'Change Image'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold"
                  >
                    {language === 'hi' ? 'हटाएं' : 'Remove'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                  isDragOver
                    ? 'border-forest-400 bg-forest-950/40 scale-[1.01]'
                    : 'border-forest-500/30 hover:border-forest-400/70 bg-slate-900/40 hover:bg-forest-950/20'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-forest-500/10 border border-forest-500/20 flex items-center justify-center text-forest-400 mb-3 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-gray-200 mb-1">
                  {language === 'hi'
                    ? 'पत्ती की तस्वीर यहाँ खींचें या क्लिक करके चुनें'
                    : 'Drag & Drop leaf photo here or click to browse'}
                </p>
                <p className="text-xs text-gray-500">Supports JPG, PNG, WEBP (Max 10MB)</p>

                <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-forest-300 border border-forest-500/20 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'कैमरे से लें' : 'Use Camera'}</span>
                  </button>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-slate-950/40 p-4 lg:p-5 rounded-2xl border border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              {language === 'hi' ? 'खेत और मौसम की जानकारी' : 'Field Context & Parameters'}
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-forest-400" />
                {language === 'hi' ? 'खेत का नाम / प्लॉट' : 'Field Name / Plot ID'}
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. North Acre #2"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-forest-400 transition"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-300">
                  {language === 'hi' ? 'खेत का आकार (एकड़)' : 'Plot Area (Acres)'}
                </span>
                <span className="text-forest-400 font-bold">{farmAcres} Acres</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="20"
                step="0.2"
                value={farmAcres}
                onChange={(e) => setFarmAcres(parseFloat(e.target.value))}
                className="w-full accent-forest-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-forest-400" />
                {language === 'hi' ? 'वर्तमान मौसम' : 'Current Season'}
              </label>
              <select
                value={seasonCode}
                onChange={(e) => setSeasonCode(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-forest-400 transition"
              >
                <option value={0}>{language === 'hi' ? 'बसंत (Spring)' : 'Spring'}</option>
                <option value={1}>{language === 'hi' ? 'गर्मी (Summer)' : 'Summer'}</option>
                <option value={2}>{language === 'hi' ? 'मानसून / वर्षा (Monsoon - High Humidity)' : 'Monsoon (High Humidity)'}</option>
                <option value={3}>{language === 'hi' ? 'सर्दी (Winter)' : 'Winter'}</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isLoading}
              className={`w-full py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                !selectedFile || isLoading
                  ? 'bg-slate-800 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-forest-600 to-forest-500 hover:from-forest-500 hover:to-forest-400 text-slate-950 shadow-forest-600/30 hover:scale-[1.01]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'hi' ? 'पत्ती का विश्लेषण हो रहा है...' : 'Neural Engine Analyzing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'hi' ? 'पत्ती का निदान करें' : 'Run Full Diagnosis'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
