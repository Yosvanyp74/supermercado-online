import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScanItemDto {
  @ApiProperty({ description: 'Código de barras do produto' })
  @IsString({ message: 'Código de barras deve ser uma string' })
  @IsNotEmpty({ message: 'Código de barras é obrigatório' })
  barcode: string;
}
