import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/parser.ts', 'src/selector.ts'],
  format: 'esm',
  tsconfig: './tsconfig.json',
  target: ['es6'],
  sourcemap: true,
  clean: true,
  dts: true,
  minify: true,
})
