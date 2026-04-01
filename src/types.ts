// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tail<T extends readonly any[]> = T extends [any, ...infer Rest] ? Rest : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Last<T extends readonly any[]> = T extends [...any, infer L] ? L : never;
