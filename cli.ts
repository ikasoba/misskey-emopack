import { parse } from "@std/csv";
import { Command } from "@cliffy/command";
import { BlobWriter, ZipWriter } from "@zip-js/zip-js";
import fs from "node:fs/promises";
import { parseArgs } from "node:util";

export interface Meta {
  emojis: Emoji[];
}

export interface Emoji {
  downloaded: boolean;
  fileName: string;
  emoji: {
    name: string;
    category: string;
    type?: string;
    aliases: string[];
    license?: string;
  };
}

function keys<O extends object>(obj: O) {
  return Reflect.ownKeys(obj) as Extract<keyof O, string | number>[];
}

async function buildMeta(csv: string) {
  const source = parse(await fs.readFile(csv, "utf-8"));

  const meta: Meta = {
    emojis: [],
  };

  const columns = {
    name: 0,
    file: 1,
    category: 2,
    aliases: 3,
    license: null as number | null,
  };

  const columnKeys = keys(columns);
  for (let i = 0; i < source[0].length; i++) {
    for (let j = 0; j < columnKeys.length; j++) {
      const column = columnKeys[j];

      if (source[0][i] == column) {
        columns[column] = i;
        columnKeys.splice(j, 1);
        break;
      }
    }
  }

  for (let i = 1; i < source.length; i++) {
    meta.emojis.push({
      downloaded: true,
      fileName: source[i][columns.file],
      emoji: {
        name: source[i][columns.name],
        category: source[i][columns.category],
        aliases: source[i][columns.aliases]?.split(/\s+/) ?? [],
        license: (columns.license && source[i][columns.license]) || undefined,
      },
    });
  }

  fs.writeFile("meta.json", JSON.stringify(meta), { encoding: "utf-8" });

  return meta;
}

async function pack(filename: string) {
  const meta = await buildMeta("meta.csv");
  const blobw = new BlobWriter();
  const w = new ZipWriter(blobw);

  for (const emoji of [{ fileName: "meta.json" }, ...meta.emojis]) {
    await using fd = await fs.open(emoji.fileName);
    const r = fd.readableWebStream() as ReadableStream;

    await w.add(emoji.fileName, r);
  }

  await w.close();

  await fs.writeFile(
    filename.replace(/(?<!\.zip)$/, ".zip"),
    await blobw.getData().then((x) => x.bytes()),
  );
}

const { positionals: args } = parseArgs({ allowPositionals: true });

await new Command()
  .command("build-meta [filename:string]")
  .action(async (_, filename) => {
    await buildMeta(filename ?? "meta.csv");
  })
  .command("pack [filename:string]")
  .action(async (_, filename) => {
    await pack(filename ?? "out.zip");
  })
  .parse(args);
