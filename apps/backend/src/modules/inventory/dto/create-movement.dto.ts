import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryMovementType } from '@prisma/client';

export class CreateMovementDto {
  @ApiProperty({ example: 'uuid-do-produto' })
  @IsUUID('4', { message: 'ID do produto deve ser um UUID válido' })
  productId: string;

  @ApiProperty({ enum: InventoryMovementType, example: 'IN' })
  @IsEnum(InventoryMovementType, {
    message: `Tipo deve ser um dos valores: ${Object.values(InventoryMovementType).join(', ')}`,
  })
  type: InventoryMovementType;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade deve ser pelo menos 1' })
  quantity: number;

  @ApiPropertyOptional({ example: 'Reposição de estoque semanal' })
  @IsOptional()
  @IsString({ message: 'Motivo deve ser uma string' })
  reason?: string;
}
