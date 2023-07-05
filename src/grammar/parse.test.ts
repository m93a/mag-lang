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

// AST builder functions

const prog = <T extends any[]>(...body: T) => ({
  type: <const>'Program',
  body,
});

const expr = <T>(expression: T) => ({
  type: <const>'ExpressionStatement',
  expression,
});

const pe = <T>(e: T) => prog(expr(e));

const n = (value: Singlet<string>, base = 10) => ({
  type: <const>'NumericLiteral',
  value: unwrap(value),
  base,
});

const bool = (value: boolean) => ({
  type: 'BooleanLiteral',
  value,
});

const id = (name: Singlet<string>) => ({
  type: <const>'Identifier',
  name: unwrap(name),
});

const field = <S, T>(object: S, field: T) => ({
  type: <const>'FieldExpression',
  object,
  field,
});
const index = <S, T>(object: S, index: T) => ({
  type: <const>'IndexExpression',
  object,
  index,
});
const call = <S, T extends any[]>(callee: S, args: T) => ({
  type: <const>'CallExpression',
  callee,
  arguments: args,
});

const arr = <T extends any[]>(...elements: T) => ({
  type: <const>'ArrayExpression',
  elements,
});
const arrL = <T extends any[]>(...elements: T) => ({
  type: <const>'ArrayPattern',
  elements,
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

const paren = <T>(expression: T) => ({
  type: <const>'ParenthesizedExpression',
  expression,
});

const cond = <R, S, T>(condition: R, consequent: S, alternate: T) => ({
  type: <const>'ConditionalExpression',
  condition,
  consequent,
  alternate,
});

const condThen = <R, S, T>(a: R, b: S, c: T) => ({
  ...cond(a, b, c),
  explicitThen: true,
});

const condSt = <R, S, T>(
  condition: R,
  consequent: S,
  alternate: T | null = null
) => ({
  type: <const>'ConditionalStatement',
  condition,
  consequent,
  alternate,
});

const block = <T extends any[]>(...body: T) => ({
  type: <const>'BlockStatement',
  body,
});

const assign = <S, T>(left: S, right: T) => ({
  type: <const>'AssignmentExpression',
  operator: '=',
  left,
  right,
});

const variableDeclaration = <R, S, T>(
  left: R,
  typeAnnotation: S | null = null,
  right: T | null = null,
  constant = false,
  mutable = false
) => ({
  type: <const>'VariableDeclaration',
  constant,
  mutable,
  left,
  right,
  typeAnnotation,
});

const letSt = <R, S, T>(
  left: R,
  typeAnnotation: S | null = null,
  right: T | null = null
) => variableDeclaration(left, typeAnnotation, right);

const letMutSt = <R, S, T>(
  left: R,
  typeAnnotation: S | null = null,
  right: T | null = null
) => variableDeclaration(left, typeAnnotation, right, false, true);

const constSt = <R, S, T>(
  left: R,
  typeAnnotation: S | null = null,
  right: T | null = null
) => variableDeclaration(left, typeAnnotation, right, true);

// Tests

Deno.test('arithmetics', () => {
  // basics
  eq(p`-a;`, pe(pre('-', id`a`)));
  eq(p`1 + 2;`, pe(bin('+', n`1`, n`2`)));
  eq(p`2 * a;`, pe(bin('*', n`2`, id`a`)));
  eq(p`b - c;`, pe(bin('-', id`b`, id`c`)));
  eq(p`pi / 2;`, pe(bin('/', id`pi`, n`2`)));
  eq(p`3 ** 2;`, pe(bin('**', n`3`, n`2`)));
  eq(p`5 % 3;`, pe(bin('%', n`5`, n`3`)));

  // left-associativity
  eq(p`1 + 2 + 3;`, pe(bin('+', bin('+', n`1`, n`2`), n`3`)));
  eq(p`1 - 2 - 3;`, pe(bin('-', bin('-', n`1`, n`2`), n`3`)));
  eq(p`1 * 2 * 3;`, pe(bin('*', bin('*', n`1`, n`2`), n`3`)));
  eq(p`1 / 2 / 3;`, pe(bin('/', bin('/', n`1`, n`2`), n`3`)));

  // right-associativity
  eq(p`1 ** 2 ** 3;`, pe(bin('**', n`1`, bin('**', n`2`, n`3`))));

  // precedence
  eq(
    p`1 + 2 * 3 + 4;`,
    pe(bin('+', bin('+', n`1`, bin('*', n`2`, n`3`)), n`4`))
  );
  eq(
    p`a**2 + 0.5 * a * b + b**2;`,
    pe(
      bin(
        '+',
        bin(
          '+',
          bin('**', id`a`, n`2`),
          bin('*', bin('*', n`0.5`, id`a`), id`b`)
        ),
        bin('**', id`b`, n`2`)
      )
    )
  );
});

Deno.test('relations', () => {
  // basics
  eq(p`1 < 2;`, pe(bin('<', n`1`, n`2`)));
  eq(p`1 <= a;`, pe(bin('<=', n`1`, id`a`)));
  eq(p`a == b;`, pe(bin('==', id`a`, id`b`)));
  eq(p`1 != 2;`, pe(bin('!=', n`1`, n`2`)));
  eq(p`a >= 1;`, pe(bin('>=', id`a`, n`1`)));
  eq(p`2 > 1;`, pe(bin('>', n`2`, n`1`)));
  eq(p`1 === a;`, pe(bin(`===`, n`1`, id`a`)));
  eq(p`a !== b;`, pe(bin('!==', id`a`, id`b`)));

  // forbidden associativity
  throws(() => p`1 < 2 == 3;`);
  throws(() => p`1 === 2 > 1;`);
  throws(() => p`a == b == c;`);
  throws(() => p`a != b == c;`);
  throws(() => p`a < b == c <= d;`);
  throws(() => p`x > c < d;`);
  throws(() => p`a<b>c;`);
});

Deno.test('conditions', () => {
  // simple expressions
  eq(p`(if (a) b else c);`, pe(paren(cond(id`a`, id`b`, id`c`))));
  eq(p`(if a then b else c);`, pe(paren(condThen(id`a`, id`b`, id`c`))));
  eq(
    p`(if a { b; } else { c; });`,
    pe(paren(cond(id`a`, block(expr(id`b`)), block(expr(id`c`)))))
  );

  // chained expressions
  eq(
    p`(if (a) b else if (c) d else e);`,
    pe(paren(cond(id`a`, id`b`, cond(id`c`, id`d`, id`e`))))
  );
  eq(
    p`(if a then b else if c then d else e);`,
    pe(paren(condThen(id`a`, id`b`, condThen(id`c`, id`d`, id`e`))))
  );
  eq(
    p`(if (a) b else if c then d else e);`,
    pe(paren(cond(id`a`, id`b`, condThen(id`c`, id`d`, id`e`))))
  );
  eq(
    p`(if a { b; } else if c { d; } else { e; });`,
    pe(
      paren(
        cond(
          id`a`,
          block(expr(id`b`)),
          cond(id`c`, block(expr(id`d`)), block(expr(id`e`)))
        )
      )
    )
  );

  // simple statements
  eq(p`if (a) b;`, prog(condSt(id`a`, expr(id`b`))));
  eq(p`if (a) b; else c;`, prog(condSt(id`a`, expr(id`b`), expr(id`c`))));
  eq(p`if a { b; }`, prog(condSt(id`a`, block(expr(id`b`)))));
  eq(
    p`if a { b; } else { c; }`,
    prog(condSt(id`a`, block(expr(id`b`)), block(expr(id`c`))))
  );
  eq(
    p`if (a) b; else { c; }`,
    prog(condSt(id`a`, expr(id`b`), block(expr(id`c`))))
  );
  eq(
    p`if a { b; } else c;`,
    prog(condSt(id`a`, block(expr(id`b`)), expr(id`c`)))
  );

  // chained statements
  eq(
    p`
      if (a) b;
      else if (c) d;
    `,
    prog(condSt(id`a`, expr(id`b`), condSt(id`c`, expr(id`d`))))
  );
  eq(
    p`
      if (a) b;
      else if (c) d;
      else e;
    `,
    prog(condSt(id`a`, expr(id`b`), condSt(id`c`, expr(id`d`), expr(id`e`))))
  );
  eq(
    p`
      if a { b; }
      else if c { d; }
    `,
    prog(condSt(id`a`, block(expr(id`b`)), condSt(id`c`, block(expr(id`d`)))))
  );
  eq(
    p`
      if a { b; }
      else if c { d; }
      else { e; }
    `,
    prog(
      condSt(
        id`a`,
        block(expr(id`b`)),
        condSt(id`c`, block(expr(id`d`)), block(expr(id`e`)))
      )
    )
  );

  // forbidden variants
  throws(() => p`(if (a) b);`);
  throws(() => p`(if a b else c);`);
  throws(() => p`(if a then b);`);
  throws(() => p`(if a { b; });`);
  throws(() => p`if a b;`);
  throws(() => p`if a b; else { c; }`);
});

Deno.test('assignment', () => {
  // basic
  eq(p`(a = b);`, pe(paren(assign(id`a`, id`b`))));
  eq(
    p`(x = x**2 + 4);`,
    pe(paren(assign(id`x`, bin('+', bin('**', id`x`, n`2`), n`4`))))
  );

  // member
  eq(p`(a.b = c);`, pe(paren(assign(field(id`a`, id`b`), id`c`))));
  eq(p`(a().b = c);`, pe(paren(assign(field(call(id`a`, []), id`b`), id`c`))));
  eq(
    p`(a.b(c).d[e] = f);`,
    pe(
      paren(
        assign(
          index(field(call(field(id`a`, id`b`), [id`c`]), id`d`), id`e`),
          id`f`
        )
      )
    )
  );

  // array destructuring
  eq(p`(arr = [1, 2]);`, pe(paren(assign(id`arr`, arr(n`1`, n`2`)))));
  eq(
    p`([a, b] = [1, 2]);`,
    pe(paren(assign(arrL(id`a`, id`b`), arr(n`1`, n`2`))))
  );
});

Deno.test('variable declaration', () => {
  eq(p`let x = 2;`, prog(letSt(id`x`, null, n`2`)));
  eq(p`let x: f32;`, prog(letSt(id`x`, id`f32`)));
  eq(p`let x: f32 = 2;`, prog(letSt(id`x`, id`f32`, n`2`)));

  eq(p`let mut y = true;`, prog(letMutSt(id`y`, null, bool(true))));
  eq(p`let mut y: boolean;`, prog(letMutSt(id`y`, id`boolean`)));
  eq(
    p`let mut y: boolean = true;`,
    prog(letMutSt(id`y`, id`boolean`, bool(true)))
  );

  eq(p`const z = 5;`, prog(constSt(id`z`, null, n`5`)));
  eq(p`const z: number = 5;`, prog(constSt(id`z`, id`number`, n`5`)));
});
