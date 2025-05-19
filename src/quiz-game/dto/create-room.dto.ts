import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;
}
