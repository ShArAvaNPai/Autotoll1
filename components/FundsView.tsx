import React, { useState, useEffect } from 'react';
import { Wallet, Search, TrendingUp, TrendingDown, History, MoreHorizontal, User, Car } from 'lucide-react';
import { getBackendUrl } from '../services/apiConfig';
import { FundsAdjustmentModal } from './FundsAdjustmentModal';
import { TransactionHistoryModal } from './TransactionHistoryModal';

const API_BASE = getBackendUrl();

export function FundsView() {
    const [owners, setOwners] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Modals
    const [adjustmentModal, setAdjustmentModal] = useState<{ open: boolean, owner: any | null }>({ open: false, owner: null });
    const [historyModal, setHistoryModal] = useState<{ open: boolean, owner: any | null }>({ open: false, owner: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/owners`); // Owners includes balance
            if (res.ok) {
                const data = await res.json();
                setOwners(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredOwners = owners.filter(o =>
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.contact_info && o.contact_info.includes(searchTerm))
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 flex flex-col pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Wallet className="text-green-500" /> Funds Management
                    </h2>
                    <p className="text-zinc-500">Manage balances for {owners.length} registered users</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-green-500 w-64 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Total System Balance Card (Optional Summary) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total User Funds</p>
                    <p className="text-3xl font-black text-white">₹{owners.reduce((acc, curr) => acc + (curr.balance || 0), 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-900/80 border-b border-white/5 text-xs text-zinc-500 uppercase tracking-widest font-bold">
                        <tr>
                            <th className="p-6">User</th>
                            <th className="p-6">Contact</th>
                            <th className="p-6">Current Balance</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredOwners.map(owner => (
                            <tr key={owner.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 text-zinc-500">
                                            <User size={18} />
                                        </div>
                                        <span className="font-bold text-white text-sm">{owner.name}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-zinc-400">{owner.contact_info || "-"}</td>
                                <td className="p-6">
                                    <div className={`font-mono font-bold text-lg ${owner.balance < 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        ₹{owner.balance.toLocaleString()}
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setAdjustmentModal({ open: true, owner })}
                                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold border border-white/5 transition-colors"
                                        >
                                            Adjust
                                        </button>
                                        <button
                                            onClick={() => setHistoryModal({ open: true, owner })}
                                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg border border-white/5 transition-colors"
                                            title="View History"
                                        >
                                            <History size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredOwners.length === 0 && (
                    <div className="p-12 text-center text-zinc-500">No users found matching your search.</div>
                )}
            </div>

            {adjustmentModal.owner && (
                <FundsAdjustmentModal
                    isOpen={adjustmentModal.open}
                    onClose={() => setAdjustmentModal({ open: false, owner: null })}
                    ownerId={adjustmentModal.owner.id}
                    ownerName={adjustmentModal.owner.name}
                    onSuccess={loadData}
                />
            )}

            {historyModal.owner && (
                <TransactionHistoryModal
                    isOpen={historyModal.open}
                    onClose={() => setHistoryModal({ open: false, owner: null })}
                    ownerId={historyModal.owner.id}
                    ownerName={historyModal.owner.name}
                />
            )}
        </div>
    );
}
