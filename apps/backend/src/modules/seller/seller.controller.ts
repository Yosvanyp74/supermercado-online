import {
  Controller,
  Get,
  Post,
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
import { Role } from '@prisma/client';
import { SellerService } from './seller.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ScanItemDto } from './dto/scan-item.dto';
import { QuickCreateCustomerDto } from './dto/quick-create-customer.dto';
import { CurrentUser } from '../../common/decorators';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('seller')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.SELLER, Role.ADMIN, Role.MANAGER)
@Controller('seller')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  // ==================== SALES ====================

  @Post('sales')
  @ApiOperation({ summary: 'Criar venda no PDV' })
  @ApiResponse({ status: 201, description: 'Venda criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente' })
  createSale(
    @CurrentUser('id') sellerId: string,
    @Body() dto: CreateSaleDto,
  ) {
    return this.sellerService.createSale(sellerId, dto);
  }

  @Get('sales/history')
  @ApiOperation({ summary: 'Histórico de vendas do vendedor' })
  @ApiResponse({ status: 200, description: 'Histórico retornado com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getSaleHistory(
    @CurrentUser('id') sellerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sellerService.getSaleHistory(sellerId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      startDate,
      endDate,
    });
  }

  @Get('sales/suspended')
  @ApiOperation({ summary: 'Listar vendas suspensas' })
  @ApiResponse({ status: 200, description: 'Vendas suspensas retornadas com sucesso' })
  getSuspendedSales(@CurrentUser('id') sellerId: string) {
    return this.sellerService.getSuspendedSales(sellerId);
  }

  @Get('sales/:id')
  @ApiOperation({ summary: 'Detalhes de uma venda' })
  @ApiResponse({ status: 200, description: 'Venda retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Venda não encontrada' })
  getSaleById(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellerService.getSaleById(id);
  }

  @Post('sales/:id/suspend')
  @ApiOperation({ summary: 'Suspender uma venda' })
  @ApiResponse({ status: 200, description: 'Venda suspensa com sucesso' })
  @ApiResponse({ status: 404, description: 'Venda não encontrada' })
  suspendSale(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellerService.suspendSale(id);
  }

  @Post('sales/:id/resume')
  @ApiOperation({ summary: 'Retomar uma venda suspensa' })
  @ApiResponse({ status: 200, description: 'Venda retomada com sucesso' })
  @ApiResponse({ status: 404, description: 'Venda não encontrada' })
  resumeSale(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellerService.resumeSale(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do vendedor (hoje)' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  getSellerStats(@CurrentUser('id') sellerId: string) {
    return this.sellerService.getSellerStats(sellerId);
  }

  // ==================== ORDER PICKING ====================

  @Get('orders/pending')
  @ApiOperation({ summary: 'Pedidos pendentes para picking' })
  @ApiResponse({ status: 200, description: 'Pedidos pendentes retornados com sucesso' })
  getPendingOrders() {
    return this.sellerService.getPendingOrders();
  }

  @Post('orders/:orderId/accept')
  @ApiOperation({ summary: 'Aceitar pedido para picking' })
  @ApiResponse({ status: 200, description: 'Pedido aceito com sucesso' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  @ApiResponse({ status: 409, description: 'Pedido já aceito por outro vendedor' })
  acceptOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.sellerService.acceptOrder(orderId, sellerId);
  }

  @Get('picking')
  @ApiOperation({ summary: 'Minhas ordens de picking ativas' })
  @ApiResponse({ status: 200, description: 'Ordens retornadas com sucesso' })
  getMyPickingOrders(@CurrentUser('id') sellerId: string) {
    return this.sellerService.getMyPickingOrders(sellerId);
  }

  @Get('picking/:id')
  @ApiOperation({ summary: 'Detalhes de ordem de picking' })
  @ApiResponse({ status: 200, description: 'Ordem retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Ordem não encontrada' })
  getPickingOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellerService.getPickingOrder(id);
  }

  @Post('picking/:pickingOrderId/scan')
  @ApiOperation({ summary: 'Escanear item no picking' })
  @ApiResponse({ status: 200, description: 'Item escaneado' })
  @ApiResponse({ status: 404, description: 'Ordem de picking não encontrada' })
  scanItem(
    @Param('pickingOrderId', ParseUUIDPipe) pickingOrderId: string,
    @Body() dto: ScanItemDto,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.sellerService.scanItem(pickingOrderId, dto.barcode, sellerId);
  }

  @Post('picking/:pickingItemId/manual-pick')
  @ApiOperation({ summary: 'Marcar item como coletado manualmente' })
  @ApiResponse({ status: 200, description: 'Item marcado como coletado' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  markItemPicked(
    @Param('pickingItemId', ParseUUIDPipe) pickingItemId: string,
    @CurrentUser('id') sellerId: string,
    @Body('notes') notes?: string,
  ) {
    return this.sellerService.markItemPicked(pickingItemId, sellerId, notes);
  }

  @Post('picking/:pickingOrderId/complete')
  @ApiOperation({ summary: 'Concluir ordem de picking' })
  @ApiResponse({ status: 200, description: 'Ordem concluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Ordem não encontrada' })
  completePickingOrder(
    @Param('pickingOrderId', ParseUUIDPipe) pickingOrderId: string,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.sellerService.completePickingOrder(pickingOrderId, sellerId);
  }

  // ==================== PRODUCTS ====================

  @Get('products/barcode/:barcode')
  @ApiOperation({ summary: 'Buscar produto por código de barras' })
  @ApiResponse({ status: 200, description: 'Produto encontrado' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  getProductByBarcode(@Param('barcode') barcode: string) {
    return this.sellerService.getProductByBarcode(barcode);
  }

  // ==================== CUSTOMERS ====================

  @Get('customers/search')
  @ApiOperation({ summary: 'Buscar clientes' })
  @ApiResponse({ status: 200, description: 'Clientes encontrados' })
  @ApiQuery({ name: 'q', required: true, description: 'Termo de busca' })
  searchCustomers(@Query('q') query: string) {
    return this.sellerService.searchCustomers(query);
  }

  @Post('customers/quick')
  @ApiOperation({ summary: 'Criar cliente rápido' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Telefone já cadastrado' })
  quickCreateCustomer(@Body() dto: QuickCreateCustomerDto) {
    return this.sellerService.quickCreateCustomer(dto);
  }
}
