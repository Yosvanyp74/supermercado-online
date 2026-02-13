import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
    description: 'Novo status do pedido',
  })
  @IsEnum(OrderStatus, {
    message:
      'Status deve ser: PENDING, CONFIRMED, PROCESSING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED ou REFUNDED',
  })
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Observações sobre a mudança de status' })
  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  notes?: string;
}
