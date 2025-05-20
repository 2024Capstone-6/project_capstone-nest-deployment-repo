import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
// import { SpeechToTextService } from './speech-to-text.service';
// import { TextToSpeechService } from './text-to-speech.service';

type Message = { role: 'user' | 'gemini'; text: string };

@Injectable()
export class ChatbotService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent';  
  private conversationHistory: Message[] = [];

  constructor(
    private readonly configService: ConfigService,
    // private readonly speechToTextService: SpeechToTextService,
    // private readonly textToSpeechService: TextToSpeechService
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
  }

  // ✅ 단일 메시지 테스트용
  async testGenerateResponse(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다.';
    } catch (error) {
      console.error('Gemini API 요청 오류:', error.response?.data || error.message);
      throw new Error('Google Gemini API 호출 실패');
    }
  }

  // ✅ 텍스트 챗봇 - 시작
  async startConversation(situation: string): Promise<{ text: string /*, audioUrl: string */ }> {
    const prompt = `
      状況: ${situation}
      あなたはこの状況に登場する専門家です。ユーザーはその状況にいる人です。
      
      以下のルールに従ってロールプレイを始めてください。
      - 「はい」「承知しました」などの定型句は一切使わないでください。
      - 会話は1ターンずつ交互に続ける（1〜2文以内）。ただし、ユーザーが「はい」「お願いします」など短く返した場合は、次の質問を続けてください。
      - 不自然な挨拶や定型句は省略する
      - まず「自分の役割」と「ユーザーの役割」を簡潔に伝えてから自然に会話を始める
      - 「〜ですね」などの曖昧な語尾は避け、「〜です」「〜ます」で締めくくってください。
      - マークダウンや記号（**など）を使わないでください。プレーンな日本語で返してください。
    `;

    const geminiText = await this.generateResponse(prompt);
    this.conversationHistory = [{ role: 'gemini', text: geminiText }];

    // const audioPath = `output_${Date.now()}.mp3`;
    // await this.textToSpeechService.synthesizeSpeech(geminiText, audioPath);
    // const audioUrl = `/audio/${audioPath}`;

    return { text: geminiText /*, audioUrl */ };
  }

  // ✅ 텍스트 챗봇 - 이어가기
  async continueConversation(situation: string, userText: string): Promise<{ text: string /*, audioUrl: string */ }> {
    this.conversationHistory.push({ role: 'user', text: userText });

    const contextPrompt = `
    あなたは「${situation}」における専門家として、ユーザーとロールプレイを続けています。
    
    以下のルールに従って次の応答を生成してください。
    - 応答は現実の会話のように自然に。ただし、ユーザーの返答が短い場合は次の質問で会話を自然に続けてください。
    - 必ず1〜2文以内で返答すること
    - ユーザーが状況に合わないことを言った場合は、「その質問はこの状況には関係がないようです」などで丁寧に軌道修正すること
    - 記号（**、-、#など）やマークダウンは使わず、プレーンな日本語だけで返すこと
    `;

    const promptContent = [
      { role: 'user', parts: [{ text: contextPrompt }] },
      ...this.conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
    ];

    const response = await axios.post(
      `${this.apiUrl}?key=${this.apiKey}`,
      { contents: promptContent },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const geminiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '応答生成失敗';
    this.conversationHistory.push({ role: 'gemini', text: geminiText });

    // const audioPath = `output_${Date.now()}.mp3`;
    // await this.textToSpeechService.synthesizeSpeech(geminiText, audioPath);
    // const audioUrl = `/audio/${audioPath}`;

    return { text: geminiText /*, audioUrl */ };
  }

  // ✅ 피드백 생성
  async generateFeedback(): Promise<string> {
    const userTexts = this.conversationHistory.filter(m => m.role === 'user').map(m => m.text);

    const prompt = `
    以下は日本語学習者の会話の例です。
    各文に対して、以下の4点を確認してください。
    1. 文法の誤りがないか
    2. 単語の使い方が適切か
    3. 状況に合った自然な発言か
    4. 状況に関係のない発言ではないか

    各文に対して、以下のフォーマットで簡潔にフィードバックしてください：

    例）  
    1. 「〜」→「良い表現です。理由：丁寧で自然な表現です。」  
    2. 「〜」→「文法ミスがあります。理由：「〜」は不自然な使い方です。」

    注意事項：  
    - 特に「状況に合っているか」「質問の意図が現在の状況と一致しているか」を重視してください。
    - 関連のない話題、会話の流れを乱す発言は「状況に合っていません」としてください。
    - 記号（**、-、#など）やマークダウンを使わないでください。  
    - 出力はすべてプレーンな日本語で返してください。

    ${userTexts.map((t, i) => `${i + 1}. ${t}`).join('\n')}
    `;

    const response = await axios.post(
      `${this.apiUrl}?key=${this.apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } },
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '피드백 생성 실패';
  }

  // ✅ 기본 응답 함수
  async generateResponse(prompt: string): Promise<string> {
    const response = await axios.post(
      `${this.apiUrl}?key=${this.apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다。';
  }
}