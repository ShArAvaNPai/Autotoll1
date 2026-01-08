import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, ShieldCheck, Truck, Loader2, CheckCircle, Wallet } from 'lucide-react';

interface PaymentModalProps {
    totalDue: number;
    plate: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function PaymentModal({ totalDue, plate, onClose, onSuccess }: PaymentModalProps) {
    const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');
    const [method, setMethod] = useState('');

    const handlePay = (methodId: string) => {
        setMethod(methodId);
        setStep('processing');
        // Simulate payment delay
        setTimeout(() => {
            setStep('success');
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Header Gradient */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    {step === 'select' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-white mb-1">Pay Tolls</h3>
                                <p className="text-zinc-400 text-sm">Secure payment for <span className="font-mono text-white">{plate}</span></p>
                                <div className="mt-6 mb-8 flex justify-center items-baseline gap-1">
                                    <span className="text-sm text-zinc-500">Total Due</span>
                                    <span className="text-4xl font-bold text-emerald-400">₹{totalDue}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold pl-1">Select Method</p>
                                <button onClick={() => handlePay('upi')} className="w-full flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-xl transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <Wallet size={20} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="text-white font-medium">UPI / Wallet</div>
                                        <div className="text-xs text-zinc-500">GPay, Paytm, PhonePe</div>
                                    </div>
                                </button>
                                <button onClick={() => handlePay('card')} className="w-full flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 hover:border-blue-500/50 rounded-xl transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                        <CreditCard size={20} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="text-white font-medium">Credit / Debit Card</div>
                                        <div className="text-xs text-zinc-500">Visa, Mastercard, RuPay</div>
                                    </div>
                                </button>
                                <button onClick={() => handlePay('netbanking')} className="w-full flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 hover:border-purple-500/50 rounded-xl transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                        <Banknote size={20} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="text-white font-medium">Net Banking</div>
                                        <div className="text-xs text-zinc-500">SBI, HDFC, ICICI</div>
                                    </div>
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs pt-4">
                                <ShieldCheck size={12} />
                                <span>256-bit Secure Encryption</span>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                                <Loader2 className="relative z-10 text-emerald-400 animate-spin" size={48} />
                            </div>
                            <h3 className="text-xl font-medium text-white mb-2">Processing Payment...</h3>
                            <p className="text-zinc-500">Please do not close this window.</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                                <CheckCircle className="text-white" size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                            <p className="text-zinc-400 mb-8 max-w-[200px]">Transaction ID: TXN-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                            <button
                                onClick={onSuccess}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
