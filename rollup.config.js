import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json'

const input = 'src/index.ts'

const plugins = [
  json(),
  resolve(),
  typescript(),
  commonjs(),
  terser({ output: { comments: false } }),
]

const external = [
  'express',
  'cors'
]

export default [
  {
    input,
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
    plugins,
    external
  },
  {
    input,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    plugins,
    external
  },
]
