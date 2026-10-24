{
  lib,
  stdenv,
  pnpm,
  nodejs-slim,
  makeWrapper,
  fetchPnpmDeps,
  pnpmBuildHook,
  pnpmConfigHook,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "misskey-emopack";
  version = "0.1.0";

  src = lib.fileset.toSource {
    root = ./.;
    fileset = lib.fileset.unions [
      ./package.json
      ./pnpm-lock.yaml
      ./build.ts
      ./cli.ts
    ];
  };

  buildInputs = [
    pnpm
    pnpmConfigHook
    pnpmBuildHook
    nodejs-slim
    makeWrapper
  ];

  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname version src;
    inherit pnpm;
    fetcherVersion = 4;
    hash = "sha256-pfBVMKVAGRCN04//YstP0EPSaHKISsKAg4Mr1aULXWY=";
  };

  buildPhase = ''
    mkdir -p "$out/bin"

    pnpm run build

    cp -rp node_modules package.json dest "$out/"

    (
      echo '#!/usr/bin/env bash'
      printf 'NODE_PATH="%q:$NODE_PATH" node %q "$@"' \
        "$out/node_modules" \
        "$out/dest/cli.js"
    ) > "$out/bin/emopack"

    chmod +x "$out/bin/emopack"

    wrapProgram "$out/bin/emopack" \
    --prefix PATH : ${
      lib.makeBinPath [
        nodejs-slim
      ]
    }
  '';
})
