import peggy from "npm:peggy";

const IN_DIR = "src/grammar/";
const OUT_DIR = "src/generated/";

for await (const { name, isFile } of Deno.readDir(IN_DIR)) {
  if (!isFile || !name.endsWith(".peggy")) continue;
  const bareName = name.match(/^(.*)\.peggy$/)![1];

  const grammar = await Deno.readTextFile(IN_DIR + name);
  const parser = peggy.generate(grammar, { output: "source", format: "es" });
  const output = `\
// deno-lint-ignore-file

${parser}`;

  await Deno.writeTextFile(OUT_DIR + bareName + ".js", output);
}
