import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, X, Check, Loader2, Maximize2, AlertTriangle, ScanLine, Edit2, Save } from 'lucide-react';
import { AnalysisResult, VehicleType } from '../types';
import { submitCorrection } from '../services/api';
import { getBackendUrl } from '../services/apiConfig';
import { ApprovalPanel } from './ApprovalPanel';

interface ScannerViewProps {
  onAnalyze: (file: File) => void;
  isAnalyzing: boolean;
  lastResult: AnalysisResult | null;
  lastScannedImage?: string | null;
  onClear?: () => void;
}

export function ScannerView({ onAnalyze, isAnalyzing, lastResult, lastScannedImage, onClear }: ScannerViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(lastScannedImage || null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state to handle UI updates instantly after correction
  const [localResult, setLocalResult] = useState<AnalysisResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempPlate, setTempPlate] = useState("");

  useEffect(() => {
    if (lastResult) {
      setLocalResult(lastResult);
      setIsEditing(false); // Reset edit mode on new scan
    } else {
      setLocalResult(null);
    }
  }, [lastResult]);

  useEffect(() => {
    if (lastScannedImage && !preview) {
      setPreview(lastScannedImage);
    }
  }, [lastScannedImage]);

  // TTS Logic
  const lastSpokenPlateRef = useRef<string | null>(null);

  useEffect(() => {
    if (localResult?.licensePlate) {
      // Only speak if it's a new plate or has changed
      if (localResult.licensePlate !== lastSpokenPlateRef.current) {
        // Space out characters for better pronunciation (e.g. "K A 0 1")
        const plateChars = localResult.licensePlate.split('').join(' ');
        const text = `Vehicle Detected. Plate Number: ${plateChars}`;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for clarity
        window.speechSynthesis.speak(utterance);

        lastSpokenPlateRef.current = localResult.licensePlate;
      }
    } else {
      // Reset if no result (e.g. discarded)
      lastSpokenPlateRef.current = null;
      window.speechSynthesis.cancel();
    }
  }, [localResult?.licensePlate]);

  const handleStartEditing = () => {
    if (localResult) {
      setTempPlate(localResult.licensePlate);
      setIsEditing(true);
    }
  };

  const handleSaveCorrection = async () => {
    if (!localResult) return;
    try {
      await submitCorrection(localResult.id, tempPlate);
      setLocalResult({ ...localResult, licensePlate: tempPlate.toUpperCase(), confidence: 1.0 });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save correction");
    }
  };

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

  const [isDiscarding, setIsDiscarding] = useState(false);

  const handleDiscard = async () => {
    if (!localResult?.id) return;
    if (!window.confirm("Discard this detection? It will be removed from history.")) return;

    setIsDiscarding(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/detections/${localResult.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setLocalResult(null); // Clear the result state to hide the card
        setPreview(null);
        onClear?.();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to discard detection. Please try again.");
    } finally {
      setIsDiscarding(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
      {/* ... (upload area) ... */}
      <div className={`flex-1 relative rounded-2xl border transition-all overflow-hidden bg-zinc-950/50 flex flex-col items-center justify-center group/drop
        ${dragActive ? 'border-blue-500 bg-blue-500/10 scale-[0.98]' : 'border-white/5 hover:border-white/10 hover:bg-zinc-900/50'}`}
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
              <button onClick={stopCamera} className="w-12 h-12 rounded-full bg-red-500/80 text-white flex items-center justify-center backdrop-blur-sm shadow-lg hover:bg-red-600 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>
        ) : preview ? (
          <div className="absolute inset-0 group">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
              <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all hover:scale-110">
                <Upload size={24} />
              </button>
              <button onClick={() => { setPreview(null); startCamera(); }} className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all hover:scale-110">
                <Camera size={24} />
              </button>
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6 relative z-10" strokeWidth={1.5} />
                </div>
                <p className="text-xl font-bold text-white tracking-widest animate-pulse">ANALYZING</p>
                <p className="text-sm text-blue-400 mt-2 font-medium">Extracting Plate Data...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 relative z-10">
            <div className="w-24 h-24 bg-zinc-900/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover/drop:scale-110 transition-transform duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover/drop:opacity-100 transition-opacity"></div>
              <ScanLine className="w-10 h-10 text-zinc-600 group-hover/drop:text-blue-400 transition-colors duration-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Scan Vehicle</h3>
            <p className="text-zinc-500 mb-8 max-w-xs mx-auto text-sm">Drag & drop or use camera to detect license plates</p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all hover:shadow-lg hover:shadow-blue-900/20 flex items-center gap-2 font-semibold text-sm group"
              >
                <Upload size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                Upload File
              </button>
              <button
                onClick={startCamera}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all border border-white/5 flex items-center gap-2 font-semibold text-sm group"
              >
                <Camera size={16} className="group-hover:scale-110 transition-transform" />
                Camera
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
      {localResult && !isAnalyzing && (
        <>
          {/* Low Balance Blocking Modal */}
          {/* Legacy Low Balance Modal - Removed in favor of ApprovalPanel logic, but keeping minimal check if needed or just removing entirely relies on status check above */}


          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 shadow-xl animate-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">

            {/* Legacy Low Balance blur removed */}

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Detection Result</p>
                  {localResult.owner && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Check size={10} />
                      REGISTERED
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={tempPlate}
                      onChange={(e) => setTempPlate(e.target.value.toUpperCase())}
                      className="bg-zinc-950 border border-blue-500 rounded px-3 py-1 text-2xl font-mono font-bold text-white w-full max-w-[200px] outline-none"
                      autoFocus
                    />
                    <button onClick={handleSaveCorrection} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500">
                      <Save size={20} />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-2 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 group">
                    <h2 className="text-2xl font-bold font-mono text-white tracking-tight">{localResult.licensePlate}</h2>
                    <button onClick={handleStartEditing} className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-all">
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}

              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${localResult.confidence > 0.85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                {(localResult.confidence * 100).toFixed(0)}% CONFIDENCE
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Vehicle Type</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-200 capitalize">{localResult.vehicleType}</span>
                </div>
              </div>
              <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Make/Model</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-200 truncate">{localResult.makeModel}</span>
                </div>
              </div>
            </div>

            {/* Owner Information Section */}
            {localResult.owner && (
              <div className="mt-4 p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 rounded-lg border border-emerald-500/20">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">Registered Owner</p>
                <div className="flex items-center gap-4">
                  {localResult.owner.photo && (
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-emerald-500/30 flex-shrink-0">
                      <img
                        src={localResult.owner.photo}
                        alt={localResult.owner.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white mb-1">{localResult.owner.name}</p>
                    <p className="text-sm text-zinc-400 truncate">{localResult.owner.info}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Panel integration */}
            {localResult.status === 'pending_approval' ? (
              <ApprovalPanel
                result={localResult}
                onApprove={() => {
                  setLocalResult(null);
                  setPreview(null);
                  onClear?.();
                }}
                onCancel={handleDiscard}
              />
            ) : (
              /* Fallback for processed/other statuses or just show success msg */
              <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex flex-col items-center">
                <Check className="text-emerald-500 mb-2" size={32} />
                <h3 className="text-emerald-400 font-bold">Processed Successfully</h3>
                <button
                  onClick={() => {
                    setPreview(null);
                    onClear?.();
                  }}
                  className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
                >
                  Scan Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
