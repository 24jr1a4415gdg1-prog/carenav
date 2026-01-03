
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

/**
 * findNearbyFacilities uses googleMaps which is only supported in Gemini 2.5 series models.
 */
export const findNearbyFacilities = async (
  location: { latitude: number; longitude: number },
  language: string = "English"
): Promise<{ result: NearbyHospitalsResponse; groundingMetadata?: any }> => {
  const ai = getAI();
  
  const systemInstruction = `
    You are "CareNav Locator". Find the closest medical facilities and verified local ambulance numbers.
    Use professional, calm, and helpful sentences. Respond in ${language}.

    STRICT RULES:
    1. Only show facilities within the city area of Lat ${location.latitude}, Lng ${location.longitude}.
    2. Provide local ambulance contact numbers.
    3. No diagnoses. Avoid alarmist language.

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
    const response = await ai.models.generateContent({
      // Maps grounding is only supported in Gemini 2.5 series models.
      model: "gemini-2.5-flash",
      contents: `Find medical clinics, pharmacies, and ambulances near Lat ${location.latitude}, Lng ${location.longitude}.`,
      config: {
        systemInstruction,
        // tools: googleMaps may be used with googleSearch, but not with any other tools.
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        }
        // responseMimeType is not allowed when using the googleMaps tool.
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

/**
 * analyzeSymptoms uses googleMaps which is only supported in Gemini 2.5 series models.
 */
export const analyzeSymptoms = async (
  profile: UserProfile,
  location?: { latitude: number; longitude: number }
): Promise<{ analysis: HealthAnalysis; groundingMetadata?: any }> => {
  const ai = getAI();
  
  const systemInstruction = `
    You are "CareNav", an AI guidance system focused on calm health support.
    Analyze user reports and categorize ONLY into: "Routine Observation", "Professional Evaluation Recommended", or "Immediate Care Support".

    STRICT RULES:
    1. NEVER use alarmist words like "serious", "critical", "dangerous", "fatal", "risk", "emergency", "deadly".
    2. NEVER provide a medical diagnosis or disease name.
    3. MANDATORY: You must always provide a detailed "supportDescription". 
    4. If the input is very brief or vague (e.g., just "Fever"), provide a general guidance summary for that symptom and ask the user to note specific details (duration, intensity) for their next evaluation.
    5. "Immediate Care Support" is for situations where prompt facility visit is advised.
    6. Respond in ${profile.language}. Support transliterated inputs like "naku thala nopi".

    OUTPUT FORMAT:
    {
      "guidanceLevel": "Routine Observation" | "Professional Evaluation Recommended" | "Immediate Care Support",
      "supportDescription": "A calm and detailed description of the guidance needed based on the symptoms.",
      "recommendedAction": "The key next step the user should take.",
      "isImmediate": boolean,
      "languageDetected": "string",
      "nearbyHospitals": [...],
      "emergencyNumbers": [...]
    }
  `;

  const prompt = `User reports: ${profile.symptoms}. Age ${profile.age || 'Unknown'}. Location: ${location ? `Lat ${location.latitude}, Lng ${location.longitude}` : "Unknown"}.`;

  try {
    const response = await ai.models.generateContent({
      // Maps grounding is only supported in Gemini 2.5 series models.
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

/**
 * analyzeReceipt uses googleSearch with structured JSON output.
 */
export const analyzeReceipt = async (
  base64Image: string,
  mimeType: string,
  location?: { latitude: number; longitude: number }
): Promise<{ result: ReceiptAnalysisResult; groundingMetadata?: any }> => {
  const ai = getAI();
  const systemInstruction = `You are "CareNav Auditor". Review medical receipts for regional fee clarity and extract key billing data including hospital name and the specific date of service. Return JSON.`;

  try {
    const response = await ai.models.generateContent({
      // Complex text task (reasoning over receipt image)
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: "Compare this bill with regional pricing standards. Extract hospital name, date of service, and total fees: " + (location ? `Lat ${location.latitude}, Lng ${location.longitude}` : "Unknown") }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hospitalName: { type: Type.STRING },
            dateOfService: { type: Type.STRING, description: "The date the medical services were provided, as found on the bill." },
            detectedFees: { type: Type.STRING },
            isFair: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING },
            fairRange: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["hospitalName", "dateOfService", "detectedFees", "isFair", "explanation", "fairRange", "suggestions"]
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
    details: 'The analysis is processing. Please retry in a moment for complete guidance.',
    canRetry: true
  };
};
