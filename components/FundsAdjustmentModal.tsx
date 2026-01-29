import React, { useState } from 'react';
import { X, Save, DollarSign, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { getBackendUrl } from '../services/apiConfig';

interface FundsAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    ownerId: number;
    ownerName: string;
    onSuccess: () => void;
}

export function FundsAdjustmentModal({ isOpen, onClose, ownerId, ownerName, onSuccess }: FundsAdjustmentModalProps) {
    const [amount, setAmount] = useState(0);
    const [type, setType] = useState<'add' | 'deduct'>('add');
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('owner_id', ownerId.toString());
            const finalAmount = type === 'add' ? amount : -amount;
            formData.append('amount', finalAmount.toString());
            formData.append('description', reason);

            const res = await fetch(`${getBackendUrl()}/api/admin/adjust_balance`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert("Failed to adjust balance");
            }
        } catch (e) {
            console.error(e);
            alert("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">

                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Adjust Funds</h2>
                    <button onClick={onClose}><X className="text-zinc-500 hover:text-white" size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-zinc-400 mb-4">Adjusting balance for <span className="text-white font-bold">{ownerName}</span></p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button
                                type="button"
                                onClick={() => setType('add')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'add' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                            >
                                <ArrowUpCircle size={24} />
                                <span className="text-xs font-bold uppercase tracking-widest">Add Funds</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('deduct')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'deduct' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                            >
                                <ArrowDownCircle size={24} />
                                <span className="text-xs font-bold uppercase tracking-widest">Deduct</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount (₹)</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={amount}
                                    onChange={e => setAmount(Number(e.target.value))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-lg font-bold focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Reason / Description</label>
                                <input
                                    type="text"
                                    required
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder={type === 'add' ? "e.g. Bonus Credit" : "e.g. Penalty"}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${type === 'add' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'}`}
                    >
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        Confirm Adjustment
                    </button>
                </form>
            </div>
        </div>
    );
}
