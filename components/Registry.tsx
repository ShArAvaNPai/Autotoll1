import React, { useState, useEffect } from 'react';
import { User, Car, Upload, Save, CheckCircle, AlertCircle, Clock, Search, FileUp, Plus, Edit, Trash2, Shield, MoreVertical, Loader2 } from 'lucide-react';
import { getBackendUrl } from '../services/apiConfig';
import { RegistryModal } from './RegistryModal';

const API_BASE = getBackendUrl();

interface RegistryItem {
    id: number;
    license_plate: string;
    make_model: string;
    vehicle_type?: string;
    owner_id: number;
    owner_name?: string;
    contact_info?: string;
    owner_photo?: string;
}

interface RegistryProps {
    initialPlate?: string;
}

export function Registry({ initialPlate }: RegistryProps) {
    const [vehicles, setVehicles] = useState<RegistryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<RegistryItem | null>(null);

    // History
    const [expandedVehicleId, setExpandedVehicleId] = useState<number | null>(null);
    const [vehicleHistories, setVehicleHistories] = useState<Record<number, any[]>>({});
    const [loadingHistory, setLoadingHistory] = useState<Record<number, boolean>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [vRes, oRes] = await Promise.all([
                fetch(`${API_BASE}/api/vehicles`),
                fetch(`${API_BASE}/api/owners`)
            ]);

            if (vRes.ok && oRes.ok) {
                const vData = await vRes.json();
                const oData = await oRes.json();

                const mappedVehicles = vData.map((v: any) => {
                    const owner = oData.find((o: any) => String(o.id) === String(v.owner_id));
                    return {
                        ...v,
                        owner_name: owner?.name || "Unknown",
                        contact_info: owner?.contact_info || "",
                        owner_photo: owner?.photo_path || ""
                    };
                });
                setVehicles(mappedVehicles);
            }
        } catch (e) {
            console.error("Load failed", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this registration? This cannot be undone.")) return;
        try {
            const res = await fetch(`${API_BASE}/api/vehicles/${id}`, { method: 'DELETE' });
            if (res.ok) loadData();
        } catch (e) {
            alert("Delete failed");
        }
    };

    const toggleHistory = async (vehicleId: number) => {
        if (expandedVehicleId === vehicleId) {
            setExpandedVehicleId(null);
            return;
        }
        setExpandedVehicleId(vehicleId);

        if (!vehicleHistories[vehicleId]) {
            setLoadingHistory(prev => ({ ...prev, [vehicleId]: true }));
            try {
                const res = await fetch(`${API_BASE}/api/vehicles/${vehicleId}/history`);
                if (res.ok) {
                    const data = await res.json();
                    setVehicleHistories(prev => ({ ...prev, [vehicleId]: data }));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingHistory(prev => ({ ...prev, [vehicleId]: false }));
            }
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 flex flex-col">

            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Vehicle Registry</h2>
                    <p className="text-zinc-500">Manage {vehicles.length} registered vehicles</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search registry..."
                            className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500 w-64 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setEditItem(null); setShowModal(true); }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                    >
                        <Plus size={16} />
                        Add Vehicle
                    </button>
                </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {filteredVehicles.map(v => (
                    <div key={v.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 hover:bg-zinc-900 hover:border-white/10 transition-all group relative overflow-hidden">

                        {/* Status Stripe */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-50" />

                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center border border-white/5">
                                    {v.owner_photo ? (
                                        <img src={`${API_BASE}${v.owner_photo}`} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <User size={20} className="text-zinc-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{v.owner_name}</h3>
                                    <p className="text-xs text-zinc-500 font-mono tracking-wide">ID: {v.owner_id}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setEditItem(v); setShowModal(true); }}
                                    className="p-2 hover:bg-blue-500/10 hover:text-blue-400 text-zinc-500 rounded-lg transition-colors"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(v.id)}
                                    className="p-2 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Vehicle Type</p>
                                        <p className="text-zinc-300 font-medium text-sm">{v.vehicle_type || 'Car'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Plate</p>
                                        <p className="text-white font-mono font-bold tracking-wider">{v.license_plate}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/5">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Make & Model</p>
                                    <p className="text-zinc-300 font-medium text-sm">{v.make_model}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleHistory(v.id)}
                                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${expandedVehicleId === v.id ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'}`}
                            >
                                <Clock size={14} />
                                {expandedVehicleId === v.id ? 'Hide History' : 'View History'}
                            </button>

                            {expandedVehicleId === v.id && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    {loadingHistory[v.id] ? (
                                        <div className="text-center py-4"><Loader2 className="animate-spin mx-auto text-zinc-600" size={16} /></div>
                                    ) : (vehicleHistories[v.id] || []).length > 0 ? (
                                        (vehicleHistories[v.id] || []).slice(0, 3).map((h: any) => (
                                            <div key={h.id} className="flex justify-between items-center text-xs p-2 bg-white/5 rounded-lg border border-white/5">
                                                <span className="text-zinc-400">{new Date(h.timestamp).toLocaleDateString()}</span>
                                                <span className="text-zinc-300">{h.location || 'UDUPI'}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-xs text-zinc-600 py-2">No history</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <RegistryModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                editItem={editItem}
                onSuccess={loadData}
            />
        </div>
    );
}
