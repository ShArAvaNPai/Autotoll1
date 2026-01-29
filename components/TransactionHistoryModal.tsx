import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { getBackendUrl } from '../services/apiConfig';

interface TransactionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    ownerId: number;
    ownerName: string;
}

export function TransactionHistoryModal({ isOpen, onClose, ownerId, ownerName }: TransactionHistoryModalProps) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && ownerId) {
            fetchTransactions();
        }
    }, [isOpen, ownerId]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${getBackendUrl()}/api/owners/${ownerId}/transactions`);
            if (res.ok) {
                setTransactions(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">

                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900 z-10 sticky top-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">Transaction History</h2>
                        <p className="text-sm text-zinc-500">For {ownerName}</p>
                    </div>
                    <button onClick={onClose}><X className="text-zinc-500 hover:text-white" size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {loading ? (
                        <div className="text-center text-zinc-500 py-8">Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center text-zinc-500 py-8">No transactions found.</div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{tx.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-bold uppercase tracking-wider">{tx.type}</span>
                                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                <Calendar size={10} />
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-mono font-bold text-lg ${tx.amount > 0 ? 'text-emerald-400' : 'text-zinc-200'}`}>
                                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
