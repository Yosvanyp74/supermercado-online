import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({ description: 'Código do cupom', example: 'DESCONTO10' })
  @IsString({ message: 'Código deve ser texto' })
  code: string;

  @ApiProperty({ description: 'Total do pedido', example: 150.0 })
  @IsNumber({}, { message: 'Total do pedido deve ser um número' })
  @Min(0, { message: 'Total do pedido deve ser positivo' })
  orderTotal: number;
}
