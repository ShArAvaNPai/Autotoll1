import React, { useState, useEffect } from 'react';
import { User, Car, Upload, Save, CheckCircle, AlertCircle, Clock, Search, FileUp } from 'lucide-react';

const API_BASE = "http://localhost:8000";

interface RegistryItem {
    id: number;
    license_plate: string;
    make_model: string;
    owner_id: number;
    owner_name?: string; // We'll map this manually or modify API to return it
}

interface Owner {
    id: number;
    name: string;
}

interface RegistryProps {
    initialPlate?: string;
}

export function Registry({ initialPlate }: RegistryProps) {
    const [vehicles, setVehicles] = useState<RegistryItem[]>([]);
    const [owners, setOwners] = useState<Owner[]>([]);

    // History State
    const [expandedVehicleId, setExpandedVehicleId] = useState<number | null>(null);
    const [vehicleHistories, setVehicleHistories] = useState<Record<number, any[]>>({});
    const [loadingHistory, setLoadingHistory] = useState<Record<number, boolean>>({});

    // Form State
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [plate, setPlate] = useState(initialPlate || "");
    const [model, setModel] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);

    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (initialPlate) {
            setPlate(initialPlate);
        }
    }, [initialPlate]);

    const loadData = async () => {
        try {
            const [vRes, oRes] = await Promise.all([
                fetch(`${API_BASE}/api/vehicles`),
                fetch(`${API_BASE}/api/owners`)
            ]);

            if (vRes.ok && oRes.ok) {
                const vData = await vRes.json();
                const oData = await oRes.json();

                // Map owner names to vehicles
                const mappedVehicles = vData.map((v: any) => ({
                    ...v,
                    owner_name: oData.find((o: any) => o.id === v.owner_id)?.name || "Unknown"
                }));

                setVehicles(mappedVehicles);
                setOwners(oData);
            }
        } catch (e) {
            console.error("Load failed", e);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('contact_info', contact);
            formData.append('license_plate', plate);
            formData.append('make_model', model);
            if (photo) formData.append('photo', photo);

            const res = await fetch(`${API_BASE}/api/register`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setStatus({ type: 'success', text: "Registration Complete" });
                // Reset form
                setName(""); setContact(""); setPlate(""); setModel(""); setPhoto(null);
                loadData();
            } else {
                const err = await res.json();
                setStatus({ type: 'error', text: err.detail || "Registration Failed" });
            }
        } catch (e) {
            setStatus({ type: 'error', text: "Network Error" });
        }
    };

    const toggleHistory = async (vehicleId: number) => {
        if (expandedVehicleId === vehicleId) {
            setExpandedVehicleId(null);
            return;
        }

        setExpandedVehicleId(vehicleId);

        // Load history if not already cached
        if (!vehicleHistories[vehicleId]) {
            setLoadingHistory(prev => ({ ...prev, [vehicleId]: true }));
            try {
                const res = await fetch(`http://localhost:8000/api/vehicles/${vehicleId}/history`);
                if (res.ok) {
                    const data = await res.json();
                    setVehicleHistories(prev => ({ ...prev, [vehicleId]: data }));
                }
            } catch (e) {
                console.error("Failed to load history", e);
            } finally {
                setLoadingHistory(prev => ({ ...prev, [vehicleId]: false }));
            }
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setStatus(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_BASE}/api/import`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setStatus({
                    type: 'success',
                    text: `Import complete: ${data.imported} success, ${data.failed} failed.`
                });
                loadData();
            } else {
                const err = await res.json();
                setStatus({ type: 'error', text: err.detail || "Import failed" });
            }
        } catch (e) {
            setStatus({ type: 'error', text: "Network error during import" });
        } finally {
            setImporting(false);
            // Clear input
            e.target.value = '';
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto py-8 space-y-12">

            {/* Header */}
            <div>
                <h2 className="text-3xl font-light text-zinc-100 mb-2">Registry</h2>
                <p className="text-zinc-500 font-light">Manage vehicle access and owner database.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Registration Form */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-zinc-300 flex items-center gap-2">
                            New Registration
                        </h3>

                        <form onSubmit={handleRegister} className="space-y-5">
                            {/* Owner Section */}
                            <div className="space-y-4 pt-2">
                                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold pl-1">Owner Details</label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    className="w-full bg-transparent border-b border-zinc-700 py-3 px-2 text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Contact Info (Phone/Email)"
                                    required
                                    className="w-full bg-transparent border-b border-zinc-700 py-3 px-2 text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                                    value={contact}
                                    onChange={e => setContact(e.target.value)}
                                />
                                <div className="pt-2">
                                    <label htmlFor="photo-upload" className="flex items-center gap-3 cursor-pointer group">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700 transition-colors">
                                            {photo ? <CheckCircle size={18} className="text-emerald-500" /> : <Upload size={18} />}
                                        </div>
                                        <span className={`text-sm ${photo ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                            {photo ? photo.name : "Upload Owner Photo"}
                                        </span>
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => e.target.files && setPhoto(e.target.files[0])}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Vehicle Section */}
                            <div className="space-y-4 pt-6">
                                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold pl-1">Vehicle Details</label>
                                <input
                                    type="text"
                                    placeholder="License Plate (e.g. ABC-1234)"
                                    required
                                    className="w-full bg-transparent border-b border-zinc-700 py-3 px-2 text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 font-mono"
                                    value={plate}
                                    onChange={e => setPlate(e.target.value.toUpperCase())}
                                />
                                <input
                                    type="text"
                                    placeholder="Make & Model"
                                    required
                                    className="w-full bg-transparent border-b border-zinc-700 py-3 px-2 text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                                    value={model}
                                    onChange={e => setModel(e.target.value)}
                                />
                            </div>

                            {/* Status Message */}
                            {status && (
                                <div className={`text-sm flex items-center gap-2 ${status.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {status.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                    {status.text}
                                </div>
                            )}

                            <button className="mt-4 px-6 py-3 bg-zinc-100 text-zinc-900 rounded font-medium hover:bg-white transition-colors w-full flex items-center justify-center gap-2">
                                <Save size={16} />
                                Register Entry
                            </button>
                        </form>
                    </div>
                </div>

                {/* List View */}
                <div className="lg:col-span-7 border-l border-zinc-800 lg:pl-12 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-zinc-300">Database</h3>
                        <div className="flex items-center gap-3">
                            <label className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${importing ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'}`}>
                                <FileUp size={14} />
                                {importing ? 'Importing...' : 'Import CSV/Excel'}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".csv, .xlsx, .xls"
                                    onChange={handleImport}
                                    disabled={importing}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by plate or owner..."
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-zinc-700 transition-colors placeholder:text-zinc-600"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        {filteredVehicles.length === 0 ? (
                            <p className="text-zinc-600 font-light italic">No entries found.</p>
                        ) : (
                            filteredVehicles.map(v => (
                                <div key={v.id} className="group flex flex-col justify-between py-4 border-b border-zinc-900 hover:bg-zinc-900/50 px-4 -mx-4 rounded transition-colors">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4">
                                            <div className="font-mono text-sm text-zinc-400 bg-zinc-900 px-2 py-1 rounded">
                                                {v.license_plate}
                                            </div>
                                            <div>
                                                <p className="text-zinc-200 font-medium">{v.make_model}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                            <User size={14} />
                                            <span>{v.owner_name}</span>

                                            {/* History Toggle */}
                                            <button
                                                onClick={() => toggleHistory(v.id)}
                                                className="ml-4 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20"
                                            >
                                                <Clock size={12} />
                                                {expandedVehicleId === v.id ? 'Hide History' : 'View History'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* History Expansion */}
                                    {expandedVehicleId === v.id && (
                                        <div className="bg-zinc-900/30 -mx-4 px-4 py-4 mt-2 border-t border-zinc-900">
                                            {loadingHistory[v.id] ? (
                                                <div className="text-xs text-zinc-500 text-center py-2 animate-pulse">Loading history...</div>
                                            ) : vehicleHistories[v.id]?.length > 0 ? (
                                                <div className="space-y-3 pl-12">
                                                    <h5 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Recent Activity</h5>
                                                    {vehicleHistories[v.id].map((log: any) => (
                                                        <div key={log.id} className="flex items-center justify-between text-xs bg-zinc-950 p-2 rounded border border-zinc-900">
                                                            <span className="text-zinc-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`px-1.5 py-0.5 rounded ${log.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                                    {log.status === 'verified' ? 'Verified' : 'Pending Review'}
                                                                </span>
                                                                <span className="font-medium text-zinc-300 font-mono">₹{log.toll_amount}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-zinc-500 italic text-center py-2">No detection history found for this vehicle.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
