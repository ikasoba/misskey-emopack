import { build } from "esbuild";

await build({
  minify: true,
  format: "esm",
  platform: "node",
  bundle: true,
  splitting: true,
  entryPoints: [ "./cli.ts" ],
  outdir: "dest/"
});

