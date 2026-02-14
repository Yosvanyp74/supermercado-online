import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DeliveryService } from './delivery.service';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { RateDeliveryDto } from './dto/rate-delivery.dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('delivery')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('assign')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Atribuir entregador a um pedido' })
  @ApiResponse({ status: 201, description: 'Entrega atribuída com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  assignDelivery(@Body() dto: AssignDeliveryDto) {
    return this.deliveryService.assignDelivery(dto);
  }

  @Get('active')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Obter entregas ativas do entregador' })
  @ApiResponse({ status: 200, description: 'Lista de entregas ativas' })
  getActiveDeliveries(@CurrentUser('id') userId: string) {
    return this.deliveryService.getActiveDeliveries(userId);
  }

  @Get('history')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Obter histórico de entregas do entregador' })
  @ApiResponse({ status: 200, description: 'Histórico de entregas' })
  getDeliveryHistory(@CurrentUser('id') userId: string) {
    return this.deliveryService.getDeliveryHistory(userId);
  }

  @Patch(':id/location')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Atualizar localização da entrega' })
  @ApiResponse({ status: 200, description: 'Localização atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Entrega não encontrada' })
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.deliveryService.updateLocation(id, dto.latitude, dto.longitude);
  }

  @Patch(':id/status')
  @Roles(Role.DELIVERY)
  @ApiOperation({ summary: 'Atualizar status da entrega' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Status inválido' })
  @ApiResponse({ status: 404, description: 'Entrega não encontrada' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateStatus(id, dto.status, userId, dto.failureReason);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Obter informações de entrega por pedido' })
  @ApiResponse({ status: 200, description: 'Dados da entrega retornados' })
  @ApiResponse({ status: 404, description: 'Entrega não encontrada' })
  getDeliveryByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.deliveryService.getDeliveryByOrder(orderId);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Avaliar uma entrega' })
  @ApiResponse({ status: 200, description: 'Avaliação registrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Entrega não pode ser avaliada' })
  @ApiResponse({ status: 404, description: 'Entrega não encontrada' })
  rateDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateDeliveryDto,
  ) {
    return this.deliveryService.rateDelivery(id, dto);
  }
}
