import {
  IsString,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Nome do fornecedor', example: 'Distribuidora ABC' })
  @IsString({ message: 'Nome deve ser texto' })
  name: string;

  @ApiPropertyOptional({ description: 'Nome do contato' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ description: 'E-mail do fornecedor' })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone do fornecedor' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Endereço do fornecedor' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'CNPJ do fornecedor' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}
