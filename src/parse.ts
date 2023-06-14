import { parse } from "./generated/meg.js";

while (true) {
  const input = prompt("> ");
  const output = parse(input);
  console.log(output);
}
