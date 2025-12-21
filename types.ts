export enum VehicleType {
  Car = 'Car',
  Truck = 'Truck',
  Motorcycle = 'Motorcycle',
  Bus = 'Bus',
  Van = 'Van',
  Unknown = 'Unknown'
}

export interface AnalysisResult {
  vehicleType: VehicleType;
  licensePlate: string;
  confidence: number;
  color: string;
  makeModel: string;
  description: string;
}

export interface TollRecord extends AnalysisResult {
  id: string;
  timestamp: number;
  tollAmount: number;
  imageUrl: string;
  status: 'processed' | 'manual_review';
}

export interface TollRate {
  [key: string]: number;
}
