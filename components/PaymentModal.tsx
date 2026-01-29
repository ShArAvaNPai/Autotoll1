import React, { useState } from 'react';
import { X, CreditCard, Wallet, Landmark, Smartphone, ShieldCheck, Loader2, CheckCircle, ChevronRight, AlertCircle, ScanLine } from 'lucide-react';
import { getBackendUrl } from '../services/apiConfig';

interface PaymentModalProps {
    plate: string;
    onClose: () => void;
    onSuccess: (amount: number) => void;
    initialAmount?: number;
}

export function PaymentModal({ plate, onClose, onSuccess, initialAmount = 100 }: PaymentModalProps) {
    const [step, setStep] = useState<'selection' | 'upi_scan' | 'netbanking_select' | 'processing' | 'success'>('selection');
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [amount, setAmount] = useState(initialAmount);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedBank, setSelectedBank] = useState('');

    const methods = [
        { id: 'card', name: 'Credit / Debit Card', icon: CreditCard, color: 'text-blue-500' },
        { id: 'upi', name: 'UPI / QR Code', icon: Smartphone, color: 'text-emerald-500' },
        { id: 'wallet', name: 'Digital Wallet', icon: Wallet, color: 'text-amber-500' },
        { id: 'netbanking', name: 'Net Banking', icon: Landmark, color: 'text-purple-500' }
    ];

    const banks = [
        "HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"
    ];


    const handleProceed = () => {
        if (!selectedMethod) {
            alert("Please select a payment method.");
            return;
        }
        if (selectedMethod === 'upi') {
            setStep('upi_scan');
        } else if (selectedMethod === 'netbanking') {
            setStep('netbanking_select');
        } else {
            handleFinalPayment();
        }
    };

    const handleFinalPayment = async () => {
        setIsLoading(true);
        setStep('processing');

        try {
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));

            const formData = new FormData();
            formData.append('license_plate', plate);
            formData.append('amount', amount.toString());

            const res = await fetch(`${getBackendUrl()}/api/owner/add_balance`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                setStep('success');
            } else {
                alert(data.detail || "Payment failed at backend.");
                setStep('selection');
            }
        } catch (e) {
            console.error("Payment Error:", e);
            alert("Connection error. Is the server running?");
            setStep('selection');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative">

                {/* Close Button */}
                {step !== 'processing' && step !== 'success' && (
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-all bg-white/5 rounded-full z-10"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Header */}
                <div className="p-8 pb-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                            <ShieldCheck className="text-emerald-500" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Add Balance</h2>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold border border-amber-500/20">TEST MODE</span>
                    </div>
                    <p className="text-zinc-500 text-sm">Secure wallet recharge for <span className="text-zinc-200 font-mono font-bold">{plate}</span></p>
                </div>

                <div className="p-8">
                    {step === 'selection' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {/* Amount Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Recharge Amount (₹)</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-lg">₹</div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Method List */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Payment Method</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {methods.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMethod(m.id)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedMethod === m.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg bg-zinc-800 ${m.color}`}>
                                                    <m.icon size={20} />
                                                </div>
                                                <span className={`font-semibold text-sm ${selectedMethod === m.id ? 'text-white' : 'text-zinc-400'}`}>{m.name}</span>
                                            </div>
                                            {selectedMethod === m.id && <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <CheckCircle size={12} className="text-zinc-900" />
                                            </div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleProceed}
                                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-[20px] transition-all shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 group active:scale-95"
                            >
                                <span>Proceed to Pay ₹{amount.toLocaleString()}</span>
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {step === 'upi_scan' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-white p-4 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center shadow-lg transform transition-all hover:scale-105">
                                <img src={`${getBackendUrl()}/uploads/dummy_qr.png`} alt="UPI QR" className="w-full h-full object-contain" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-white font-bold">Scan with any UPI App</p>
                                <p className="text-zinc-500 text-xs">GPay, PhonePe, Paytm, etc.</p>
                            </div>

                            <button
                                onClick={handleFinalPayment}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg text-sm"
                            >
                                I have made the payment
                            </button>
                            <button
                                onClick={() => setStep('selection')}
                                className="w-full py-3 text-zinc-500 hover:text-white text-sm transition-colors"
                            >
                                Go Back
                            </button>
                        </div>
                    )}

                    {step === 'netbanking_select' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Select Bank</label>
                            <div className="grid grid-cols-1 gap-2">
                                {banks.map(bank => (
                                    <button
                                        key={bank}
                                        onClick={() => setSelectedBank(bank)}
                                        className={`p-4 rounded-xl border text-left font-medium text-sm transition-all ${selectedBank === bank ? 'bg-indigo-500 text-white border-transparent' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'}`}
                                    >
                                        {bank}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleFinalPayment}
                                disabled={!selectedBank}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg text-sm mt-4"
                            >
                                Pay Securely
                            </button>
                            <button
                                onClick={() => setStep('selection')}
                                className="w-full py-3 text-zinc-500 hover:text-white text-sm transition-colors"
                            >
                                Go Back
                            </button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                                <div className="relative w-24 h-24 bg-zinc-800 border-2 border-white/5 rounded-full flex items-center justify-center">
                                    <Loader2 className="text-emerald-500 animate-spin" size={48} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Processing Payment</h3>
                                <p className="text-zinc-500 text-sm">Please do not refresh or close this window...</p>
                                {selectedMethod === 'netbanking' && <p className="text-indigo-400 text-xs mt-2">Connecting to {selectedBank}...</p>}
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150" />
                                <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                                    <CheckCircle className="text-zinc-900" size={48} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2">Payment Completed</h3>
                                <p className="text-zinc-400">₹{amount.toLocaleString()} successfully added to <span className="text-white font-mono">{plate}</span></p>
                            </div>
                            <button
                                onClick={() => onSuccess(amount)}
                                className="w-full py-5 bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-[20px] transition-all shadow-xl"
                            >
                                Finish
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Privacy Info */}
                <div className="p-8 pt-0 border-t border-white/5 mt-4 bg-white/[0.02]">
                    <div className="pt-6 flex items-center justify-center gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                        <ShieldCheck size={12} /> 256-Bit SSL Secured Transaction (TEST MODE)
                    </div>
                </div>
            </div>
        </div>
    );
}
