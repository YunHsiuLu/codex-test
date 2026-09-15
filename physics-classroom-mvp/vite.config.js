import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  build: { rollupOptions: { input: {
    index: resolve('index.html'), teacher: resolve('teacher.html'), student: resolve('student.html')
  } } },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true }
});
