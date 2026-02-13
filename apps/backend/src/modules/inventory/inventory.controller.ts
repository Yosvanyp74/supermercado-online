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
import { Role, InventoryMovementType } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Listar inventário com filtros' })
  @ApiResponse({ status: 200, description: 'Inventário retornado com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean })
  getInventory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('lowStock') lowStock?: boolean,
  ) {
    return this.inventoryService.getInventory({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search,
      categoryId,
      lowStock: lowStock === true || (lowStock as any) === 'true',
    });
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Listar produtos com estoque baixo' })
  @ApiResponse({ status: 200, description: 'Produtos com estoque baixo retornados com sucesso' })
  getLowStock() {
    return this.inventoryService.getLowStock();
  }

  @Get('movements')
  @ApiOperation({ summary: 'Histórico de movimentações de estoque' })
  @ApiResponse({ status: 200, description: 'Movimentações retornadas com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: InventoryMovementType })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getMovements(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('productId') productId?: string,
    @Query('type') type?: InventoryMovementType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.inventoryService.getMovements({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      productId,
      type,
      startDate,
      endDate,
    });
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Consultar estoque de um produto' })
  @ApiResponse({ status: 200, description: 'Estoque retornado com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  getStock(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventoryService.getStock(productId);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Registrar movimentação de estoque' })
  @ApiResponse({ status: 201, description: 'Movimentação registrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  createMovement(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMovementDto,
  ) {
    return this.inventoryService.createMovement(dto, userId);
  }

  @Post('adjust')
  @Roles(Role.MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Ajustar estoque (gerente/admin)' })
  @ApiResponse({ status: 201, description: 'Estoque ajustado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou ajuste resultaria em estoque negativo' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  adjustStock(
    @CurrentUser('id') userId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(dto, userId);
  }
}
