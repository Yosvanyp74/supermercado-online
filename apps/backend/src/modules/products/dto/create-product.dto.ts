import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsUUID,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'SKU-001' })
  @IsString({ message: 'SKU deve ser uma string' })
  @MinLength(1, { message: 'SKU é obrigatório' })
  sku: string;

  @ApiPropertyOptional({ example: '7891234567890' })
  @IsOptional()
  @IsString({ message: 'Código de barras deve ser uma string' })
  barcode?: string;

  @ApiProperty({ example: 'Arroz Integral Orgânico 1kg' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: 'Arroz integral orgânico de alta qualidade' })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  description?: string;

  @ApiPropertyOptional({ example: 'Arroz integral orgânico' })
  @IsOptional()
  @IsString({ message: 'Descrição curta deve ser uma string' })
  @MaxLength(160, { message: 'Descrição curta deve ter no máximo 160 caracteres' })
  shortDescription?: string;

  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsUUID('4', { message: 'ID da categoria deve ser um UUID válido' })
  categoryId: string;

  @ApiPropertyOptional({ example: 'uuid-da-marca' })
  @IsOptional()
  @IsUUID('4', { message: 'ID da marca deve ser um UUID válido' })
  brandId?: string;

  @ApiProperty({ example: 12.9 })
  @IsNumber({}, { message: 'Preço deve ser um número' })
  @Min(0, { message: 'Preço deve ser maior ou igual a zero' })
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @IsNumber({}, { message: 'Preço de custo deve ser um número' })
  @Min(0, { message: 'Preço de custo deve ser maior ou igual a zero' })
  @Type(() => Number)
  costPrice?: number;

  @ApiPropertyOptional({ example: 15.9 })
  @IsOptional()
  @IsNumber({}, { message: 'Preço comparativo deve ser um número' })
  @Min(0, { message: 'Preço comparativo deve ser maior ou igual a zero' })
  @Type(() => Number)
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 100, default: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Estoque deve ser um número' })
  @Min(0, { message: 'Estoque deve ser maior ou igual a zero' })
  @Type(() => Number)
  stock?: number;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsOptional()
  @IsNumber({}, { message: 'Estoque mínimo deve ser um número' })
  @Min(0, { message: 'Estoque mínimo deve ser maior ou igual a zero' })
  @Type(() => Number)
  minStock?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber({}, { message: 'Estoque máximo deve ser um número' })
  @Min(0, { message: 'Estoque máximo deve ser maior ou igual a zero' })
  @Type(() => Number)
  maxStock?: number;

  @ApiPropertyOptional({ example: 'kg', default: 'un' })
  @IsOptional()
  @IsString({ message: 'Unidade deve ser uma string' })
  unit?: string;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @IsNumber({}, { message: 'Peso deve ser um número' })
  @Min(0, { message: 'Peso deve ser maior ou igual a zero' })
  @Type(() => Number)
  weight?: number;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber({}, { message: 'Volume deve ser um número' })
  @Min(0, { message: 'Volume deve ser maior ou igual a zero' })
  @Type(() => Number)
  volume?: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString({ message: 'URL da imagem principal deve ser uma string' })
  mainImageUrl?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Status inválido' })
  status?: ProductStatus;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'Campo destaque deve ser verdadeiro ou falso' })
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'Campo orgânico deve ser verdadeiro ou falso' })
  isOrganic?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Taxa de imposto deve ser um número' })
  @Min(0, { message: 'Taxa de imposto deve ser maior ou igual a zero' })
  @Type(() => Number)
  taxRate?: number;

  @ApiPropertyOptional({ example: ['orgânico', 'integral'], default: [] })
  @IsOptional()
  @IsArray({ message: 'Tags deve ser um array' })
  @IsString({ each: true, message: 'Cada tag deve ser uma string' })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Corredor 3' })
  @IsOptional()
  @IsString({ message: 'Localização no corredor deve ser uma string' })
  aisleLocation?: string;

  @ApiPropertyOptional({ example: 'Prateleira B2' })
  @IsOptional()
  @IsString({ message: 'Posição na prateleira deve ser uma string' })
  shelfPosition?: string;
}
