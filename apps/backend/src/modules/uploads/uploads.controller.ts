import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';
import { Response } from 'express';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

const imageFileFilter = (_req: any, file: any, callback: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return callback(
      new BadRequestException('Apenas imagens são permitidas (jpg, png, gif, webp)'),
      false,
    );
  }
  callback(null, true);
};

const ALLOWED_FOLDERS = ['products', 'avatars', 'categories'];

const createStorage = (folder: string) =>
  diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(UPLOADS_DIR, folder);
      const fs = require('fs');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;
      cb(null, uniqueName);
    },
  });

const storage = createStorage('products');

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  @Post('image')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload de imagem (produto, avatar, categoria)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const targetFolder = folder && ALLOWED_FOLDERS.includes(folder) ? folder : 'products';

    // If target folder differs from default (products), move the file
    if (targetFolder !== 'products') {
      const fs = require('fs');
      const targetDir = join(UPLOADS_DIR, targetFolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const oldPath = file.path;
      const newPath = join(targetDir, file.filename);
      fs.renameSync(oldPath, newPath);
    }

    const url = `/api/uploads/files/${targetFolder}/${file.filename}`;

    return {
      url,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Get('files/:folder/:filename')
  @ApiOperation({ summary: 'Servir arquivo de imagem' })
  serveFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Sanitize to prevent directory traversal
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');

    const filePath = join(UPLOADS_DIR, safeFolder, safeFilename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }

    return res.sendFile(filePath);
  }
}
