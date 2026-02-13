import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: 'Receber atualizações de pedidos' })
  @IsOptional()
  @IsBoolean({ message: 'orderUpdates deve ser booleano' })
  orderUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Receber promoções' })
  @IsOptional()
  @IsBoolean({ message: 'promotions deve ser booleano' })
  promotions?: boolean;

  @ApiPropertyOptional({ description: 'Receber atualizações de entrega' })
  @IsOptional()
  @IsBoolean({ message: 'deliveryUpdates deve ser booleano' })
  deliveryUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Receber atualizações de fidelidade' })
  @IsOptional()
  @IsBoolean({ message: 'loyaltyUpdates deve ser booleano' })
  loyaltyUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Habilitar notificações push' })
  @IsOptional()
  @IsBoolean({ message: 'pushEnabled deve ser booleano' })
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Habilitar notificações por e-mail' })
  @IsOptional()
  @IsBoolean({ message: 'emailEnabled deve ser booleano' })
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Habilitar notificações por SMS' })
  @IsOptional()
  @IsBoolean({ message: 'smsEnabled deve ser booleano' })
  smsEnabled?: boolean;
}
