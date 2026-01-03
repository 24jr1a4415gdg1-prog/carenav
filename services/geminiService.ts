
import { GoogleGenAI, Type } from "@google/genai";
import { HealthAnalysis, UserProfile, AppError, ReceiptAnalysisResult, NearbyHospitalsResponse, GuidanceLevel } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractJSON = (text: string): string => {
  try {
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1].trim();
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return text.substring(firstBrace, lastBrace + 1);
    }
    return text;
  } catch (e) {
    return text;
  }
};

export const findNearbyFacilities = async (
  location: { latitude: number; longitude: number },
  language: string = "English"
): Promise<{ result: NearbyHospitalsResponse; groundingMetadata?: any }> => {
  const ai = getAI();
  
  const systemInstruction = `
    You are "CareNav Locator". Find the closest medical facilities and local ambulance numbers.
    Use short, calm, helpful sentences. Respond in ${language}.

    STRICT RULES:
    1. Only show facilities within the IMMEDIATE city area of Lat ${location.latitude}, Lng ${location.longitude}.
    2. Provide local ambulance contact numbers using grounding.
    3. No diagnoses.

    OUTPUT FORMAT (JSON ONLY):
    {
      "summary": "string",
      "nearbyHospitals": [
        {
          "name": "string",
          "estimatedFees": "string",
          "address": "string",
          "contact": "string",
          "notes": "string",
          "website": "string",
          "insuranceAccepted": ["string"]
        }
      ],
      "emergencyNumbers": [
        { "serviceName": "string", "number": "string", "type": "Ambulance" }
      ]
    }
  `;

  try {
    // Maps grounding is only supported in Gemini 2.5 series models.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find medical facilities and ambulances near Lat ${location.latitude}, Lng ${location.longitude}.`,
      config: {
        systemInstruction,
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    const jsonStr = extractJSON(text);
    return { 
      result: JSON.parse(jsonStr),
      groundingMetadata: response.candidates?.[0]?.groundingMetadata 
    };
  } catch (e: any) {
    throw handleAIError(e);
  }
};

export const analyzeSymptoms = async (
  profile: UserProfile,
  location?: { latitude: number; longitude: number }
): Promise<{ analysis: HealthAnalysis; groundingMetadata?: any }> => {
  const ai = getAI();
  
  const systemInstruction = `
    You are "CareNav", an AI guidance system. 
    Analyze user reports and categorize into: "Routine Observation", "Professional Evaluation Recommended", or "Immediate Care Support".

    STRICT RULES:
    1. NEVER use words like "serious", "critical", "dangerous", "fatal", "risk", or "emergency".
    2. NEVER name any diseases or provide a diagnosis.
    3. Use calm, reassuring language focused on next steps.
    4. Categorize as "Immediate Care Support" if prompt action is advised.
    5. Respond in ${profile.language}. Handle transliterated inputs naturally.

    OUTPUT FORMAT:
    {
      "guidanceLevel": "Routine Observation" | "Professional Evaluation Recommended" | "Immediate Care Support",
      "explanation": "string",
      "recommendedAction": "string",
      "isImmediate": boolean,
      "languageDetected": "string",
      "nearbyHospitals": [...],
      "emergencyNumbers": [...]
    }
  `;

  const prompt = `User reports: ${profile.symptoms}. Age ${profile.age || 'Unknown'}. Location: ${location ? `Lat ${location.latitude}, Lng ${location.longitude}` : "Unknown"}.`;

  try {
    // Maps grounding is only supported in Gemini 2.5 series models.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: location ? {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        } : undefined
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");

    const jsonStr = extractJSON(text);
    const analysis: HealthAnalysis = JSON.parse(jsonStr);
    return { 
      analysis, 
      groundingMetadata: response.candidates?.[0]?.groundingMetadata 
    };
  } catch (e: any) {
    throw handleAIError(e);
  }
};

export const analyzeReceipt = async (
  base64Image: string,
  mimeType: string,
  location?: { latitude: number; longitude: number }
): Promise<{ result: ReceiptAnalysisResult; groundingMetadata?: any }> => {
  const ai = getAI();
  const systemInstruction = `You are "CareNav Auditor". Analyze medical bills for regional fairness using current market pricing standards. Be calm and helpful. Return JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: "Analyze this bill for regional fairness comparing it with typical local costs: " + (location ? `Lat ${location.latitude}, Lng ${location.longitude}` : "Unknown") }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hospitalName: { type: Type.STRING },
            detectedFees: { type: Type.STRING },
            isFair: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING },
            fairRange: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["hospitalName", "detectedFees", "isFair", "explanation", "fairRange", "suggestions"]
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    if (!text) throw new Error("Could not read document");
    return {
      result: JSON.parse(text),
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (e: any) {
    throw handleAIError(e);
  }
};

const handleAIError = (e: any): AppError => {
  return {
    type: 'AI_PROCESSING',
    message: 'System Pause',
    details: 'The analysis is taking a moment. Please retry in a few seconds.',
    canRetry: true
  };
};
