import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FulfillmentType } from '@prisma/client';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'uuid-do-produto', description: 'ID do produto' })
  @IsUUID('4', { message: 'ID do produto deve ser um UUID válido' })
  productId: string;

  @ApiProperty({ example: 1, description: 'Quantidade do produto', minimum: 1 })
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade deve ser pelo menos 1' })
  quantity: number;

  @ApiPropertyOptional({ description: 'Observações sobre o item' })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Itens do pedido',
  })
  @IsArray({ message: 'Itens devem ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({
    enum: FulfillmentType,
    example: FulfillmentType.DELIVERY,
    description: 'Tipo de entrega',
  })
  @IsEnum(FulfillmentType, {
    message: 'Tipo de entrega deve ser DELIVERY ou PICKUP',
  })
  fulfillmentType: FulfillmentType;

  @ApiPropertyOptional({
    example: 'uuid-do-endereco',
    description: 'ID do endereço de entrega (obrigatório para DELIVERY)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do endereço deve ser um UUID válido' })
  deliveryAddressId?: string;

  @ApiPropertyOptional({
    example: 'CUPOM10',
    description: 'Código do cupom de desconto',
  })
  @IsOptional()
  @IsString({ message: 'Código do cupom deve ser uma string' })
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Observações sobre o pedido' })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  notes?: string;
}
