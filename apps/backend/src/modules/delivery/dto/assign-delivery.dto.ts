import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDeliveryDto {
  @ApiProperty({ description: 'ID do pedido', example: 'uuid' })
  @IsUUID('4', { message: 'ID do pedido deve ser um UUID válido' })
  orderId: string;

  @ApiProperty({ description: 'ID do entregador', example: 'uuid' })
  @IsUUID('4', { message: 'ID do entregador deve ser um UUID válido' })
  deliveryPersonId: string;
}
