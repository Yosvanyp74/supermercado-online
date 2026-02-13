import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PurchaseOrderItemDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID('4', { message: 'ID do produto deve ser um UUID válido' })
  productId: string;

  @ApiProperty({ description: 'Quantidade', example: 100 })
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade mínima é 1' })
  quantity: number;

  @ApiProperty({ description: 'Custo unitário', example: 5.5 })
  @IsNumber({}, { message: 'Custo unitário deve ser um número' })
  @Min(0, { message: 'Custo unitário deve ser positivo' })
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'ID do fornecedor' })
  @IsUUID('4', { message: 'ID do fornecedor deve ser um UUID válido' })
  supplierId: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Data prevista de entrega' })
  @IsOptional()
  @IsDateString({}, { message: 'Data prevista inválida' })
  expectedDeliveryDate?: string;

  @ApiProperty({ description: 'Itens do pedido de compra', type: [PurchaseOrderItemDto] })
  @IsArray({ message: 'Itens devem ser um array' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}
