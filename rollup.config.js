import path from 'path'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import alias from 'rollup-plugin-alias'
import { name, version, author, license } from './package.json'
import { terser } from 'rollup-plugin-terser'

const fromSrc = (...paths) => {
  return path.join(__dirname, 'src', ...paths)
}

const plugins = [
  alias({
    entries: [
      {
        find: 'src',
        replacement: fromSrc()
      },
      {
        find: 'lib',
        replacement: fromSrc('lib')
      },
      {
        find: 'utils',
        replacement: fromSrc('utils')
      }
    ]
  }),
  json(),
  commonjs({
    // non-CommonJS modules will be ignored, but you can also
    // specifically include/exclude files

    // if true then uses of `global` won't be dealt with by this plugin
    ignoreGlobal: true, // Default: false

    // if false then skip sourceMap generation for CommonJS modules
    sourceMap: true // Default: true
  })
]

const libStarter = 2019
const currentYear = new Date().getFullYear()
const banner = `/*!
 * ${name} v${version}
 * (c) ${libStarter}${currentYear !== libStarter ? '-' + currentYear : ''} ${author}
 * ${license}
 */`

export default [
  {
    input: 'src/duckfficer.js',
    output: [
      {
        file: 'dist/duckfficer.js',
        format: 'cjs',
        banner,
        preferConst: true
      }
    ],
    plugins
  },
  {
    input: 'src/duckfficer.js',
    output: [
      {
        file: 'dist/duckfficer.mjs',
        format: 'esm',
        banner,
        preferConst: true
      }
    ],
    plugins
  },
  {
    input: 'src/duckfficer.js',
    output: [
      {
        file: 'dist/duckfficer.umd.js',
        format: 'umd',
        extend: true,
        name: 'default',
        banner,
        preferConst: true
      }
    ],
    plugins: plugins.concat(terser())
  }
]
