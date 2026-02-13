import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
      process.env.DEV_MACHINE_URL || 'http://172.20.10.3:3000',
      process.env.DEV_EXPO_URL || 'http://172.20.10.3:8081',
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
    ].filter((v): v is string => Boolean(v)),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Supermercado API')
    .setDescription('API completa para plataforma de supermercado - Venâncio Aires, RS')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação')
    .addTag('users', 'Gestão de usuários')
    .addTag('products', 'Gestão de produtos')
    .addTag('categories', 'Categorias de produtos')
    .addTag('cart', 'Carrinho de compras')
    .addTag('orders', 'Gestão de pedidos')
    .addTag('payments', 'Pagamentos')
    .addTag('inventory', 'Controle de estoque')
    .addTag('delivery', 'Entregas')
    .addTag('seller', 'POS Móvel / Vendedor')
    .addTag('reviews', 'Avaliações')
    .addTag('coupons', 'Cupons de desconto')
    .addTag('loyalty', 'Programa de fidelidade')
    .addTag('notifications', 'Notificações')
    .addTag('analytics', 'Analytics e relatórios')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  if (process.env.NODE_ENV === 'development') {
    const fs = await import('fs');
    const path = await import('path');

    const outputPath = path.resolve(process.cwd(), 'openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  }
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
