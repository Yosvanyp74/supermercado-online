import { Delete } from '@nestjs/common';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role, OrderStatus, OrderType } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';


@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar pedido (admin)' })
  @ApiResponse({ status: 200, description: 'Pedido eliminado com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async deleteOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.deleteOrderCascade(id, userId);
  }

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Criar novo pedido' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto ou endereço não encontrado' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Listar todos os pedidos (admin/gerente/funcionário)' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos retornada com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: OrderType })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
    @Query('customerId') customerId?: string,
    @Query('type') type?: OrderType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.ordersService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      status,
      customerId,
      type,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Listar meus pedidos' })
  @ApiResponse({ status: 200, description: 'Pedidos do usuário retornados com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  findMyOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findByUser(userId, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um pedido' })
  @ApiResponse({ status: 200, description: 'Pedido retornado com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão para ver este pedido' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    const order = await this.ordersService.findOne(id);

    const adminRoles: Role[] = [Role.ADMIN, Role.MANAGER, Role.EMPLOYEE];
    if (order.customerId !== user.id && !adminRoles.includes(user.role)) {
      throw new ForbiddenException('Você não tem permissão para ver este pedido');
    }

    return order;
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Atualizar status do pedido' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Transição de status não permitida' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.updateStatus(id, dto, userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar pedido' })
  @ApiResponse({ status: 200, description: 'Pedido cancelado com sucesso' })
  @ApiResponse({ status: 400, description: 'Pedido não pode ser cancelado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para cancelar este pedido' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancel(id, userId, reason);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Rastrear pedido' })
  @ApiResponse({ status: 200, description: 'Dados de rastreamento retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  getTracking(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getTracking(id);
  }
}
