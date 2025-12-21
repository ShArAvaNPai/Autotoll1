import { VehicleType, TollRate } from './types';

export const TOLL_RATES: TollRate = {
  [VehicleType.Car]: 5.00,
  [VehicleType.Truck]: 12.50,
  [VehicleType.Bus]: 8.00,
  [VehicleType.Van]: 6.00,
  [VehicleType.Motorcycle]: 2.50,
  [VehicleType.Unknown]: 10.00, // Default penalty/manual review rate
};

export const ANALYSIS_PROMPT = `
You are an automated toll booth AI agent. Your job is to analyze the image of a vehicle.
1. Identify the vehicle type (Car, Truck, Motorcycle, Bus, Van).
2. Read the license plate text carefully. If it is blurry or missing, mark as "UNKNOWN".
3. Identify the color and potential Make/Model of the vehicle.
4. Provide a confidence score (0-1) for your detection.

Return the response in JSON format.
`;
