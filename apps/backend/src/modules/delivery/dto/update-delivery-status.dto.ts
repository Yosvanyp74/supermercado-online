import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryStatus } from '@prisma/client';

export class UpdateDeliveryStatusDto {
  @ApiProperty({
    description: 'Status da entrega',
    enum: DeliveryStatus,
    example: DeliveryStatus.IN_TRANSIT,
  })
  @IsEnum(DeliveryStatus, { message: 'Status de entrega inválido' })
  status: DeliveryStatus;

  @ApiPropertyOptional({ description: 'Motivo da falha (se aplicável)' })
  @IsOptional()
  @IsString()
  failureReason?: string;
}
