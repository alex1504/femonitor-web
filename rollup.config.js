import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

/* eslint-disable import/no-default-export */
const config = {
  input: './src/index.ts',
  output: {
    name: 'FeMonitor',
    sourcemap: !process.env.MINIFY,
    globals: {
      'mobile-detect': 'MobileDetect',
    },
  },
  external: [], // eslint-disable-line global-require
  plugins: [
    typescript({
      tsconfig: 'tsconfig.prod.json',
    }),
    json(),
    babel({ babelHelpers: 'bundled' }),
    commonjs(),
    resolve(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
};

if (process.env.MINIFY) {
  config.plugins.push(terser());
}

export default config;
