import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RateDeliveryDto {
  @ApiProperty({ description: 'Avaliação de 1 a 5', example: 5 })
  @IsInt({ message: 'Avaliação deve ser um número inteiro' })
  @Min(1, { message: 'Avaliação mínima é 1' })
  @Max(5, { message: 'Avaliação máxima é 5' })
  rating: number;

  @ApiPropertyOptional({ description: 'Comentário sobre a entrega' })
  @IsOptional()
  @IsString({ message: 'Comentário deve ser texto' })
  comment?: string;
}
