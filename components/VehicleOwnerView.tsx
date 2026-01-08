import React, { useState } from 'react';
import { Car, Search, CheckCircle, AlertCircle, Calendar, CreditCard, ArrowLeft, Clock, MapPin, Shield, Activity, ChevronRight, User } from 'lucide-react';
import { PaymentModal } from './PaymentModal';

interface VehicleOwnerViewProps {
    onBack: () => void;
}

export function VehicleOwnerView({ onBack }: VehicleOwnerViewProps) {
    const [activeTab, setActiveTab] = useState<'status' | 'register'>('status');

    return (
        <div className="min-h-screen bg-black text-zinc-100">
            {/* Header */}
            <div className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="font-bold text-lg tracking-tight flex items-center gap-2">
                            <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                                <Car className="text-emerald-500" size={20} />
                            </div>
                            <span className="bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Owner Portal</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                            <User size={16} className="text-zinc-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex p-1 bg-zinc-900/50 backdrop-blur rounded-xl mb-8 border border-white/5 w-fit">
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'status' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        My Vehicle
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'register' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Register New
                    </button>
                </div>

                {activeTab === 'status' ? <StatusCheck /> : <OwnerRegistration />}
            </div>
        </div>
    );
}

function StatusCheck() {
    const [plate, setPlate] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPayModal, setShowPayModal] = useState(false);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch(`http://localhost:8000/api/vehicle/status/${plate}`);
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            } else {
                setError("Could not fetch details. Please check the License Plate.");
            }
        } catch (e) {
            setError("Network Error. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setShowPayModal(false);
        setResult((prev: any) => ({
            ...prev,
            total_due: 0
        }));
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!result ? (
                <div className="max-w-xl mx-auto mt-12">
                    <div className="text-center space-y-3 mb-8">
                        <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full mb-2 ring-1 ring-emerald-500/20">
                            <Shield className="text-emerald-500" size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
                        <p className="text-zinc-400">Enter your vehicle's license plate to access your dashboard.</p>
                    </div>

                    <form onSubmit={handleCheck} className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={24} />
                        <input
                            type="text"
                            required
                            placeholder="MH12 AB 1234"
                            value={plate}
                            onChange={e => setPlate(e.target.value.toUpperCase())}
                            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-2xl text-center font-mono placeholder:font-sans focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-xl"
                        />
                        <button
                            type="submit"
                            disabled={loading || !plate}
                            className="absolute right-3 top-3 bottom-3 bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        >
                            {loading ? <Clock className="animate-spin" /> : <ChevronRight size={24} />}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-center gap-2 animate-in fade-in">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 1. Vehicle Card */}
                        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Car size={200} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <p className="text-zinc-500 font-medium uppercase tracking-wider text-xs mb-2">Vehicle Profile</p>
                                        <h2 className="text-4xl font-mono font-bold text-white tracking-tight">{result.vehicle.license_plate}</h2>
                                        <p className="text-xl text-zinc-400 mt-1">{result.vehicle.make_model}</p>
                                    </div>
                                    <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20 flex items-center gap-1">
                                        <Activity size={12} /> Active
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 pt-8 border-t border-white/5">
                                    <div>
                                        <p className="text-zinc-500 text-xs uppercase mb-1">Owner</p>
                                        <p className="text-white font-medium">{result.owner?.name || "Unknown"}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 text-xs uppercase mb-1">Contact</p>
                                        <p className="text-white font-medium">{result.owner?.contact_info || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 text-xs uppercase mb-1">Registered</p>
                                        <p className="text-white font-medium">Jan 2024</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Balance / Payment Card */}
                        <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>

                            <div>
                                <p className="text-zinc-500 font-medium uppercase tracking-wider text-xs mb-2">Current Balance</p>
                                <div className="text-5xl font-bold text-white tracking-tight flex items-start gap-1">
                                    <span className="text-2xl mt-2 text-zinc-500">₹</span>
                                    {result.total_due}
                                </div>
                                <p className="text-zinc-500 text-sm mt-2">
                                    {result.total_due > 0 ? "Outstanding toll charges." : "All caught up! No dues."}
                                </p>
                            </div>

                            <button
                                onClick={() => result.total_due > 0 && setShowPayModal(true)}
                                disabled={result.total_due <= 0}
                                className={`w-full py-4 mt-8 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${result.total_due > 0
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 hover:scale-[1.02]'
                                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    }`}
                            >
                                <CreditCard size={20} />
                                {result.total_due > 0 ? "Pay Now" : "No Dues"}
                            </button>
                        </div>
                    </div>

                    {/* 3. History Timeline (Simulated for Demo) */}
                    <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                            <button className="text-sm text-emerald-400 hover:text-emerald-300">View Full History</button>
                        </div>

                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 group p-4 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5">
                                    <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center border border-zinc-800 text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <h4 className="font-medium text-white">Toll Plaza #{3 - i}</h4>
                                            <span className="text-emerald-400 font-mono">₹50.00</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <p className="text-sm text-zinc-500">NH-48, Lane 2</p>
                                            <p className="text-xs text-zinc-600">Today, {10 + i}:30 AM</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showPayModal && (
                <PaymentModal
                    totalDue={result.total_due}
                    plate={result.vehicle.license_plate}
                    onClose={() => setShowPayModal(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}

function OwnerRegistration() {
    // Simplified version of the main Registry form
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        plate: '',
        model: ''
    });
    const [status, setStatus] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: 'loading', text: 'Registering...' });

        try {
            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('contact_info', formData.contact);
            fd.append('license_plate', formData.plate);
            fd.append('make_model', formData.model);

            const res = await fetch(`http://localhost:8000/api/register`, {
                method: 'POST',
                body: fd
            });

            if (res.ok) {
                setStatus({ type: 'success', text: 'Registration Successful!' });
                setFormData({ name: '', contact: '', plate: '', model: '' });
            } else {
                const err = await res.json();
                setStatus({ type: 'error', text: err.detail || 'Registration Failed' });
            }
        } catch (e) {
            setStatus({ type: 'error', text: 'Network Error' });
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto mt-8">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-light text-white">Register Vehicle</h2>
                <p className="text-zinc-500">Join the automated toll network.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800">
                <div className="space-y-4">
                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold pl-1">Personal Info</label>
                    <input
                        type="text"
                        placeholder="Full Name"
                        required
                        className="w-full bg-black/50 border border-zinc-800 rounded-lg py-3 px-4 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Phone / Email"
                        required
                        className="w-full bg-black/50 border border-zinc-800 rounded-lg py-3 px-4 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.contact}
                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    />
                </div>

                <div className="space-y-4 pt-4">
                    <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold pl-1">Vehicle Info</label>
                    <input
                        type="text"
                        placeholder="License Plate (e.g. MH12AB1234)"
                        required
                        className="w-full bg-black/50 border border-zinc-800 rounded-lg py-3 px-4 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                        value={formData.plate}
                        onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    />
                    <input
                        type="text"
                        placeholder="Make & Model"
                        required
                        className="w-full bg-black/50 border border-zinc-800 rounded-lg py-3 px-4 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
                        value={formData.model}
                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                    />
                </div>

                {status && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                        status.type === 'error' ? 'bg-red-500/10 text-red-400' : 'text-zinc-400'
                        }`}>
                        {status.type === 'success' ? <CheckCircle size={14} /> : status.type === 'error' ? <AlertCircle size={14} /> : null}
                        {status.text}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors mt-4"
                >
                    Register Vehicle
                </button>
            </form>
        </div>
    );
}
