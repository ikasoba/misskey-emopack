import { parse } from "csv/mod.ts";
import { Command } from "cliffy/command/mod.ts";
import { compress } from "zip/mod.ts";

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
  const source = parse(await Deno.readTextFile(csv));

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

  Deno.writeTextFile("meta.json", JSON.stringify(meta));

  return meta;
}

async function pack(filename: string) {
  const meta = await buildMeta("meta.csv");
  const files = ["meta.json"];

  for (const emoji of meta.emojis) {
    files.push(emoji.fileName);
  }

  await compress(files, filename.replace(/(?<!\.zip)$/, ".zip"));
}

await new Command()
  .command("build-meta [filename:string]")
  .action(async (_, filename) => {
    await buildMeta(filename ?? "meta.csv");
  })
  .command("pack [filename:string]")
  .action(async (_, filename) => {
    await pack(filename ?? "out.zip");
  })
  .parse(Deno.args);
