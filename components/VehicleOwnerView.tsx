import React, { useState } from 'react';
import { Car, Search, CheckCircle, AlertCircle, Calendar, CreditCard, ArrowLeft, Clock, MapPin, Shield, Activity, ChevronRight, User, X, Mail, Phone, ExternalLink, History } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { getBackendUrl } from '../services/apiConfig';

interface VehicleOwnerViewProps {
    onBack: () => void;
}

export function VehicleOwnerView({ onBack }: VehicleOwnerViewProps) {
    const [plate, setPlate] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPayModal, setShowPayModal] = useState(false);
    const [showUnregisteredModal, setShowUnregisteredModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'activity' | 'financials'>('activity');
    const [transactions, setTransactions] = useState<any[]>([]);
    React.useEffect(() => {
        console.log("VehicleOwnerView mounted");
        console.log("Window Location:", window.location.href);
        console.log("Hostname:", window.location.hostname);
        console.log("Backend URL determined as:", getBackendUrl());
    }, []);

    React.useEffect(() => {
        if (result && activeTab === 'financials') {
            fetchTransactions();
        }
    }, [result, activeTab]);

    const fetchTransactions = async () => {
        if (!result?.owner?.id) return;
        try {
            const url = `${getBackendUrl()}/api/owners/${result.owner.id}/transactions`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (e) {
            console.error("Failed to fetch transactions", e);
        }
    };


    const handleCheck = async (e?: React.FormEvent, manualPlate?: string) => {
        if (e) e.preventDefault();
        const searchPlate = manualPlate || plate;
        console.log("handleCheck triggered for plate:", searchPlate);
        if (!searchPlate) return;

        setLoading(true);
        setError("");
        setResult(null);
        setShowUnregisteredModal(false);

        try {
            const sanitizedPlate = searchPlate.trim().replace(/\s+/g, '').toUpperCase();
            const url = `${getBackendUrl()}/api/vehicle/status/${sanitizedPlate}`;

            console.log("Searching for vehicle:", sanitizedPlate, "at", url);

            const res = await fetch(url);
            console.log("Response status:", res.status, res.ok);

            if (res.ok) {
                const data = await res.json();
                console.log("Data received:", data);
                if (data.found) {
                    setResult(data);
                    console.log("Result state updated with data");
                } else {
                    console.log("Vehicle not found in database");
                    setPlate(sanitizedPlate);
                    setShowUnregisteredModal(true);
                }
            } else {
                const errorText = await res.text();
                console.error("Fetch failed with status:", res.status, errorText);
                setError(`Could not fetch details (Status: ${res.status}). Please check the License Plate.`);
            }
        } catch (e: any) {
            console.error("Search Error:", e);
            setError(`Network Error: ${e.message || "Is the backend running?"}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (amount: number) => {
        setShowPayModal(false);
        setResult((prev: any) => ({
            ...prev,
            balance: (prev.balance || 0) + amount
        }));
    };

    return (
        <div className="min-h-screen bg-black text-zinc-100 overflow-x-hidden relative">
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onBack}
                            className="p-2.5 text-zinc-500 hover:text-white transition-all rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="font-bold text-xl tracking-tight flex items-center gap-3">
                            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                                <Car className="text-emerald-500" size={20} />
                            </div>
                            <span className="bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">Owner Portal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {result && (
                            <button
                                onClick={() => {
                                    setResult(null);
                                    setPlate("");
                                }}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                                <Search size={14} />
                                Change Vehicle
                            </button>
                        )}
                        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-500 font-medium">
                            <span className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 rounded-full border border-white/5">
                                <Shield size={14} className="text-emerald-500" />
                                Secure Access
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                {!result ? (
                    <div className="max-w-xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="text-center space-y-6 mb-12">
                            <div className="inline-flex items-center justify-center p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-3xl mb-4 ring-1 ring-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                                <Shield className="text-emerald-400" size={48} />
                            </div>
                            <div>
                                <h2 className="text-4xl font-bold text-white tracking-tight mb-3">Welcome Back</h2>
                                <p className="text-zinc-400 text-lg">Enter your vehicle's license plate to manage your toll account.</p>
                            </div>
                        </div>

                        <form onSubmit={(e) => handleCheck(e)} className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[21px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={24} />
                                <input
                                    type="text"
                                    required
                                    placeholder="MH12 AB 1234"
                                    value={plate}
                                    autoFocus
                                    onChange={e => setPlate(e.target.value.toUpperCase())}
                                    className="w-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-[20px] py-6 pl-16 pr-8 text-2xl text-center font-mono placeholder:font-sans placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !plate}
                                    className="absolute right-3 top-3 bottom-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group/btn shadow-lg shadow-emerald-900/40"
                                >
                                    {loading ? <Clock className="animate-spin" /> : (
                                        <>
                                            <span>Continue</span>
                                            <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                Try Sample Plate: <button type="button" onClick={() => handleCheck(undefined, "KA20HP2405")} className="text-emerald-500/50 hover:text-emerald-400 transition-colors">KA20HP2405</button>
                            </p>
                        </div>

                        {error && (
                            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center justify-center gap-3 animate-in fade-in zoom-in-95">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                        {/* Top Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col justify-between group overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Total Balance</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-medium text-emerald-500">₹</span>
                                        <span className="text-6xl font-bold text-white tracking-tighter">{result.balance || 0}</span>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center gap-4 relative z-10">
                                    <button
                                        onClick={() => {
                                            console.log("Pay Now Clicked");
                                            setShowPayModal(true);
                                        }}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 group/pay"
                                    >
                                        <CreditCard size={18} />
                                        Pay Now
                                        <ChevronRight size={16} className="group-hover/pay:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
                                <div>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Pending Dues</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-medium text-zinc-500">₹</span>
                                        <span className="text-4xl font-bold text-white tracking-tight">{result.total_due || 0}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 mt-4 flex items-center gap-2">
                                    <InfoIcon size={14} className="text-zinc-400" />
                                    Next deduction in 24h
                                </p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
                                <div>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Total Scans</p>
                                    <div className="text-4xl font-bold text-white tracking-tight">{result.history_count || 0}</div>
                                </div>
                                <div className="mt-4 flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 first:bg-emerald-500/20 first:border-emerald-500/50">
                                            {i === 1 ? <CheckCircle size={12} className="text-emerald-500" /> : i}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Profile and Vehicle Details */}
                            <div className="lg:col-span-4 space-y-8">
                                {/* Owner Profile Card */}
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 overflow-hidden relative group">
                                    <div className="flex flex-col items-center text-center space-y-6">
                                        <div className="relative">
                                            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
                                            <div className="relative w-32 h-32 rounded-[2.5rem] bg-zinc-800 border-4 border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                                                {result.owner?.photo_path ? (
                                                    <img
                                                        src={`${getBackendUrl()}${result.owner.photo_path}`}
                                                        alt={result.owner?.name || "Owner"}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <User size={48} className="text-zinc-600" />
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-2">{result.owner?.name || "Premium User"}</h3>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">Verified Owner</span>
                                                <span className="px-3 py-1 bg-white/5 text-zinc-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">ID: #{result.owner?.id || result.vehicle?.owner_id || "77"}</span>
                                            </div>
                                        </div>

                                        {result.owner && (
                                            <div className="w-full space-y-4 pt-4 border-t border-white/5">
                                                <div className="flex items-center gap-4 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 transition-colors hover:bg-white/10">
                                                    <Phone className="text-zinc-500 shrink-0" size={18} />
                                                    <div className="text-left">
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Phone</p>
                                                        <p className="text-sm font-medium text-zinc-200">{result.owner?.contact_info || "Not shared"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 transition-colors hover:bg-white/10">
                                                    <Mail className="text-zinc-500 shrink-0" size={18} />
                                                    <div className="text-left">
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Email</p>
                                                        <p className="text-sm font-medium text-zinc-200">{(result.owner?.name || "User").toLowerCase().replace(/ /g, '.')}@autotoll.ai</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Vehicle Identity Card */}
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:scale-110 transition-transform">
                                            <Car size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Vehicle Identity</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">License Plate</p>
                                            <p className="text-3xl font-mono font-bold text-white tracking-widest">{result.vehicle?.license_plate}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Make & Model</p>
                                                <p className="text-sm font-bold text-zinc-200">{result.vehicle?.make_model}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Reg. Date</p>
                                                <p className="text-sm font-bold text-zinc-200">
                                                    {result.vehicle?.created_at ? new Date(result.vehicle.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Feed */}
                            <div className="lg:col-span-8 flex flex-col space-y-6">
                                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl flex-1 flex flex-col overflow-hidden">
                                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-xl border border-white/5">
                                                <button
                                                    onClick={() => setActiveTab('activity')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'activity' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                >
                                                    Activity
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('financials')}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'financials' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                >
                                                    Financials
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {activeTab === 'activity' ? (
                                            result.history && result.history.length > 0 ? (
                                                <div className="divide-y divide-white/5">
                                                    {result.history.map((record: any) => (
                                                        <div key={record.id} className="p-6 hover:bg-white/5 transition-colors group">
                                                            <div className="flex items-center gap-6">
                                                                {/* Mini Map/Location Placeholder */}
                                                                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                                                                    {record.image_path ? (
                                                                        <img src={`${getBackendUrl()}${record.image_path}`} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt="Scan" />
                                                                    ) : (
                                                                        <MapPin size={24} />
                                                                    )}
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div>
                                                                            <h4 className="font-bold text-white text-lg">Electronic Toll Gate</h4>
                                                                            <div className="flex items-center gap-3 mt-1">
                                                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                                                    <Clock size={10} />
                                                                                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                                                    <Calendar size={10} />
                                                                                    {new Date(record.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-xl font-bold font-mono text-white">₹{(record.toll_amount || 0).toFixed(2)}</div>
                                                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${record.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-400'}`}>
                                                                                {record.status}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                                        <span>{record.vehicle_type}</span>
                                                                        <span>•</span>
                                                                        <span className="flex items-center gap-1">
                                                                            AI Confidence: {record.confidence ? `${(parseFloat(record.confidence) * 100).toFixed(0)}%` : 'Manual'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 py-20">
                                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                        <History size={32} className="opacity-20" />
                                                    </div>
                                                    <p className="font-medium">No activity history found for this vehicle.</p>
                                                </div>
                                            )
                                        ) : (
                                            transactions.length > 0 ? (
                                                <div className="divide-y divide-white/5">
                                                    {transactions.map((tx: any) => (
                                                        <div key={tx.id} className="p-6 hover:bg-white/5 transition-colors">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`p-3 rounded-full ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                        {tx.amount > 0 ? <CreditCard size={20} /> : <Activity size={20} />}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-white text-base">{tx.description}</h4>
                                                                        <p className="text-xs text-zinc-500">{new Date(tx.timestamp).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                                <div className={`text-lg font-bold font-mono ${tx.amount > 0 ? 'text-emerald-500' : 'text-white'}`}>
                                                                    {tx.amount > 0 ? '+' : ''}₹{tx.amount}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 py-20">
                                                    <p className="font-medium">No financial transactions found.</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showPayModal && (
                            <PaymentModal
                                plate={result.vehicle?.license_plate || plate}
                                initialAmount={(result.total_due > 0 ? result.total_due : 100)}
                                onClose={() => setShowPayModal(false)}
                                onSuccess={handlePaymentSuccess}
                            />
                        )}

                        {/* Unregistered Vehicle Modal */}
                        {showUnregisteredModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                                <div className="bg-zinc-900 border border-white/10 rounded-[32px] w-full max-w-sm p-10 relative shadow-2xl overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-red-500" />
                                    <button
                                        onClick={() => setShowUnregisteredModal(false)}
                                        className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-full hover:rotate-90"
                                    >
                                        <X size={20} />
                                    </button>

                                    <div className="flex flex-col items-center text-center space-y-6">
                                        <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center border border-amber-500/20 shadow-2xl shadow-amber-500/10 group-hover:scale-110 transition-transform duration-500">
                                            <AlertCircle size={40} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-3">Not Registered</h3>
                                            <p className="text-zinc-400 text-sm leading-relaxed">
                                                The license plate <span className="text-white font-mono font-bold bg-white/10 px-2 py-0.5 rounded">{plate}</span> is not found in our registry. Please contact admin for registration.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowUnregisteredModal(false)}
                                            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all shadow-xl active:scale-95"
                                        >
                                            Got it
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 6px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background: rgba(255, 255, 255, 0.05);
                                border-radius: 10px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: rgba(255, 255, 255, 0.1);
                            }
                        `}} />
                    </div>
                )}
            </main>
        </div>
    );
}

function InfoIcon({ size, className = "" }: { size: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    );
}
