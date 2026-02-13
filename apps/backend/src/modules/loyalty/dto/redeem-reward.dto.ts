import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemRewardDto {
  @ApiProperty({ description: 'ID da recompensa', example: 'uuid' })
  @IsUUID('4', { message: 'ID da recompensa deve ser um UUID válido' })
  rewardId: string;
}
