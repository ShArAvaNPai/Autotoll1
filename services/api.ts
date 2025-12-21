import { AnalysisResult } from '../types';

const API_URL = 'http://localhost:8000';

export const analyzeVehicleImageLocal = async (file: File): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);

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
