import React, { useState } from 'react';
import { Car, Search, CheckCircle, AlertCircle, Calendar, CreditCard, ArrowLeft } from 'lucide-react';

interface VehicleOwnerViewProps {
    onBack: () => void;
}

export function VehicleOwnerView({ onBack }: VehicleOwnerViewProps) {
    const [activeTab, setActiveTab] = useState<'register' | 'status'>('status');

    return (
        <div className="min-h-screen bg-black text-zinc-100">
            {/* Header */}
            <div className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-800"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="font-bold text-lg tracking-tight flex items-center gap-2">
                            <Car className="text-emerald-500" size={20} />
                            Owner Portal
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Tabs */}
                <div className="flex p-1 bg-zinc-900 rounded-xl mb-8">
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'status' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Check Payment Status
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'register' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        New Registration
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-light text-white">Payment Status</h2>
                <p className="text-zinc-500">Enter your vehicle's license plate to view outstanding tolls.</p>
            </div>

            <form onSubmit={handleCheck} className="relative max-w-lg mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                    type="text"
                    required
                    placeholder="Enter License Plate (e.g. MH12AB1234)"
                    value={plate}
                    onChange={e => setPlate(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-lg text-center font-mono placeholder:font-sans focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
                <button
                    type="submit"
                    disabled={loading || !plate}
                    className="absolute right-2 top-2 bottom-2 bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '...' : 'Check'}
                </button>
            </form>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {result && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mt-8 space-y-8">
                    {result.found ? (
                        <>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-zinc-800 pb-8">
                                <div>
                                    <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold mb-1">Vehicle</p>
                                    <h3 className="text-3xl font-mono text-white">{result.vehicle.license_plate}</h3>
                                    <p className="text-zinc-400">{result.vehicle.make_model}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold mb-1">Owner</p>
                                    <h3 className="text-xl text-white">{result.owner?.name || "Unknown"}</h3>
                                    <p className="text-zinc-400 text-sm">{result.owner?.contact_info || "No contact info"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-zinc-200">{result.history_count}</div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Trips Recorded</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-emerald-400">₹{result.total_due}</div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Total Payable</div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-900/20">
                                Pay Now
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-8 space-y-4">
                            <div className="inline-block p-4 bg-zinc-800 rounded-full text-zinc-400 mb-2">
                                <Search size={32} />
                            </div>
                            <h3 className="text-xl text-zinc-200">Vehicle Not Registered</h3>
                            <p className="text-zinc-500 max-w-md mx-auto">
                                We couldn't find any details for <strong>{plate}</strong> in our registry. Recent scans might still be processing.
                            </p>
                            <p className="text-sm text-blue-400 cursor-pointer hover:underline">
                                Register this vehicle now &rarr;
                            </p>
                        </div>
                    )}
                </div>
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto">
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
