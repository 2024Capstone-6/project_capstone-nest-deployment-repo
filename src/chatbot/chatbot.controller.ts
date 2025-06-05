import { Controller, Param, Post, Get, Body, UseInterceptors, UploadedFile, Req, UseGuards, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatbotService } from './chatbot.service';
import { SpeechToTextService } from './speech-to-text.service';
import { TextToSpeechService } from './text-to-speech.service';
import { ChatQnAService } from './chatbot-qna.service';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { memoryStorage } from 'multer';

@UseGuards(AuthGuard('jwt'))
@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly speechToTextService: SpeechToTextService,
    private readonly textToSpeechService: TextToSpeechService,
    private readonly chatQnAService: ChatQnAService
  ) {}

  // 🔥 제미나이 챗봇 관련
  @Post('text-chat')
  async textChat(@Body('message') message: string) {
    const reply = await this.chatbotService.testGenerateResponse(message);
    return { reply };
  }

  // ✅ 제미나이 API 연결 테스트 (음성 입력 → 텍스트 응답 → 음성 변환)
  @Post('voice-chat')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() })) // ✅ 메모리 저장 방식 사용
  async voiceChat(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    try {
      console.log('📂 업로드된 파일 정보:', file);

      if (!file?.buffer) {
        return res.status(400).json({ error: '파일이 업로드되지 않았거나 데이터가 없습니다.' });
      }

      // 1. 음성을 텍스트로 변환 (STT)
      const text = await this.speechToTextService.transcribeAudio(file.buffer);
      console.log(`📝 변환된 텍스트: ${text}`);

      // 2. AI 응답 생성 (Gemini API)
      const aiResponse = await this.chatbotService.testGenerateResponse(text);
      console.log(`🤖 AI 응답: ${aiResponse}`);

      // 3. 응답을 음성으로 변환 (TTS)
      const audioPath = `output_${Date.now()}.mp3`;
      await this.textToSpeechService.synthesizeSpeech(aiResponse, audioPath);

      // 4. 변환된 음성 파일 반환
      res.sendFile(audioPath, { root: '.' });
    } catch (error) {
      console.error('❌ 음성 챗봇 오류:', error);
      res.status(500).json({ error: '음성 챗봇 처리 중 오류 발생' });
    }
  }

  // ✅ 음성 챗봇 흐름 (파일 저장 없이 base64로 반환)
  @Post('voice-flow')
  @UseInterceptors(FileInterceptor('audio', { storage: memoryStorage() }))
  async voiceFlowFromAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body('situation') situation: string,
    @Req() req: Request
  ) {
    try {
      const uuid = (req.user as any)?.uuid;
      if (!uuid) throw new Error('인증된 사용자 없음');
      const result = await this.chatbotService.voiceFlowFromAudio(uuid, situation, file.buffer);
      return {
        text: result.text,
        audio: result.audioBuffer.toString('base64')
      };
    } catch (error) {
      console.error('❌ voice-flow 오류:', error);
      return { error: 'voice flow 실패' };
    }
  }

  // ✅ first 챗봇 시작
  @Post('start')
  async startConversation(@Body() body: { situation: string }, @Req() req: Request) {
    const uuid = (req.user as any)?.uuid;
    if (!uuid) throw new Error('인증된 사용자 없음');
    const { text } = await this.chatbotService.startConversation(uuid, body.situation);
    return { text };
  }

  // ✅ continue 챗봇 이어가기
  @Post('continue')
  async continueConversation(@Body() body: { situation: string; userText: string }, @Req() req: Request) {
    const uuid = (req.user as any)?.uuid;
    if (!uuid) throw new Error('인증된 사용자 없음');
    const { text } = await this.chatbotService.continueConversation(uuid, body.situation, body.userText);
    return { text };
  }

  // ✅ feedback 받기
  @Post('feedback')
  async getFeedback(@Req() req: Request) {
    const uuid = (req.user as any)?.uuid;
    if (!uuid) throw new Error('인증된 사용자 없음');
    const feedback = await this.chatbotService.generateFeedback(uuid);
    return { feedback };
  }

  // 🔥 상황별 대화 관련
  // ✅ 모든 카테고리 + 해당 카테고리에 속한 상황들 반환
  @Get('categories-with-situations')
  async getCategoriesWithSituations() {
    return this.chatQnAService.getCategoriesWithSituations();
  }

  // ✅ 특정 상황의 모든 질문 가져오기
  @Get('questions/:situationId')
  async getQuestions(@Param('situationId') situationId: number) {
    return this.chatQnAService.getQuestionsBySituation(situationId);
  }

  // ✅ 유저 입력값 검증 및 다음 단계 진행
  @Post('check-answer/:situationId/:orderIndex')
  async checkAnswer(
    @Param('situationId') situationId: number,
    @Param('orderIndex') orderIndex: number,
    @Body('selectedChoice') selectedChoice: string
  ) {
    return this.chatQnAService.checkAnswer(situationId, orderIndex, selectedChoice);
  }
}