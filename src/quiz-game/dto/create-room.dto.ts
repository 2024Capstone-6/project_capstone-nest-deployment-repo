import { IsString, IsNotEmpty, MaxLength, IsIn } from 'class-validator';
import { DIFFICULTY_LEVELS } from '../schemas/room.schema'; // 위에서 export한 상수 사용

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @IsString()
  @IsIn(DIFFICULTY_LEVELS)
  difficulty: string;
}
