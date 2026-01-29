import React, { useState } from 'react';
import { X, CreditCard, ChevronRight, Coins, Wallet } from 'lucide-react';
import { getBackendUrl } from '../services/apiConfig';

interface AdminTopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminTopUpModal({ isOpen, onClose }: AdminTopUpModalProps) {
    const [plate, setPlate] = useState('');
    const [amount, setAmount] = useState(100);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleTopUp = async () => {
        if (!plate || !amount) {
            alert("Please enter both license plate and amount");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('license_plate', plate.toUpperCase());
            formData.append('amount', amount.toString());

            const res = await fetch(`${getBackendUrl()}/api/owner/add_balance`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                alert(`Successfully added ₹${amount} to ${plate.toUpperCase()}. New Balance: ₹${data.new_balance}`);
                setPlate('');
                setAmount(100);
                onClose();
            } else {
                alert(data.detail || "Failed to add balance");
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                        <Coins className="text-blue-500" size={24} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Admin Top-Up</h2>
                    <p className="text-zinc-500 text-sm mb-6">Manually add funds to any registered vehicle account.</p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">License Plate</label>
                            <input
                                type="text"
                                value={plate}
                                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                placeholder="KA 20 AB 1234"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono placeholder:text-zinc-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-3 text-white font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleTopUp}
                            disabled={loading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    <span>Add Funds</span>
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
