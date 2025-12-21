import { GoogleGenAI, Type } from "@google/genai";
import { ANALYSIS_PROMPT } from '../constants';
import { AnalysisResult, VehicleType } from '../types';

// Initialize the Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const vehicleSchema = {
  type: Type.OBJECT,
  properties: {
    vehicleType: {
      type: Type.STRING,
      enum: Object.values(VehicleType),
      description: "The classification of the vehicle.",
    },
    licensePlate: {
      type: Type.STRING,
      description: "The alphanumeric characters on the license plate. Uppercase only. No spaces.",
    },
    color: {
      type: Type.STRING,
      description: "The primary color of the vehicle.",
    },
    makeModel: {
      type: Type.STRING,
      description: "The make and model of the vehicle (e.g., Toyota Camry).",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0 and 1.",
    },
    description: {
      type: Type.STRING,
      description: "A short one-sentence description of the vehicle and its condition.",
    },
  },
  required: ["vehicleType", "licensePlate", "confidence", "color", "makeModel", "description"],
};

export const analyzeVehicleImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.split(',')[1];
    
    // We use gemini-2.5-flash for speed and efficiency in vision tasks
    const modelId = "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [
            { text: ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType: "image/jpeg", // Assuming JPEG for simplicity, can be dynamic
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: vehicleSchema,
        temperature: 0.2, // Low temperature for more deterministic OCR results
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Error analyzing vehicle:", error);
    // Return a fallback error object so the UI handles it gracefully
    return {
      vehicleType: VehicleType.Unknown,
      licensePlate: "ERROR",
      confidence: 0,
      color: "Unknown",
      makeModel: "Unknown",
      description: "Failed to process image."
    };
  }
};
