import { IsNotEmpty, IsUUID } from 'class-validator';

export class PinTaskDto {
  @IsUUID()
  @IsNotEmpty()
  taskId: string;
}
