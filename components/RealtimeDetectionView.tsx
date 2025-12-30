import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Play, Square, Loader2, AlertTriangle, ScanLine, IndianRupee } from 'lucide-react';
import { analyzeVehicleImageLocal } from '../services/api';
import { AnalysisResult, VehicleType } from '../types';
import { TOLL_RATES as DEFAULT_RATES } from '../constants';

export function RealtimeDetectionView() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isActive, setIsActive] = useState(false);
    const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Config
    const detectionIntervalMs = 2000; // Check every 2 seconds

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive) {
            startCamera();
            interval = setInterval(processFrame, detectionIntervalMs);
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
            clearInterval(interval);
        };
    }, [isActive]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setError(null);
            }
        } catch (err) {
            setError("Camera access denied. Please enable camera permissions.");
            setIsActive(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    const processFrame = async () => {
        if (!videoRef.current || isProcessing) return;

        setIsProcessing(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const file = new File([blob], "realtime_frame.jpg", { type: "image/jpeg" });
                        try {
                            // We use the existing analyze function
                            const result = await analyzeVehicleImageLocal(file);
                            // Only update if we found something with decent confidence or if it's different
                            if (result.licensePlate !== "UNKNOWN" && result.confidence > 0.4) {
                                setLastResult(result);
                            }
                        } catch (e) {
                            console.error("Realtime processing error", e);
                        }
                    }
                    setIsProcessing(false);
                }, 'image/jpeg', 0.8);
            } else {
                setIsProcessing(false);
            }
        } catch (e) {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-full flex flex-col max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                        <ScanLine className="text-blue-500" />
                        Real-time Detection
                    </h2>
                    <p className="text-zinc-400 text-sm">Continuous monitoring and instant analysis feed.</p>
                </div>

                <button
                    onClick={() => setIsActive(!isActive)}
                    className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${isActive
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                        }`}
                >
                    {isActive ? (
                        <>
                            <Square size={18} fill="currentColor" />
                            Stop Monitoring
                        </>
                    ) : (
                        <>
                            <Play size={18} fill="currentColor" />
                            Start Monitoring
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-400">
                    <AlertTriangle />
                    {error}
                </div>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Camera Feed */}
                <div className="lg:col-span-2 bg-black rounded-2xl overflow-hidden border border-zinc-800 relative bg-zinc-950 flex flex-col">
                    {isActive ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain flex-1"
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
                            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center">
                                <Camera size={32} />
                            </div>
                            <p>Camera is offline</p>
                        </div>
                    )}

                    {/* Overlay Status */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        {isActive && (
                            <div className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                LIVE
                            </div>
                        )}
                        {isProcessing && (
                            <div className="px-3 py-1 bg-black/50 backdrop-blur text-zinc-300 text-xs font-medium rounded-full border border-white/10 flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin" />
                                Processing
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Results Feed */}
                <div className="lg:col-span-1 bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex flex-col">
                    <h3 className="font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                        <ScanLine size={18} className="text-purple-400" />
                        Latest Detection
                    </h3>

                    {lastResult ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-center">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">License Plate</p>
                                <div className="text-3xl font-mono font-bold text-white bg-zinc-900 border border-zinc-800 py-4 rounded-lg tracking-wider">
                                    {lastResult.licensePlate}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                    <span className="text-sm text-zinc-400">Confidence</span>
                                    <span className={`text-sm font-bold ${lastResult.confidence > 0.8 ? 'text-emerald-400' : 'text-amber-400'
                                        }`}>
                                        {(lastResult.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                    <span className="text-sm text-zinc-400">Vehicle Type</span>
                                    <span className="text-sm font-bold text-blue-400 capitalize">
                                        {lastResult.vehicleType}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                    <span className="text-sm text-zinc-400">Est. Toll</span>
                                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                                        <IndianRupee size={14} />
                                        {DEFAULT_RATES[lastResult.vehicleType] || DEFAULT_RATES[VehicleType.Unknown] || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="text-xs text-center text-zinc-600 pt-4 border-t border-zinc-800">
                                Last updated: {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
                            <ScanLine size={32} className="mb-4 opacity-50" />
                            <p>No vehicles detected yet.</p>
                            <p className="text-xs mt-2 opacity-50">Start camera to begin monitoring</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
