import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  /**
   * Deletes a file from disk given a URL path like `/api/uploads/files/products/abc.jpg`.
   * Silently ignores if file doesn't exist or URL is invalid.
   */
  deleteFile(url: string | null | undefined): void {
    if (!url) return;

    try {
      // Expected format: /api/uploads/files/{folder}/{filename}
      const match = url.match(/\/api\/uploads\/files\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9._-]+)$/);
      if (!match) return;

      const [, folder, filename] = match;
      const filePath = join(UPLOADS_DIR, folder, filename);

      if (existsSync(filePath)) {
        unlinkSync(filePath);
        this.logger.log(`Deleted old file: ${folder}/${filename}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete file ${url}: ${error}`);
    }
  }
}
