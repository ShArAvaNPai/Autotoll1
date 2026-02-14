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
    const [step, setStep] = useState<'selection' | 'upi_scan' | 'netbanking_select' | 'netbanking_details' | 'processing' | 'success'>('selection');
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [amount, setAmount] = useState(initialAmount);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedBank, setSelectedBank] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');

    const methods = [
        { id: 'razorpay', name: 'Razorpay Secure Gateway', icon: ShieldCheck, color: 'text-emerald-500' }
    ];

    // Auto-select Razorpay since it's the only one
    useState(() => {
        setSelectedMethod('razorpay');
    });

    const handleProceed = () => {
        if (!selectedMethod) {
            alert("Please select a payment method.");
            return;
        }

        // Direct Razorpay Integration
        const options = {
            key: "rzp_test_SC7GZQVzAK7jRK",
            amount: amount * 100, // Amount in paise
            currency: "INR",
            name: "AutoToll AI",
            description: `Wallet Recharge for ${plate}`,
            image: `${getBackendUrl()}/uploads/logo_placeholder.png`,
            handler: function (response: any) {
                console.log("Razorpay Payment Success:", response);
                handleFinalPayment(response.razorpay_payment_id);
            },
            prefill: {
                name: "Vehicle Owner",
                email: "owner@autotoll.ai",
                contact: "9999999999" // Dummy contact for test mode
            },
            theme: {
                color: "#10b981" // Emerald-500
            }
        };

        try {
            const rzp1 = new (window as any).Razorpay(options);
            rzp1.open();
            rzp1.on('payment.failed', function (response: any) {
                alert("Payment Failed: " + response.error.description);
            });
        } catch (error) {
            console.error("Razorpay Error:", error);
            alert("Failed to load Razorpay SDK. Please check your internet connection.");
        }
    };

    const handleFinalPayment = async (paymentId: string) => {
        setIsLoading(true);
        setStep('processing');

        try {
            const formData = new FormData();
            formData.append('license_plate', plate);
            formData.append('amount', amount.toString());
            formData.append('payment_id', paymentId); // Log the ID if needed backend side

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

                            {/* Method List - Simplified */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Payment Method</label>
                                <div className="p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-zinc-800 text-emerald-500">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm text-white">Razorpay Secure</span>
                                            <span className="text-[10px] text-zinc-400">Cards, UPI, Netbanking</span>
                                        </div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <CheckCircle size={12} className="text-zinc-900" />
                                    </div>
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
