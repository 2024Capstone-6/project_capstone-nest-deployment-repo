import { Unique, Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../user/entity/user.entity';

@Unique(['user', 'learning_level'])
@Entity('word_progress')
export class WordProgress {
  @PrimaryGeneratedColumn()
  word_progress_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: 'varchar', length: 10 })
  learning_level: string; // ex: 'JLPT N1', 'JLPT N2'

  @Column({ type: 'int', default: 0 })
  current_index: number; // 셔플 리스트에서의 위치

  @UpdateDateColumn()
  updated_at: Date;
}
