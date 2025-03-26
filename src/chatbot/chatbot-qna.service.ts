import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotCategory } from './entities/chatbot-categories.entity';
import { ChatbotSituation } from './entities/chatbot-situations.entity';
import { ChatbotQna } from './entities/chatbot-qna.entity';

@Injectable()
export class ChatQnAService {
  constructor(
    @InjectRepository(ChatbotCategory)
    private readonly chatbotCategoryRepo: Repository<ChatbotCategory>,
    @InjectRepository(ChatbotSituation)
    private readonly chatbotSituationRepo: Repository<ChatbotSituation>,
    @InjectRepository(ChatbotQna)
    private readonly chatbotQnaRepo: Repository<ChatbotQna>,
  ) {}

  // 🔥 상황별 대화 관련
  // ✅ 모든 카테고리 + 해당 카테고리에 속한 상황 리스트 가져오기
  async getCategoriesWithSituations() {
    const categories = await this.chatbotCategoryRepo.find({
      relations: ['situations'], // ✅ 카테고리에 속한 상황 리스트 포함
    });

    return categories.map(category => ({
      category_id: category.category_id,
      category_name: category.category_name,
      situations: category.situations.map(situation => ({
        situation_id: situation.situation_id,
        situation_name: situation.situation_name
      })),
    }));
  }

  // ✅ 특정 상황에 속한 모든 질문 가져오기
  async getQuestionsBySituation(situationId: number) {
    const questions = await this.chatbotQnaRepo.find({
      where: { situation_id: situationId },
      order: { order_index: 'ASC' },
    });

    return questions.map(q => ({
      qna_id: q.qna_id,
      order_index: q.order_index,
      jp_question: q.jp_question,
      kr_question: q.kr_question,
      jp_answer: q.jp_answer,
      kr_answer: q.kr_answer,
      blank_answer: q.blank_answer,
      choices: q.choice_list,
    }));
  }

  // ✅ 유저 선택값 검증 및 다음 단계 진행
  async checkAnswer(situationId: number, orderIndex: number, selectedChoice: string) {
    const qna = await this.chatbotQnaRepo.findOne({
      where: { situation_id: situationId, order_index: orderIndex },
    });

    if (!qna) {
      return { success: false, message: "잘못된 요청입니다." };
    }
    
    // 선택한 답이 맞는지 확인
    const choice = qna.choice_list.find(c => c.text === selectedChoice);

    if (!choice) {
      return { success: false, message: "유효하지 않은 선택지입니다。" };
    }

    if (choice.is_correct) {
      // 정답일 경우 다음 질문 반환
      // 같은 situation_id 내에서 `order_index` 기준으로 다음 질문 가져오기
      const nextQnA = await this.chatbotQnaRepo.findOne({
        where: { situation_id: situationId, order_index: orderIndex + 1 },
      });

      return { 
        success: true, 
        message: "정답입니다!", 
        explanation: choice.reason, // 정답 피드백 제공
        nextQnA: nextQnA ?? null // 마지막 질문이었을 경우 next가 없으니 null로 리턴
      };
    } else {
      return { 
        success: false, 
        message: "틀렸습니다. 다시 선택하세요。",
        explanation: choice.reason // 오답 피드백 제공
      };
    }
  }
}