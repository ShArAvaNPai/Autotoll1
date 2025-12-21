import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, X, Check, Loader2, Maximize2, AlertTriangle, ScanLine } from 'lucide-react';
import { AnalysisResult, VehicleType } from '../types';

interface ScannerViewProps {
  onAnalyze: (file: File) => void;
  isAnalyzing: boolean;
  lastResult: AnalysisResult | null;
  lastScannedImage?: string | null;
}

export function ScannerView({ onAnalyze, isAnalyzing, lastResult, lastScannedImage }: ScannerViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(lastScannedImage || null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lastScannedImage && !preview) {
      setPreview(lastScannedImage);
    }
  }, [lastScannedImage]);

  // ... (camera logic remains same) ...
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError("Camera access denied or unavailable");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);

      canvas.toBlob(blob => {
        if (blob) {
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          handleFile(file);
          stopCamera();
        }
      });
    }
  };
  // ... end camera logic ...

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      onAnalyze(file);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className={`flex-1 relative rounded-2xl border-2 transition-all overflow-hidden bg-zinc-950 shadow-xl flex flex-col items-center justify-center
        ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-dashed border-zinc-800'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >

        {isCameraActive ? (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-6 flex gap-4">
              <button onClick={captureImage} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-colors">
                <div className="w-12 h-12 bg-white rounded-full"></div>
              </button>
              <button onClick={stopCamera} className="w-12 h-12 rounded-full bg-red-500/80 text-white flex items-center justify-center backdrop-blur-sm">
                <X size={20} />
              </button>
            </div>
          </div>
        ) : preview ? (
          <div className="absolute inset-0 group">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all">
                <Upload size={24} />
              </button>
              <button onClick={() => { setPreview(null); startCamera(); }} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all">
                <Camera size={24} />
              </button>
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-zinc-200 font-medium animate-pulse">Analyzing Vehicle...</p>
                <p className="text-sm text-zinc-500 mt-1">Detecting plates & features</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-800">
              <ScanLine className="w-10 h-10 text-zinc-500 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-200 mb-2">Scan Vehicle</h3>
            <p className="text-zinc-500 mb-8 max-w-xs mx-auto">Drag & drop an image or use the camera to start detection.</p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 font-medium"
              >
                <Upload size={18} />
                Upload File
              </button>
              <button
                onClick={startCamera}
                className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2 font-medium"
              >
                <Camera size={18} />
                Use Camera
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
            // Reset input so same file can be selected again
            e.target.value = '';
          }}
        />
      </div>

      {/* Result Card (Minimal) */}
      {lastResult && !isAnalyzing && (
        <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Detection Result</p>
                {lastResult.owner && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check size={10} />
                    REGISTERED
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold font-mono text-white tracking-tight">{lastResult.licensePlate}</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${lastResult.confidence > 0.85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
              {(lastResult.confidence * 100).toFixed(0)}% CONFIDENCE
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Vehicle Type</p>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-200 capitalize">{lastResult.vehicleType}</span>
              </div>
            </div>
            <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Make/Model</p>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-200 truncate">{lastResult.makeModel}</span>
              </div>
            </div>
          </div>

          {/* Owner Information Section */}
          {lastResult.owner && (
            <div className="mt-4 p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 rounded-lg border border-emerald-500/20">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Registered Owner</p>
              <div className="flex items-center gap-4">
                {lastResult.owner.photo && (
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-emerald-500/30 flex-shrink-0">
                    <img
                      src={lastResult.owner.photo}
                      alt={lastResult.owner.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white mb-1">{lastResult.owner.name}</p>
                  <p className="text-sm text-zinc-400 truncate">{lastResult.owner.info}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setPreview(null)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Upload size={14} />
              Scan New Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
