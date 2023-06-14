import { parse } from "./generated/mag.js";

while (true) {
  const input = prompt("> ");
  const output = parse(input);
  console.log(output);
}
