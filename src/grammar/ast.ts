// deno-lint-ignore-file no-explicit-any

type Singlet<T> = T | readonly T[];
const unwrap = <T>(v: Singlet<T>) => (Array.isArray(v) ? v[0] : v);

// AST builder functions

export const prog = <T extends any[]>(...body: T) => ({
  type: <const>'Program',
  body,
});

export const expr = <T>(expression: T) => ({
  type: <const>'ExpressionStatement',
  expression,
});

export const paren = <T>(expression: T) => ({
  type: <const>'ParenthesizedExpression',
  expression,
});

export const bool = (value: boolean) => ({
  type: 'BooleanLiteral',
  value,
});
export const num = (value: Singlet<string>, base = 10) => ({
  type: <const>'NumericLiteral',
  value: unwrap(value),
  base,
});
export const str = (value: Singlet<string>) => ({
  type: <const>'StringLiteral',
  value: unwrap(value),
});
export const regex = <S, T>(pattern: S, flags: T) => ({
  type: <const>'RegularExpressionLiteral',
  pattern,
  flags,
});

export const id = (name: Singlet<string>) => ({
  type: <const>'Identifier',
  name: unwrap(name),
});

export const field = <S, T>(object: S, field: T) => ({
  type: <const>'FieldExpression',
  object,
  field,
});
export const index = <S, T>(object: S, index: T) => ({
  type: <const>'IndexExpression',
  object,
  index,
});
export const call = <S, T extends any[]>(callee: S, args: T) => ({
  type: <const>'CallExpression',
  callee,
  arguments: args,
});

export const arr = <T extends any[]>(...elements: T) => ({
  type: <const>'ArrayExpression',
  elements,
});
export const arrL = <T extends any[]>(...elements: T) => ({
  type: <const>'ArrayPattern',
  elements,
});

export const prefix = <S, T>(operator: S, argument: T) => ({
  type: <const>'UnaryExpression',
  prefix: true,
  operator,
  argument,
});

export const bin = <R, S, T>(operator: R, left: S, right: T) => ({
  type: <const>'BinaryExpression',
  operator,
  left,
  right,
});

export const cond = <R, S, T>(condition: R, consequent: S, alternate: T) => ({
  type: <const>'ConditionalExpression',
  condition,
  consequent,
  alternate,
});

export const condThen = <R, S, T>(a: R, b: S, c: T) => ({
  ...cond(a, b, c),
  explicitThen: true,
});

export const condSt = <R, S, T>(
  condition: R,
  consequent: S,
  alternate: T | null = null
) => ({
  type: <const>'ConditionalStatement',
  condition,
  consequent,
  alternate,
});

export const block = <T extends any[]>(...body: T) => ({
  type: <const>'BlockStatement',
  body,
});

export const assign = <S, T>(left: S, right: T) => ({
  type: <const>'AssignmentExpression',
  operator: '=',
  left,
  right,
});

export const variableDeclaration = <R, S, T>(
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

export const letSt = <R, S, T>(
  left: R,
  typeAnnotation: S | null = null,
  right: T | null = null
) => variableDeclaration(left, typeAnnotation, right);

export const letMutSt = <R, S, T>(
  left: R,
  typeAnnotation: S | null = null,
  right: T | null = null
) => variableDeclaration(left, typeAnnotation, right, false, true);

export const constSt = <R, S, T>(
  left: R,
  typeAnnotation: S | null = null,
  right: T | null = null
) => variableDeclaration(left, typeAnnotation, right, true);
