import React, { useState } from 'react';
import { User, Car, ShieldCheck, X, LogIn, Sparkles, Zap, Lock, ArrowRight } from 'lucide-react';

interface LoginViewProps {
    onLogin: (role: 'admin' | 'owner') => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [hoveredCard, setHoveredCard] = useState<'admin' | 'owner' | null>(null);

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'Admin' && password === 'Admin@123') {
            onLogin('admin');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Primary gradient orbs */}
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-gradient-to-tl from-purple-600/30 via-pink-600/20 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '5s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />

                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            {/* Logo and Header */}
            <div className="z-10 text-center mb-16 space-y-6">
                <div className="relative inline-block">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-2xl opacity-40 animate-pulse" />
                    <div className="relative inline-flex items-center justify-center p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl shadow-2xl border border-zinc-800/50">
                        <Car className="text-white w-12 h-12" strokeWidth={1.5} />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                            AutoToll
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 ml-3">
                            AI
                        </span>
                    </h1>
                    <p className="text-zinc-500 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                        Next-generation intelligent toll collection and vehicle management
                    </p>
                </div>

                {/* Feature pills */}
                <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-full text-xs text-zinc-400">
                        <Sparkles size={14} className="text-amber-400" />
                        AI-Powered Detection
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-full text-xs text-zinc-400">
                        <Zap size={14} className="text-emerald-400" />
                        Real-time Processing
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/50 rounded-full text-xs text-zinc-400">
                        <Lock size={14} className="text-blue-400" />
                        Secure Payments
                    </div>
                </div>
            </div>

            {/* Role Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl z-10">
                {/* Admin Card */}
                <div
                    onClick={() => setShowAdminLogin(true)}
                    onMouseEnter={() => setHoveredCard('admin')}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="group relative cursor-pointer"
                >
                    {/* Hover glow */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl transition-opacity duration-500 ${hoveredCard === 'admin' ? 'opacity-30' : 'opacity-0'}`} />

                    <div className="relative bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 hover:border-blue-500/30 rounded-3xl p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/30 overflow-hidden">
                        {/* Corner accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />

                        {/* Icon badge */}
                        <div className="absolute top-6 right-6 p-2.5 bg-zinc-800/80 rounded-xl text-zinc-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all duration-300">
                            <ShieldCheck size={22} />
                        </div>

                        {/* Main icon */}
                        <div className="mb-8">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 to-indigo-500/30 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-2xl -rotate-3 group-hover:-rotate-6 transition-transform duration-500" />
                                <div className="relative w-full h-full bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform duration-500">
                                    <ShieldCheck className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Administrator</h3>
                            <p className="text-zinc-500 leading-relaxed">
                                Full dashboard access with real-time monitoring, vehicle registry management, and comprehensive analytics.
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="mt-8 flex items-center gap-2 text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-20px] group-hover:translate-x-0">
                            <span>Access Dashboard</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Owner Card */}
                <div
                    onClick={() => onLogin('owner')}
                    onMouseEnter={() => setHoveredCard('owner')}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="group relative cursor-pointer"
                >
                    {/* Hover glow */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur-xl transition-opacity duration-500 ${hoveredCard === 'owner' ? 'opacity-30' : 'opacity-0'}`} />

                    <div className="relative bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-800/50 hover:border-emerald-500/30 rounded-3xl p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/30 overflow-hidden">
                        {/* Corner accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />

                        {/* Icon badge */}
                        <div className="absolute top-6 right-6 p-2.5 bg-zinc-800/80 rounded-xl text-zinc-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300">
                            <User size={22} />
                        </div>

                        {/* Main icon */}
                        <div className="mb-8">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 to-teal-500/30 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 rounded-2xl -rotate-3 group-hover:-rotate-6 transition-transform duration-500" />
                                <div className="relative w-full h-full bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform duration-500">
                                    <Car className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Vehicle Owner</h3>
                            <p className="text-zinc-500 leading-relaxed">
                                Manage your vehicle registration, view toll history, check balance, and make secure payments.
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="mt-8 flex items-center gap-2 text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-20px] group-hover:translate-x-0">
                            <span>Open Portal</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 text-zinc-600 text-sm z-10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>System Online</span>
                <span className="mx-2">•</span>
                <span>&copy; {new Date().getFullYear()} AutoToll AI</span>
            </div>

            {/* Admin Login Modal */}
            {showAdminLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
                    {/* Modal glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]" />

                    <div className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/50 rounded-3xl w-full max-w-md p-10 shadow-2xl">
                        {/* Header gradient */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-3xl" />

                        <button
                            onClick={() => { setShowAdminLogin(false); setError(''); }}
                            className="absolute top-5 right-5 p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center mb-8">
                            <div className="relative mb-5">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-lg" />
                                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                    <ShieldCheck className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Admin Access</h2>
                            <p className="text-zinc-500 text-sm mt-2">Secure authentication required</p>
                        </div>

                        <form onSubmit={handleAdminLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Username</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 pl-12 py-3.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-700 transition-all placeholder:text-zinc-600"
                                        placeholder="Enter username"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 pl-12 py-3.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 hover:border-zinc-700 transition-all placeholder:text-zinc-600"
                                        placeholder="Enter password"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                                    <X size={16} />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 group mt-2"
                            >
                                <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                Sign In
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
