/**
 * Minimal ambient declarations. The runtime resolves `@deepseek-ai/dsh-llm`
 * from the installed DSH runtime; it is intentionally not a dependency of this
 * local package (and app.asar ships no .d.ts files).
 */
declare module '@deepseek-ai/dsh-llm' {
  export interface BlockAssemblerLike {
    push(chunk: unknown): void
    blocks(): ReadonlyArray<{ type: string; text?: string }>
    readonly finish: { kind: string; failure?: { code?: string; message?: string } }
  }

  export const BlockAssembler: new () => BlockAssemblerLike

  export function createUserMessage(input: {
    content: ReadonlyArray<{ type: 'text'; text: string }>
    source: { kind: 'user' }
  }): unknown
}
