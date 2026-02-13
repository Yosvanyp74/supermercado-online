import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Frutas e Verduras' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: 'Frutas, verduras e legumes frescos' })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString({ message: 'URL da imagem deve ser uma string' })
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'uuid-da-categoria-pai' })
  @IsOptional()
  @IsUUID('4', { message: 'ID da categoria pai deve ser um UUID válido' })
  parentId?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt({ message: 'Posição deve ser um número inteiro' })
  @Min(0, { message: 'Posição deve ser maior ou igual a zero' })
  @Type(() => Number)
  position?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean({ message: 'Status ativo deve ser um valor booleano' })
  isActive?: boolean;
}
