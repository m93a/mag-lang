import { parse } from "./generated/javascript.js";

const input = prompt("Enter code:");
const output = parse(input);
console.log(output);
