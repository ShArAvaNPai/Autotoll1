import React, { useState } from 'react';
import { User, Car, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
    onLogin: (role: 'admin' | 'owner') => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-96 bg-purple-600/10 blur-[100px] pointer-events-none" />

            <div className="z-10 text-center mb-12 space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/20">
                    <Car className="text-white w-10 h-10" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    AutoToll AI
                </h1>
                <p className="text-zinc-500 text-lg max-w-md mx-auto">
                    Next-generation automated toll collection and vehicle management system.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl z-10">
                {/* Admin Card */}
                <div
                    onClick={() => onLogin('admin')}
                    className="group relative cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800 hover:border-blue-500/30 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10"
                >
                    <div className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-zinc-400 group-hover:text-blue-400 transition-colors">
                        <ShieldCheck size={20} />
                    </div>
                    <div className="h-40 flex items-center justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <ShieldCheck className="w-10 h-10 text-blue-400" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-100 mb-2">Administrator</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        Access the full dashboard, monitor real-time traffic, manage registry, and view analytics.
                    </p>
                    <div className="mt-6 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Admin Login &rarr;
                    </div>
                </div>

                {/* Owner Card */}
                <div
                    onClick={() => onLogin('owner')}
                    className="group relative cursor-pointer bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/30 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10"
                >
                    <div className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-zinc-400 group-hover:text-emerald-400 transition-colors">
                        <User size={20} />
                    </div>
                    <div className="h-40 flex items-center justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Car className="w-10 h-10 text-emerald-400" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-100 mb-2">Vehicle Owner</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                        Register your vehicle, check payment status, and view your toll history securely.
                    </p>
                    <div className="mt-6 flex items-center text-emerald-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Owner Portal &rarr;
                    </div>
                </div>
            </div>

            <div className="mt-12 text-zinc-600 text-sm">
                &copy; {new Date().getFullYear()} AutoToll AI System.
            </div>
        </div>
    );
}
