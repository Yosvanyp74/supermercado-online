import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role, PurchaseOrderStatus } from '@prisma/client';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('suppliers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Listar fornecedores' })
  @ApiResponse({ status: 200, description: 'Lista de fornecedores retornada' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.suppliersService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search,
    });
  }

  @Get('purchase-orders')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Listar pedidos de compra' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos de compra' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseOrderStatus })
  getPurchaseOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PurchaseOrderStatus,
  ) {
    return this.suppliersService.getPurchaseOrders({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      status,
    });
  }

  @Get(':id')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Obter fornecedor por ID' })
  @ApiResponse({ status: 200, description: 'Fornecedor retornado' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Criar fornecedor' })
  @ApiResponse({ status: 201, description: 'Fornecedor criado com sucesso' })
  @ApiResponse({ status: 400, description: 'CNPJ já cadastrado' })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  @ApiResponse({ status: 200, description: 'Fornecedor atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Desativar fornecedor' })
  @ApiResponse({ status: 200, description: 'Fornecedor desativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.remove(id);
  }

  @Post('purchase-orders')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Criar pedido de compra' })
  @ApiResponse({ status: 201, description: 'Pedido de compra criado com sucesso' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  createPurchaseOrder(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.suppliersService.createPurchaseOrder(dto, userId);
  }

  @Patch('purchase-orders/:id/receive')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Receber pedido de compra e atualizar estoque' })
  @ApiResponse({ status: 200, description: 'Pedido recebido com sucesso' })
  @ApiResponse({ status: 400, description: 'Pedido já recebido' })
  @ApiResponse({ status: 404, description: 'Pedido de compra não encontrado' })
  receivePurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { items: { itemId: string; receivedQuantity: number }[] },
  ) {
    return this.suppliersService.receivePurchaseOrder(id, body.items);
  }
}
