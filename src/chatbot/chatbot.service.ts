import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { SpeechToTextService } from './speech-to-text.service';
import { TextToSpeechService } from './text-to-speech.service';

type Message = { role: 'user' | 'gemini'; text: string };

@Injectable()
export class ChatbotService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent';  
  
  // ✅ 메모리 세션 저장소 (Gemini API 형식용)
  // private sessions: Map<string, { role: 'user' | 'model'; parts: { text: string } }[]> = new Map();
  // ✅ 내부 로직용 간단한 텍스트 기반 세션 저장소
  // private sessionMemory: Record<string, Message[]> = {};
  // ✅ sessionId 제거 → 하나의 고정 세션 사용
  private conversationHistory: Message[] = [];

  // 🔥 제미나이 챗봇 관련
  constructor(
    private readonly configService: ConfigService,
    private readonly speechToTextService: SpeechToTextService,
    private readonly textToSpeechService: TextToSpeechService
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
  }

  // ✅ 제미나이 API 연결 테스트
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

  // ✅ 단일 응답 생성
  async generateResponse(prompt: string): Promise<string> {
    const response = await axios.post(
      `${this.apiUrl}?key=${this.apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } },
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다。';
  }

  // ✅ 대화 시작 (시스템 메시지 기반 초기화)
  async startConversation(situation: string): Promise<{ text: string; audioUrl: string }> {
    const prompt = `
      状況: ${situation}
      あなたはこの状況に登場する専門家です。ユーザーはその状況にいる人です。
      以下のルールに従ってロールプレイを始めてください。
      - 「はい」「承知しました」などの定型句は一切使わないでください。
      - 会話は1ターンずつ交互に続ける（1〜2文以内）
      - 不自然な挨拶や定型句は省略する
      - まず「自分の役割」と「ユーザーの役割」を簡潔に伝えてから自然に会話を始める
      - 「〜ですね」などの曖昧な語尾は避け、「〜です」「〜ます」で締めくくってください。
      - マークダウンや記号（**など）を使わないでください。プレーンな日本語で返してください。
    `;

    const geminiText = await this.generateResponse(prompt);
    this.conversationHistory = [{ role: 'gemini', text: geminiText }];

    const audioPath = `output_${Date.now()}.mp3`;
    await this.textToSpeechService.synthesizeSpeech(geminiText, audioPath);
    const audioUrl = `/audio/${audioPath}`;

    return { text: geminiText, audioUrl };
  }

  // ✅ 대화 이어가기
  async continueConversation(situation: string, userText: string): Promise<{ text: string; audioUrl: string }> {
    this.conversationHistory.push({ role: 'user', text: userText });
  
    const contextPrompt = `
      現在の状況は「${situation}」です。
      状況に合った自然な一文を返してください。
      会話は短く、1〜2文以内で交互に進めてください。
      ユーザーの返答が状況に合わない場合は、優しく指摘して正しい流れに戻してください。
      マークダウンや記号（**など）を使わないでください。プレーンな日本語で返してください。
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
      { headers: { 'Content-Type': 'application/json' } },
    );
  
    const geminiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '応答生成失敗';
    this.conversationHistory.push({ role: 'gemini', text: geminiText });
  
    const audioPath = `output_${Date.now()}.mp3`;
    await this.textToSpeechService.synthesizeSpeech(geminiText, audioPath);
    const audioUrl = `/audio/${audioPath}`;
  
    return { text: geminiText, audioUrl };
  }

  // ✅ 피드백 생성
  async generateFeedback(): Promise<string> {
    const userTexts = this.conversationHistory.filter(m => m.role === 'user').map(m => m.text);

    const prompt = `
    以下は日本語学習者の会話の例です。
    1文ずつ以下の3点を確認してください。
    1. 文法の誤りがないか
    2. 単語の使い方が適切か
    3. 状況に合った自然な発言か

    問題があれば具体的にどこがどう間違っているかを説明してください。
    問題がなければ「良い表現です」と述べた上で、なぜ良いのか簡単に説明してください。
    マークダウンや記号（**など）を使わないでください。プレーンな日本語で返してください。

    ${userTexts.map((t, i) => `${i + 1}. ${t}`).join('\n')}
    `;

    const response = await axios.post(
      `${this.apiUrl}?key=${this.apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } },
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '피드백 생성 실패';
  }
}