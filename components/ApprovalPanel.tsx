import React, { useState, useEffect } from 'react';
import { Check, X, Edit2, AlertTriangle, CreditCard, Banknote } from 'lucide-react';
import { AnalysisResult } from '../types';
import { approveDetection } from '../services/api';

interface ApprovalPanelProps {
    result: AnalysisResult | null;
    onApprove: () => void;
    onCancel: () => void;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ result, onApprove, onCancel }) => {
    const [plate, setPlate] = useState(result?.licensePlate || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setPlate(result?.licensePlate || '');
    }, [result]);

    if (!result) return null;

    const isRegistered = result.ownerInfo?.isRegistered;
    const balance = result.ownerInfo?.balance || 0;
    const tollAmount = result.tollAmount || 0;
    const canDeduct = isRegistered && balance >= tollAmount;

    const handleProcess = async (method: 'account' | 'cash') => {
        setIsProcessing(true);
        setError(null);
        try {
            await approveDetection(Number(result.id), method, plate !== result.licensePlate ? plate : undefined);
            onApprove();
        } catch (err: any) {
            setError(err.message || "Failed to process");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" size={18} />
                    Pending Approval
                </h3>
                {error && <span className="text-xs text-red-400">{error}</span>}
            </div>

            {/* Plate Edition */}
            <div className="flex items-center gap-3 mb-6 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                <div className="text-xs text-zinc-500 font-mono">PLATE</div>
                {isEditing ? (
                    <input
                        type="text"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        className="bg-transparent border-b border-blue-500 text-xl font-bold font-mono text-white focus:outline-none w-32"
                        autoFocus
                        onBlur={() => setIsEditing(false)}
                    />
                ) : (
                    <div className="text-xl font-bold font-mono text-white flex-1">{plate}</div>
                )}
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
                >
                    <Edit2 size={14} />
                </button>
            </div>

            {/* Owner Info / Balance */}
            {isRegistered ? (
                <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-blue-300 font-medium">{result.ownerInfo?.name}</span>
                        <span className={`text-lg font-bold ${canDeduct ? 'text-emerald-400' : 'text-red-400'}`}>
                            ₹{balance.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                        <span>Wallet Balance</span>
                        <span>Toll: ₹{tollAmount}</span>
                    </div>
                </div>
            ) : (
                <div className="mb-6 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center gap-2 text-zinc-400 text-sm">
                    <AlertTriangle size={14} />
                    Unregistered Vehicle
                </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => handleProcess('account')}
                    disabled={!canDeduct || isProcessing}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all
                        ${canDeduct
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                >
                    {isProcessing ? 'Processing...' : (
                        <>
                            <CreditCard size={16} />
                            Approve & Deduct
                        </>
                    )}
                </button>

                <button
                    onClick={() => handleProcess('cash')}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
                >
                    <Banknote size={16} />
                    Collect Cash
                </button>
            </div>
        </div>
    );
};
