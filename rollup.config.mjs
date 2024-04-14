import path from 'node:path'
import clean from '@rollup-extras/plugin-clean'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default {
  input: path.join(__dirname, 'src/index.js'),
  output: [
    {
      file: path.join(__dirname, 'lib/index.js'),
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    clean('lib')
  ]
}