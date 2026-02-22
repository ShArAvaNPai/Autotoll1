import { AnalysisResult } from '../types';
import { getBackendUrl } from './apiConfig';

const API_URL = getBackendUrl();

export const analyzeVehicleImageLocal = async (file: File, location: string = 'UDUPI', source: string = 'manual'): Promise<AnalysisResult> => { // Added source
  const formData = new FormData();
  formData.append('file', file);
  formData.append('location', location);
  formData.append('source', source); // Pass source


  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Local analysis result:", result);
    return result as AnalysisResult;
  } catch (error) {
    console.error("Local analysis failed:", error);
    throw error;
  }
};

export const submitCorrection = async (detectionId: number, correctedPlate: string): Promise<void> => {
  const formData = new FormData();
  formData.append('detection_id', detectionId.toString());
  formData.append('corrected_plate', correctedPlate);

  const response = await fetch(`${API_URL}/api/correct`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to submit correction: ${err}`);
  }
};

// --- Admin API ---

export const loginAdmin = async (username: string, password: string): Promise<any> => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_URL}/api/admin/login`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  return response.json();
};

export const createAdmin = async (username: string, password: string): Promise<any> => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_URL}/api/admins`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to create admin');
  }
  return response.json();
};

export const getAdmins = async (): Promise<any[]> => {
  const response = await fetch(`${API_URL}/api/admins`);
  if (!response.ok) {
    throw new Error('Failed to fetch admins');
  }
  return response.json();
};

export const approveDetection = async (detectionId: number, method: 'account' | 'cash', correctedPlate?: string): Promise<any> => {
  const formData = new FormData();
  formData.append('payment_method', method);
  if (correctedPlate) {
    formData.append('corrected_plate', correctedPlate);
  }

  const response = await fetch(`${API_URL}/api/detections/${detectionId}/approve`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to approve: ${err}`);
  }
  return response.json();
};
