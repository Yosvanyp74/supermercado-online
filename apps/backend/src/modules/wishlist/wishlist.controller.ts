import {
  Controller,
  Get,
  Post,
  Delete,
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
import { WishlistService } from './wishlist.service';
import { CurrentUser } from '../../common/decorators';

@ApiTags('wishlist')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Obter lista de desejos do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de desejos retornada' })
  getWishlist(@CurrentUser('id') userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Adicionar/remover produto da lista de desejos (toggle)' })
  @ApiResponse({ status: 200, description: 'Produto adicionado/removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  addItem(
    @CurrentUser('id') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.wishlistService.addItem(userId, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remover produto da lista de desejos' })
  @ApiResponse({ status: 200, description: 'Produto removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado na lista' })
  removeItem(
    @CurrentUser('id') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.wishlistService.removeItem(userId, productId);
  }

  @Get(':productId/check')
  @ApiOperation({ summary: 'Verificar se produto está na lista de desejos' })
  @ApiResponse({ status: 200, description: 'Status retornado' })
  isInWishlist(
    @CurrentUser('id') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.wishlistService.isInWishlist(userId, productId);
  }
}
