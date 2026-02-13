import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('points')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obter conta de fidelidade do usuário' })
  @ApiResponse({ status: 200, description: 'Conta retornada com sucesso' })
  getAccount(@CurrentUser('id') userId: string) {
    return this.loyaltyService.getAccount(userId);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obter histórico de transações de pontos' })
  @ApiResponse({ status: 200, description: 'Histórico retornado com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTransactions(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.loyaltyService.getTransactions(userId, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Post('redeem')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Resgatar recompensa com pontos' })
  @ApiResponse({ status: 200, description: 'Recompensa resgatada com sucesso' })
  @ApiResponse({ status: 400, description: 'Pontos insuficientes' })
  @ApiResponse({ status: 404, description: 'Recompensa não encontrada' })
  redeemPoints(
    @CurrentUser('id') userId: string,
    @Body() dto: RedeemRewardDto,
  ) {
    return this.loyaltyService.redeemPoints(userId, dto.rewardId);
  }

  @Get('rewards')
  @Public()
  @ApiOperation({ summary: 'Listar recompensas disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de recompensas retornada' })
  getRewards() {
    return this.loyaltyService.getRewards();
  }
}
