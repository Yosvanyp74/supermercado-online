import {
  Controller,
  Get,
  Query,
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
import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter dashboard geral (admin/gerente)' })
  @ApiResponse({ status: 200, description: 'Dashboard retornado com sucesso' })
  getAdminDashboard() {
    return this.analyticsService.getAdminDashboard();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Obter dados de vendas por período' })
  @ApiResponse({ status: 200, description: 'Dados de vendas retornados' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getSalesDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getSalesDashboard({ startDate, endDate });
  }

  @Get('products')
  @ApiOperation({ summary: 'Obter produtos mais vendidos' })
  @ApiResponse({ status: 200, description: 'Produtos mais vendidos retornados' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopProducts(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getTopProducts({
      startDate,
      endDate,
      limit: limit ? +limit : undefined,
    });
  }

  @Get('customers')
  @ApiOperation({ summary: 'Obter análise de clientes' })
  @ApiResponse({ status: 200, description: 'Análise de clientes retornada' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getCustomerAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getCustomerAnalytics({ startDate, endDate });
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Obter receita diária (dados para gráfico)' })
  @ApiResponse({ status: 200, description: 'Dados de receita retornados' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getRevenueByDay(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getRevenueByDay({ startDate, endDate });
  }

  @Get('sellers')
  @ApiOperation({ summary: 'Obter desempenho dos vendedores' })
  @ApiResponse({ status: 200, description: 'Desempenho dos vendedores retornado' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getSellerPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getSellerPerformance({ startDate, endDate });
  }
}
