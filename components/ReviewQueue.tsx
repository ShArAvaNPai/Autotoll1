import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckSquare, Car, Truck, Bus } from 'lucide-react';

const API_BASE = "http://localhost:8000";

interface Detection {
    id: number;
    vehicle_type: string;
    license_plate: string;
    confidence: string;
    timestamp: string;
    toll_amount: number;
    status: string;
    image_path?: string;
}

interface ReviewQueueProps {
    onProcessed?: () => void;
}

export function ReviewQueue({ onProcessed }: ReviewQueueProps) {
    const [queue, setQueue] = useState<Detection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQueue();
    }, []);

    const handleItemProcessed = () => {
        loadQueue();
        onProcessed?.();
    };

    const loadQueue = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/review_queue`);
            if (res.ok) {
                setQueue(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <AlertTriangle className="text-amber-500" size={28} />
                <div>
                    <h2 className="text-2xl font-light text-zinc-100">Review Queue</h2>
                    <p className="text-zinc-500 text-sm">Validating low-confidence detections.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-zinc-500 text-center py-12">Loading...</div>
            ) : queue.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
                    <CheckSquare size={48} className="mx-auto text-zinc-700 mb-4" />
                    <p className="text-zinc-400">All caught up! No detections pending review.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {queue.map(item => (
                        <ReviewCard key={item.id} item={item} onProcessed={handleItemProcessed} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface ReviewCardProps {
    item: Detection;
    onProcessed: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ item, onProcessed }) => {
    const [type, setType] = useState(item.vehicle_type);
    const [toll, setToll] = useState(item.toll_amount.toString());
    const [submitting, setSubmitting] = useState(false);

    const handleUpdate = async () => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('vehicle_type', type);
            formData.append('toll_amount', toll);

            const res = await fetch(`${API_BASE}/api/detections/${item.id}`, {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                onProcessed();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDiscard = async () => {
        if (!window.confirm("Are you sure you want to discard this detection?")) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/detections/${item.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                onProcessed();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex flex-col md:flex-row gap-6 items-start">
            {/* Thumbnail Placeholder - assuming we don't store image bytes in DB for now, just metadata */}
            <div className="w-full md:w-48 h-32 bg-zinc-950 rounded flex items-center justify-center border border-zinc-800 overflow-hidden relative group">
                {item.image_path ? (
                    <img
                        src={`${API_BASE}${item.image_path}`}
                        alt="Vehicle"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <Car className="text-zinc-800" size={48} />
                )}
            </div>

            <div className="flex-1 space-y-4 w-full">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                                #{item.id}
                            </span>
                            <span className="text-xs text-zinc-500">{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <h3 className="text-xl font-mono font-bold text-white tracking-wide">{item.license_plate}</h3>
                        <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Low Confidence: {(parseFloat(item.confidence) * 100).toFixed(1)}%
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-zinc-500 block mb-1.5 uppercase tracking-wider">Vehicle Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="Car">Car</option>
                            <option value="Truck">Truck</option>
                            <option value="Bus">Bus</option>
                            <option value="Motorcycle">Motorcycle</option>
                            <option value="Van">Van</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 block mb-1.5 uppercase tracking-wider">Toll Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                            <input
                                type="number"
                                value={toll}
                                onChange={(e) => setToll(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded p-2 pl-6 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <button
                        onClick={handleDiscard}
                        disabled={submitting}
                        className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? 'Saving...' : 'Confirm & Process'}
                    </button>
                </div>
            </div>
        </div>
    );
};
