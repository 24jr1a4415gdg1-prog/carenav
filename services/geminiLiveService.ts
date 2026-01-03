
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio configuration constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export interface LiveSessionCallbacks {
  onTranscription?: (text: string, isUser: boolean) => void;
  onStateChange?: (state: 'idle' | 'listening' | 'speaking' | 'thinking') => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

// Helper functions as per standard instructions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class CareNavLiveAssistant {
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private inputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;

  constructor(private callbacks: LiveSessionCallbacks) {}

  async start(languageHint: string = "English") {
    try {
      const ai = getAI();
      
      // Initialize audio contexts
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Resume contexts (browsers require user interaction)
      await this.audioContext.resume();
      await this.inputAudioContext.resume();
      
      const systemInstruction = `
        You are "CareNav Voice", a real-time risk-based health guidance system.
        
        GOAL:
        Listen to the user's symptoms and classify them as Low, Medium, or High Risk (Emergency).
        
        STRICT RULES:
        1. Speak in the SAME LANGUAGE as the user. You have native-level proficiency in Telugu, Hindi, English, Spanish, and many other languages.
        2. Handle transliteration and mixed language speech flawlessly. For example, if a user speaks Romanized Telugu ("naku thala nopi") or Hinglish, understand them perfectly.
        3. If the user speaks Telugu, respond fluently in Telugu.
        4. DO NOT diagnose diseases. Use phrases like "Your symptoms suggest a need for professional evaluation..."
        5. DO NOT prescribe medicine.
        6. Be calm, reassuring, and concise.
        7. For High Risk (Emergency): Advise immediate visit to the nearest emergency room.
        8. For Medium Risk: Suggest visiting a doctor within 24-48 hours.
        9. For Low Risk: Suggest self-observation and rest.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.debug('Live session opened');
            this.callbacks.onStateChange?.('listening');
            this.setupMicrophone(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              this.callbacks.onTranscription?.(message.serverContent.outputTranscription.text, false);
            } else if (message.serverContent?.inputTranscription) {
              this.callbacks.onTranscription?.(message.serverContent.inputTranscription.text, true);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && this.audioContext) {
              this.callbacks.onStateChange?.('speaking');
              const buffer = await decodeAudioData(
                decode(base64Audio),
                this.audioContext,
                OUTPUT_SAMPLE_RATE,
                1
              );
              this.playAudioBuffer(buffer);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              this.stopAllAudio();
              this.callbacks.onStateChange?.('listening');
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            this.callbacks.onError?.("Assistant encountered a connection error.");
          },
          onclose: (e) => {
            console.debug('Live session closed:', e);
            this.callbacks.onClose?.();
          },
        },
      });

      this.session = await sessionPromise;
    } catch (err: any) {
      console.error('Failed to start Live Assistant:', err);
      this.callbacks.onError?.(err.message || "Failed to start voice assistant");
    }
  }

  private setupMicrophone(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.stream) return;
    
    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    const processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createPcmBlob(inputData);
      sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };
    
    source.connect(processor);
    processor.connect(this.inputAudioContext.destination);
  }

  private createPcmBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private playAudioBuffer(buffer: AudioBuffer) {
    if (!this.audioContext) return;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    this.nextStartTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      if (this.sources.size === 0) {
        this.callbacks.onStateChange?.('listening');
      }
    };
  }

  private stopAllAudio() {
    this.sources.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    this.sources.clear();
    this.nextStartTime = 0;
  }

  stop() {
    this.stopAllAudio();
    this.stream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
    this.inputAudioContext?.close();
    if (this.session) {
      try { this.session.close(); } catch (e) {}
    }
  }
}
