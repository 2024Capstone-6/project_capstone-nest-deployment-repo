import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

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
  constructor(private readonly configService: ConfigService) {
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

  // ✅ 세션 초기화 (Gemini 대화 컨텍스트용)
  /* initSession(sessionId: string, systemPrompt: string) {
    this.sessions.set(sessionId, [{ role: 'user', parts: { text: systemPrompt } }]);
  }

  saveUserMessage(sessionId: string, text: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.push({ role: 'user', parts: { text } });
    }
  }

  saveGeminiMessage(sessionId: string, text: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.push({ role: 'model', parts: { text } });
    }
  } */
  
  // ✅ 텍스트 대화용 간단한 세션 로직
  // 1. 첫 메시지 저장
  startSession(geminiText: string) {
    this.conversationHistory = [{ role: 'gemini', text: geminiText }];
  }

  // 2. 유저 메시지 추가
  appendUserMessage(userText: string) {
    this.conversationHistory.push({ role: 'user', text: userText });
  }

  // 3. Gemini 메시지 추가
  appendGeminiMessage(geminiText: string) {
    this.conversationHistory.push({ role: 'gemini', text: geminiText });
  }

  // 4. 제미니와 대화 이어가기
  async continueConversation(contextPrompt: string): Promise<string> {
    // 1. 상황 프롬프트 + 기존 대화 히스토리 병합
    const promptContent = [
      { role: 'user', parts: [{ text: contextPrompt }] },
      ...this.conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
    ];
  
    // 2. Gemini API 호출
    const response = await axios.post(
      `${this.apiUrl}?key=${this.apiKey}`,
      { contents: promptContent },
      { headers: { 'Content-Type': 'application/json' } }
    );
  
    // 3. Gemini 응답 추출 및 저장
    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '응답 생성 실패';
    this.appendGeminiMessage(reply);
    return reply;
  }

  // 5. 유저 메시지 리스트 추출
  getUserMessages(): string[] {
    return this.conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.text);
  }

  // 6. 피드백 생성
  async generateFeedback(): Promise<string> {
    const userTexts = this.getUserMessages();
  
    const prompt = `以下は日本語学習者の会話例です。\n1文ずつ文法や単語の使い方に問題があれば指摘してください。\n問題がなければ「良い表現です」とだけ伝えてください。\n\n${userTexts.map((text, i) => `${i + 1}. ${text}`).join('\n')}`;
  
    const response = await axios.post(
      `${this.apiUrl}?key=${this.apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
  
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '피드백 생성 실패';
  }

  // ✅ 전체 대화 기반 응답 생성
  /* async continueWithContext(sessionId: string): Promise<string> {
    const messages = this.sessions.get(sessionId);
    if (!messages) {
      throw new Error('세션을 찾을 수 없습니다.');
    }

    const response = await axios.post(
      `${this.apiUrl}?key=${this.apiKey}`,
      { contents: messages },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다.';
    return reply;
  } */

  // ✨ 단일 메시지 전송용 기본 함수
  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다。';
    } catch (error) {
      console.error('Gemini API 요청 오류:', error.response?.data || error.message);
      throw new Error('Google Gemini API 호출 실패');
    }
  }
}