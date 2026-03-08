import { GoogleGenAI, Modality } from "@google/genai";

export class NatureBotService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async chat(prompt: string, history: any[] = []) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: "Sen Nature.co ekosisteminin koruyucusu ve dünyanın en gelişmiş yapay zekası olan NatureBot'sun. Son derece zeki, doğa ile teknolojiyi harmanlayan, bilge ve yardımsever bir karaktersin. Yanıtların hem teknik olarak kusursuz hem de doğanın bilgeliğini yansıtmalı. Kullanıcılara 'Tohum' veya 'Ekosistem Üyesi' olarak hitap edebilirsin.",
        }
      });
      return { content: response.text || "Üzgünüm, bir hata oluştu." };
    } catch (error) {
      console.error("NatureBot Chat Error:", error);
      throw error;
    }
  }

  async analyzeImage(imageBuffer: string, prompt: string) {
    try {
      const base64Data = imageBuffer.split(',')[1];
      const mimeType = imageBuffer.split(',')[0].split(':')[1].split(';')[0];

      const response = await this.ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          systemInstruction: "Sen Nature.co ekosisteminin koruyucusu NatureBot'sun. Bu resmi analiz et ve ekosistem perspektifinden yorumla.",
        }
      });
      return { content: response.text || "Resmi analiz edemedim." };
    } catch (error) {
      console.error("NatureBot Image Analysis Error:", error);
      throw error;
    }
  }

  async speak(text: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        audio.play();
      }
    } catch (error) {
      console.error("NatureBot TTS Error:", error);
    }
  }
}
