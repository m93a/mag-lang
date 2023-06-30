// deno-lint-ignore-file no-explicit-any

import {
  assertEquals as eq,
  assertThrows as throws,
} from 'https://deno.land/std@0.191.0/testing/asserts.ts';
import { parse } from '../generated/mag.js';

// Helper functions

const p = (...args: [any, ...any]) => parse(String.raw(...args));

type Singlet<T> = T | readonly T[];
const unwrap = <T>(v: Singlet<T>) => (Array.isArray(v) ? v[0] : v);

const n = (value: Singlet<string>, base = 10) => ({
  type: <const>'NumericLiteral',
  value: unwrap(value),
  base,
});

const id = (name: Singlet<string>) => ({
  type: <const>'Identifier',
  name: unwrap(name),
});

const pre = <S, T>(operator: S, argument: T) => ({
  type: <const>'UnaryExpression',
  prefix: true,
  operator,
  argument,
});

const bin = <R, S, T>(operator: R, left: S, right: T) => ({
  type: <const>'BinaryExpression',
  operator,
  left,
  right,
});

// Tests

Deno.test('arithmetics', () => {
  // basics
  eq(p`-a`, pre('-', id`a`));
  eq(p`1 + 2`, bin('+', n`1`, n`2`));
  eq(p`2 * a`, bin('*', n`2`, id`a`));
  eq(p`b - c`, bin('-', id`b`, id`c`));
  eq(p`pi / 2`, bin('/', id`pi`, n`2`));
  eq(p`3 ** 2`, bin('**', n`3`, n`2`));
  eq(p`5 % 3`, bin('%', n`5`, n`3`));

  // left-associativity
  eq(p`1 + 2 + 3`, bin('+', bin('+', n`1`, n`2`), n`3`));
  eq(p`1 - 2 - 3`, bin('-', bin('-', n`1`, n`2`), n`3`));
  eq(p`1 * 2 * 3`, bin('*', bin('*', n`1`, n`2`), n`3`));
  eq(p`1 / 2 / 3`, bin('/', bin('/', n`1`, n`2`), n`3`));

  // right-associativity
  eq(p`1 ** 2 ** 3`, bin('**', n`1`, bin('**', n`2`, n`3`)));

  // precedence
  eq(p`1 + 2 * 3 + 4`, bin('+', bin('+', n`1`, bin('*', n`2`, n`3`)), n`4`));
  eq(
    p`a**2 + 0.5 * a * b + b**2`,
    bin(
      '+',
      bin(
        '+',
        bin('**', id`a`, n`2`),
        bin('*', bin('*', n`0.5`, id`a`), id`b`)
      ),
      bin('**', id`b`, n`2`)
    )
  );
});

Deno.test('relations', () => {
  // basics
  eq(p`1 < 2`, bin('<', n`1`, n`2`));
  eq(p`1 <= a`, bin('<=', n`1`, id`a`));
  eq(p`a == b`, bin('==', id`a`, id`b`));
  eq(p`1 != 2`, bin('!=', n`1`, n`2`));
  eq(p`a >= 1`, bin('>=', id`a`, n`1`));
  eq(p`2 > 1`, bin('>', n`2`, n`1`));
  eq(p`1 === a`, bin(`===`, n`1`, id`a`));
  eq(p`a !== b`, bin('!==', id`a`, id`b`));

  // forbidden associativity
  throws(() => p`1 < 2 == 3`);
  throws(() => p`1 === 2 > 1`);
  throws(() => p`a == b == c`);
  throws(() => p`a != b == c`);
  throws(() => p`a < b == c <= d`);
  throws(() => p`x > c < d`);
  throws(() => p`a<b>c`);
});
