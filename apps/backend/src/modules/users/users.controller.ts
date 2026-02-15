import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Listar todos os usuários' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll({ page, limit, search, role });
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter perfil próprio' })
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar perfil próprio' })
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Alterar senha própria' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Obter usuário por ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Desativar usuário' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Addresses
  @Get(':id/addresses')
  @ApiOperation({ summary: 'Listar endereços do usuário' })
  getAddresses(@Param('id') id: string) {
    return this.usersService.getAddresses(id);
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Adicionar endereço' })
  createAddress(@Param('id') id: string, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(id, dto);
  }

  @Patch(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Atualizar endereço' })
  updateAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Body() dto: Partial<CreateAddressDto>,
  ) {
    return this.usersService.updateAddress(id, addressId, dto);
  }

  @Delete(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Remover endereço' })
  deleteAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.deleteAddress(id, addressId);
  }
}
