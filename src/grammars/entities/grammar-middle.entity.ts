import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Grammar } from './grammars.entity';
import { GrammarBook } from './grammar-books.entity';

@Entity('grammar_middle')
export class GrammarMiddle {
  @PrimaryGeneratedColumn()
  grammar_middle_id: number;

  @ManyToOne(() => Grammar, (grammar) => grammar.grammar_middle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "grammar_id" })
  grammar: Grammar;

  @ManyToOne(() => GrammarBook, (grammarBook) => grammarBook.grammar_middle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: "grammarbook_id" })
  grammarbook: GrammarBook;

  @Column({ type: 'date' })
  added_at: Date;
}
