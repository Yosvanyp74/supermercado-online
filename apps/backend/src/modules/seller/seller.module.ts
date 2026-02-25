import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SellerController],
  providers: [SellerService],
  exports: [SellerService],
})
export class SellerModule {}
