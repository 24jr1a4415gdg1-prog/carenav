
export enum GuidanceLevel {
  ROUTINE = "Routine Observation",
  EVALUATION = "Professional Evaluation Recommended",
  IMMEDIATE = "Immediate Care Support"
}

export interface EmergencyContact {
  serviceName: string;
  number: string;
  type: 'Ambulance' | 'Police' | 'General';
}

export interface HospitalInfo {
  name: string;
  estimatedFees: string;
  address: string;
  contact?: string;
  notes?: string;
  website?: string;
  insuranceAccepted?: string[];
}

export interface HealthAnalysis {
  guidanceLevel: GuidanceLevel;
  explanation: string;
  recommendedAction: string;
  isImmediate: boolean;
  languageDetected: string;
  nearbyHospitals?: HospitalInfo[];
  emergencyNumbers?: EmergencyContact[];
}

export interface NearbyHospitalsResponse {
  summary: string;
  nearbyHospitals: HospitalInfo[];
  emergencyNumbers: EmergencyContact[];
}

export interface ReceiptAnalysisResult {
  hospitalName: string;
  detectedFees: string;
  isFair: boolean;
  explanation: string;
  fairRange: string;
  suggestions: string[];
}

export interface UserProfile {
  symptoms: string;
  age?: string;
  gender?: string;
  language: string;
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
  // Added web property to comply with Google Search grounding requirements
  web?: {
    uri: string;
    title: string;
  };
}

export type ErrorType = 'NETWORK' | 'AI_PROCESSING' | 'INVALID_INPUT' | 'UNKNOWN';

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  canRetry: boolean;
}
