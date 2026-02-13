import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID do produto', example: 'uuid' })
  @IsUUID('4', { message: 'ID do produto deve ser um UUID válido' })
  productId: string;

  @ApiProperty({ description: 'Avaliação de 1 a 5', example: 5 })
  @IsInt({ message: 'Avaliação deve ser um número inteiro' })
  @Min(1, { message: 'Avaliação mínima é 1' })
  @Max(5, { message: 'Avaliação máxima é 5' })
  rating: number;

  @ApiPropertyOptional({ description: 'Título da avaliação' })
  @IsOptional()
  @IsString({ message: 'Título deve ser texto' })
  title?: string;

  @ApiPropertyOptional({ description: 'Comentário da avaliação' })
  @IsOptional()
  @IsString({ message: 'Comentário deve ser texto' })
  comment?: string;

  @ApiPropertyOptional({ description: 'URLs das imagens', type: [String] })
  @IsOptional()
  @IsArray({ message: 'Imagens devem ser um array' })
  @IsString({ each: true, message: 'Cada imagem deve ser uma URL válida' })
  images?: string[];
}
