import React, { useRef, useState, useEffect } from 'react';
import { Camera, Play, Square, Loader2, AlertTriangle, ScanLine, IndianRupee } from 'lucide-react';
import { analyzeVehicleImageLocal } from '../services/api';
import { AnalysisResult, VehicleType } from '../types';
import { TOLL_RATES as DEFAULT_RATES } from '../constants';

export function RealtimeDetectionView() {
    // Add scanner animation style
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
          @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    const videoRef = useRef<HTMLVideoElement>(null);
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
                            const result = await analyzeVehicleImageLocal(file);
                            // We still use the 'color' field if available, but don't show it 
                            // heavily or require the HUD to display it.
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
        <div className="h-full flex flex-col max-w-5xl mx-auto overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
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
                <div className="lg:col-span-2 bg-black rounded-3xl overflow-hidden border border-zinc-800 relative bg-zinc-950 flex flex-col group shadow-2xl shadow-blue-900/10">
                    {/* HUD Overlay - Corners */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-blue-500/50 rounded-tl-xl z-20"></div>
                    <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-blue-500/50 rounded-tr-xl z-20"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-blue-500/50 rounded-bl-xl z-20"></div>
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-blue-500/50 rounded-br-xl z-20"></div>

                    {/* Cyberpunk Grid */}
                    <div className="absolute inset-0 z-10 opacity-20 pointer-events-none"
                        style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                    </div>

                    {isActive ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain flex-1 relative z-0"
                            style={{ filter: 'contrast(1.1) brightness(1.1)' }}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4 relative z-0">
                            <div className="w-24 h-24 rounded-full bg-zinc-900/50 border border-zinc-700 flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-blue-500"></div>
                                <Camera size={40} className="text-zinc-600" />
                            </div>
                            <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-500/50">System Offline</p>
                        </div>
                    )}

                    {/* Scanner Animation */}
                    {isActive && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                            <div className="w-full h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)] absolute top-0 animate-[scan_2s_linear_infinite] opacity-80"></div>
                        </div>
                    )}

                    {/* Overlay Status */}
                    <div className="absolute top-6 right-6 flex gap-3 z-30">
                        {isActive && (
                            <div className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold rounded-md animate-pulse flex items-center gap-2 backdrop-blur-md">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_red]"></span>
                                LIVE FEED
                            </div>
                        )}

                        {isProcessing && (
                            <div className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 backdrop-blur-md text-xs font-bold rounded-md flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin" />
                                PROCESSING
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

                                {lastResult.color && (
                                    <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                        <span className="text-sm text-zinc-400">Color</span>
                                        <span className="text-sm font-bold text-purple-400 capitalize">
                                            {lastResult.color}
                                        </span>
                                    </div>
                                )}

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
