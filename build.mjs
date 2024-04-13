import fs from 'node:fs/promises';
import * as esbuild from 'esbuild';

let metadata = await fs.readFile('metadata.js', { encoding: 'utf8' });
metadata = metadata.trimEnd();

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: ['main.user.tsx'],
  bundle: true,
  banner: { js: metadata },
  format: 'esm',
  outdir: 'dist',
  jsx: 'transform',
  jsxFactory: 'E',
  jsxFragment: 'null',
  jsxSideEffects: true,
  charset: 'utf8',
};

if (process.argv[2] === 'dev') {
  const ctx = await esbuild.context(options);
  const s = await ctx.serve({ host: 'localhost' });
  console.clear();
  console.log(`Serving at: http://${s.host}:${s.port}/main.user.js`);
} else {
  const result = await esbuild.build(options);
  console.log(result);
}
