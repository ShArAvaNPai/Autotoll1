import React, { useState } from 'react';
import { TollRate, VehicleType } from '../types';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { TOLL_RATES as DEFAULT_RATES } from '../constants';

interface SettingsViewProps {
    currentRates: TollRate;
    onUpdateRates: (newRates: TollRate) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentRates, onUpdateRates }) => {
    const [rates, setRates] = useState<TollRate>(currentRates);
    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = (type: string, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setRates(prev => ({
                ...prev,
                [type]: numValue
            }));
            setHasChanges(true);
        }
    };

    const handleSave = () => {
        onUpdateRates(rates);
        setHasChanges(false);
        alert('Settings saved successfully!');
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset to default rates?')) {
            setRates(DEFAULT_RATES);
            onUpdateRates(DEFAULT_RATES);
            setHasChanges(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                    <Settings className="text-blue-500" />
                    System Configuration
                </h2>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700"
                    >
                        <RotateCcw size={16} />
                        Reset Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${hasChanges
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                            }`}
                    >
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-zinc-900/50 border-b border-zinc-800">
                    <h3 className="font-semibold text-zinc-200">Toll Rates Configuration</h3>
                    <p className="text-sm text-zinc-500">Set the base toll amount for each vehicle category.</p>
                </div>

                <div className="divide-y divide-zinc-800">
                    {Object.entries(rates).map(([type, price]) => (
                        <div key={type} className="p-4 flex items-center justify-between hover:bg-zinc-900/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'Car' ? 'bg-blue-500/10 text-blue-400' :
                                    type === 'Truck' ? 'bg-orange-500/10 text-orange-400' :
                                        'bg-zinc-700/30 text-zinc-400'
                                    }`}>
                                    <span className="font-bold text-lg">{type[0]}</span>
                                </div>
                                <div>
                                    <p className="font-medium text-zinc-200">{type}</p>
                                    <p className="text-xs text-zinc-500">Base Rate</p>
                                </div>
                            </div>

                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                                <input
                                    type="number"
                                    step="0.50"
                                    min="0"
                                    value={price}
                                    onChange={(e) => handleChange(type, e.target.value)}
                                    className="bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-7 pr-4 w-32 text-right text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
