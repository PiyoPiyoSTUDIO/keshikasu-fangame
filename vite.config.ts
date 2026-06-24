import { defineConfig } from 'vite';

// GitHub Pagesのサブパス配信に対応。開発時はルート、ビルド時はリポジトリ名をbaseにする
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/keshikasu-fangame/' : '/',
  build: { outDir: 'dist' },
}));