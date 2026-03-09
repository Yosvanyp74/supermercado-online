import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScanItemDto {
  @ApiProperty({ description: 'Código de barras do produto' })
  @IsString({ message: 'Código de barras deve ser uma string' })
  @IsNotEmpty({ message: 'Código de barras é obrigatório' })
  barcode: string;

  @ApiPropertyOptional({ description: 'Quantidade coletada confirmada pelo vendedor' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
