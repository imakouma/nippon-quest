type Token =
  { kind: 'number'; value: number } | { kind: 'name'; value: string } | { kind: 'op'; value: string };

function tokens(source: string): Token[] {
  const result: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const rest = source.slice(index);
    const space = /^\s+/.exec(rest);
    if (space) {
      index += space[0].length;
      continue;
    }
    const number = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(rest);
    if (number) {
      result.push({ kind: 'number', value: Number(number[0]) });
      index += number[0].length;
      continue;
    }
    const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
    if (name) {
      result.push({ kind: 'name', value: name[0] });
      index += name[0].length;
      continue;
    }
    if ('+-*/()'.includes(source[index]!)) {
      result.push({ kind: 'op', value: source[index]! });
      index++;
      continue;
    }
    throw new Error(`つかえない きごう: ${source[index]}`);
  }
  return result;
}

/** 四則演算・括弧・渡された変数だけを評価する。eval / Function は使わない。 */
export function evaluateExpression(source: string, variables: Readonly<Record<string, number>>): number {
  const list = tokens(source);
  let at = 0;
  const peek = (value?: string) =>
    list[at]?.kind === 'op' && (value === undefined || list[at]!.value === value);
  const primary = (): number => {
    const token = list[at++];
    if (!token) throw new Error('しきが とちゅうです');
    if (token.kind === 'number') return token.value;
    if (token.kind === 'name') {
      if (!(token.value in variables)) throw new Error(`しらない へんすう: ${token.value}`);
      return variables[token.value]!;
    }
    if (token.value === '(') {
      const value = add();
      if (!peek(')')) throw new Error(') が ありません');
      at++;
      return value;
    }
    if (token.value === '-') return -primary();
    if (token.value === '+') return primary();
    throw new Error(`しきの ならびが ふせいです: ${token.value}`);
  };
  const multiply = (): number => {
    let value = primary();
    while (peek('*') || peek('/')) {
      const op = (list[at++] as { value: string }).value;
      const right = primary();
      value = op === '*' ? value * right : value / right;
    }
    return value;
  };
  const add = (): number => {
    let value = multiply();
    while (peek('+') || peek('-')) {
      const op = (list[at++] as { value: string }).value;
      const right = multiply();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  };
  const value = add();
  if (at !== list.length) throw new Error('しきの うしろに よぶんな もじが あります');
  if (!Number.isFinite(value)) throw new Error('けっかが かずに なりません');
  return value;
}
