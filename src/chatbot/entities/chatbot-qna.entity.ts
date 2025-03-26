import { Entity, PrimaryGeneratedColumn, JoinColumn, Column, ManyToOne } from 'typeorm';
import { ChatbotSituation } from './chatbot-situations.entity';

@Entity('chatbot_qna')
export class ChatbotQna {
  @PrimaryGeneratedColumn()
  qna_id: number;

  @Column()
  situation_id: number;

  @ManyToOne(() => ChatbotSituation, (situation) => situation.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "situation_id" })
  situation: ChatbotSituation;
  
  @Column({ type: 'int', nullable: false })
  order_index: number; // 대화 순서 (ex. 1 -> 2 -> 3)

  @Column({ type: 'varchar', length: 255, nullable: false })
  jp_question: string; // 챗봇 질문 (일본어)

  @Column({ type: 'varchar', length: 255, nullable: false })
  kr_question: string; // 챗봇 질문 해석 (한국어)

  @Column({ type: 'varchar', length: 255, nullable: false })
  kr_answer: string; // 전체 문장 (한국어 정답)

  @Column({ type: 'varchar', length: 255, nullable: false })
  jp_answer: string; // 전체 문장 (일본어 정답)

  @Column({ type: 'varchar', length: 255, nullable: false })
  blank_answer: string; // 빈칸 포함된 문제 문장

  @Column({ type: 'json', nullable: false })
  choice_list: { text: string; is_correct: boolean; reason: string }[]; // 선택지 및 피드백
}