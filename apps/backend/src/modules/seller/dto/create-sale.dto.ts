import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class SaleItemDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID('4', { message: 'ID do produto deve ser um UUID válido' })
  productId: string;

  @ApiProperty({ description: 'Quantidade', minimum: 1 })
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @Min(1, { message: 'Quantidade deve ser pelo menos 1' })
  quantity: number;

  @ApiProperty({ description: 'Preço unitário' })
  @IsNumber({}, { message: 'Preço unitário deve ser um número' })
  @Min(0, { message: 'Preço unitário não pode ser negativo' })
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Desconto do item' })
  @IsOptional()
  @IsNumber({}, { message: 'Desconto deve ser um número' })
  @Min(0, { message: 'Desconto não pode ser negativo' })
  discount?: number;
}

export class CreateSaleDto {
  @ApiProperty({ description: 'Itens da venda', type: [SaleItemDto] })
  @IsArray({ message: 'Itens deve ser um array' })
  @ArrayMinSize(1, { message: 'A venda deve ter pelo menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsUUID('4', { message: 'ID do cliente deve ser um UUID válido' })
  customerId?: string;

  @ApiPropertyOptional({ description: 'Desconto geral da venda' })
  @IsOptional()
  @IsNumber({}, { message: 'Desconto deve ser um número' })
  @Min(0, { message: 'Desconto não pode ser negativo' })
  discount?: number;

  @ApiProperty({
    description: 'Método de pagamento',
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido' })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Valor pago (para cálculo de troco)' })
  @IsOptional()
  @IsNumber({}, { message: 'Valor pago deve ser um número' })
  @Min(0, { message: 'Valor pago não pode ser negativo' })
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'Observações da venda' })
  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  notes?: string;
}
