import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuickCreateCustomerDto {
  @ApiProperty({ description: 'Nome do cliente' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ description: 'Telefone do cliente' })
  @IsString({ message: 'Telefone deve ser uma string' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  phone: string;

  @ApiPropertyOptional({ description: 'E-mail do cliente' })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;
}
