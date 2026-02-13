import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({ description: 'Código do cupom', example: 'DESCONTO10' })
  @IsString({ message: 'Código deve ser texto' })
  code: string;

  @ApiPropertyOptional({ description: 'Descrição do cupom' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Tipo do cupom', enum: CouponType })
  @IsEnum(CouponType, { message: 'Tipo de cupom inválido' })
  type: CouponType;

  @ApiProperty({ description: 'Valor do desconto', example: 10 })
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0, { message: 'Valor mínimo é 0' })
  value: number;

  @ApiPropertyOptional({ description: 'Valor mínimo do pedido' })
  @IsOptional()
  @IsNumber({}, { message: 'Valor mínimo do pedido deve ser um número' })
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: 'Valor máximo de desconto' })
  @IsOptional()
  @IsNumber({}, { message: 'Valor máximo de desconto deve ser um número' })
  @Min(0)
  maxDiscountValue?: number;

  @ApiPropertyOptional({ description: 'Número máximo de usos' })
  @IsOptional()
  @IsInt({ message: 'Máximo de usos deve ser inteiro' })
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Data de início do cupom' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de início inválida' })
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Data de expiração do cupom' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de expiração inválida' })
  expiresAt?: string;
}
