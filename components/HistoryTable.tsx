import React from 'react';
import { TollRecord, VehicleType } from '../types';
import { Car, Truck, Bike, Bus, AlertCircle } from 'lucide-react';

interface HistoryTableProps {
  records: TollRecord[];
}

const VehicleIcon = ({ type }: { type: VehicleType }) => {
  switch (type) {
    case VehicleType.Car: return <Car size={16} />;
    case VehicleType.Truck: return <Truck size={16} />;
    case VehicleType.Motorcycle: return <Bike size={16} />;
    case VehicleType.Bus: return <Bus size={16} />;
    default: return <AlertCircle size={16} />;
  }
};

export const HistoryTable: React.FC<HistoryTableProps> = ({ records }) => {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800/50 bg-zinc-900">
        <h3 className="font-semibold text-zinc-200">Recent Transactions</h3>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-900/50 sticky top-0">
            <tr>
              <th className="p-4 font-medium text-zinc-300">Time</th>
              <th className="p-4 font-medium text-zinc-300">Vehicle</th>
              <th className="p-4 font-medium text-zinc-300">Plate</th>
              <th className="p-4 font-medium text-zinc-300 text-right">Toll</th>
              <th className="p-4 font-medium text-zinc-300 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  No records yet. Upload an image to start.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded bg-zinc-800/50 text-zinc-300">
                        <VehicleIcon type={record.vehicleType} />
                      </span>
                      <span className="text-zinc-200">{record.makeModel}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-medium text-zinc-200">
                    <span className="bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-xs tracking-wider">
                      {record.licensePlate}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-emerald-400">
                    ₹{record.tollAmount.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${record.status === 'processed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                      {record.status === 'processed' ? 'Paid' : 'Review'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
