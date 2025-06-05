import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TextToSpeechService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_API_KEY') ?? ''
  }

  // ✅ 텍스트 필터링 로직
  private cleanText(text: string): string {
    return text
      .replace(/\n+/g, ' ')  // 줄바꿈을 공백으로 변환
      .replace(/[*\-•]+/g, '') // 하이픈, 별표 등 제거
      .replace(/\s+/g, ' ')  // 연속된 공백을 하나로 변환
      .trim(); // 앞뒤 공백 제거
  }

  async synthesizeSpeech(text: string, outputPath: string): Promise<void> {
    
    const cleanedText = this.cleanText(text);
    
    const response = await axios.post(
      `${this.apiUrl}?key=${this.apiKey}`,
      {
        input: { text: cleanedText },
        voice: { languageCode: 'ja-JP', ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'LINEAR16' }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    fs.writeFileSync(outputPath, Buffer.from(response.data.audioContent, 'base64'));
  }

  // ✅ MP3 Buffer 반환용 (파일 저장 없이)
  async synthesizeSpeechToBuffer(text: string): Promise<Buffer> {
    const cleanedText = this.cleanText(text);

    const response = await axios.post(
      `${this.apiUrl}?key=${this.apiKey}`,
      {
        input: { text: cleanedText },
        voice: { languageCode: 'ja-JP', ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3' }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const audioContent: string = response.data.audioContent;
    return Buffer.from(audioContent, 'base64');
  }
}