import React, { useState, useEffect } from 'react';
import { X, Save, Upload, CheckCircle, AlertCircle, Loader2, User, Car, Phone } from 'lucide-react';
import { getBackendUrl } from '../services/apiConfig';

interface RegistryModalProps {
    isOpen: boolean;
    onClose: () => void;
    editItem?: any;
    onSuccess: () => void;
}

export function RegistryModal({ isOpen, onClose, editItem, onSuccess }: RegistryModalProps) {
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [plate, setPlate] = useState("");
    const [model, setModel] = useState("");
    const [vehicleType, setVehicleType] = useState("Car");
    const [photo, setPhoto] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (editItem) {
            setName(editItem.owner_name || "");
            setContact(editItem.contact_info || "");
            setPlate(editItem.license_plate);
            setModel(editItem.make_model);
            setVehicleType(editItem.vehicle_type || "Car");
            setPhoto(null);
            setPreview(editItem.owner_photo ? `${getBackendUrl()}${editItem.owner_photo}` : null);
        } else {
            resetForm();
        }
        setStatus(null);
    }, [editItem, isOpen]);

    const resetForm = () => {
        setName("");
        setContact("");
        setPlate("");
        setModel("");
        setVehicleType("Car");
        setPhoto(null);
        setPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('contact_info', contact);
            formData.append('license_plate', plate.toUpperCase());
            formData.append('make_model', model);
            formData.append('vehicle_type', vehicleType);
            if (photo) formData.append('photo', photo);

            // If editing, we update vehicle. Wait, API structure:
            // PUT /api/vehicles/{id} updates vehicle AND owner info linked to it.
            const url = editItem
                ? `${getBackendUrl()}/api/vehicles/${editItem.id}`
                : `${getBackendUrl()}/api/register`;

            const method = editItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                body: formData
            });

            if (res.ok) {
                setStatus({ type: 'success', text: editItem ? "Updated successfully" : "Registered successfully" });
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1000);
            } else {
                const err = await res.json();
                setStatus({ type: 'error', text: err.detail || "Operation failed" });
            }
        } catch (e) {
            setStatus({ type: 'error', text: "Network error" });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">{editItem ? 'Edit Registration' : 'New Registration'}</h2>
                        <p className="text-sm text-zinc-500">Enter owner and vehicle details below.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    <form id="registry-form" onSubmit={handleSubmit} className="space-y-8">

                        {/* Owner Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Owner Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Full Name</label>
                                    <input
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Contact Number (Indian Only)</label>
                                    <input
                                        required
                                        type="tel"
                                        pattern="^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$"
                                        title="Please enter a valid 10-digit Indian phone number (e.g., +91 9876543210 or 9876543210)"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="+91 98765 43210"
                                        value={contact}
                                        onChange={e => setContact(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div className="flex items-center gap-6 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 border-dashed">
                                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-700">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} className="text-zinc-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white mb-1">Owner Photo</p>
                                    <p className="text-xs text-zinc-500 mb-3">Upload clear face photo for verification</p>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm cursor-pointer transition-colors">
                                        <Upload size={14} />
                                        <span>Choose File</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) {
                                                    setPhoto(f);
                                                    setPreview(URL.createObjectURL(f));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5" />

                        {/* Vehicle Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <Car size={14} /> Vehicle Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">License Plate</label>
                                    <input
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono uppercase focus:border-emerald-500 focus:outline-none transition-colors"
                                        placeholder="KA 01 AB 1234"
                                        value={plate}
                                        onChange={e => setPlate(e.target.value.toUpperCase())}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Make & Model</label>
                                    <input
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                        placeholder="Toyota Innova"
                                        value={model}
                                        onChange={e => setModel(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Vehicle Type</label>
                                <select
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors cursor-pointer"
                                    value={vehicleType}
                                    onChange={e => setVehicleType(e.target.value)}
                                >
                                    <option value="Car">Car</option>
                                    <option value="Motorcycle">Motorcycle</option>
                                    <option value="Bus">Bus</option>
                                    <option value="Truck">Truck</option>
                                    <option value="Van">Van</option>
                                </select>
                            </div>
                        </div>

                        {status && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                <span className="font-medium text-sm">{status.text}</span>
                            </div>
                        )}

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-zinc-900 sticky bottom-0 z-10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-zinc-400 hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        form="registry-form"
                        disabled={loading}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {editItem ? 'Save Changes' : 'Register Vehicle'}
                    </button>
                </div>

            </div>
        </div>
    );
}
