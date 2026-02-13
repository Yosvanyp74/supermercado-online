import { IsString, IsInt, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({ example: 'uuid-do-produto' })
  @IsUUID('4', { message: 'ID do produto deve ser um UUID válido' })
  productId: string;

  @ApiProperty({ example: -5, description: 'Pode ser negativo para redução' })
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  quantity: number;

  @ApiProperty({ example: 'Correção após contagem física' })
  @IsString({ message: 'Motivo deve ser uma string' })
  @MinLength(3, { message: 'Motivo deve ter pelo menos 3 caracteres' })
  reason: string;
}
