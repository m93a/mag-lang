import peggy from "npm:peggy";

const grammar = await Deno.readTextFile("src/grammar/meg.peggy");
const parser = peggy.generate(grammar, { output: "source", format: "es" });
const output = `\
// deno-lint-ignore-file

${parser}
`;

await Deno.writeTextFile("src/generated/meg.js", output);
