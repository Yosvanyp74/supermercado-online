import { defineConfig } from 'orval';
import path from 'path';

export default defineConfig({
  api: {
    input: path.resolve(__dirname, '../backend/openapi.json'),
    output: {
      target: './src/api/generated.ts',
      client: 'axios',
    },
  },
});