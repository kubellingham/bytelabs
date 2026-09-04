/**
 * The provider ByteLabs will use for AI calls.
 *
 * One key is picked at process start rather than negotiated per call, so a
 * deployment has a single, predictable identity — a learner opening the Ask
 * panel does not get a different provider than the /brief parser.
 *
 * Anthropic takes precedence when both are set, so an existing Anthropic-first
 * deployment does not silently flip providers if OPENROUTER_API_KEY leaks into
 * the environment.
 */

export type AiProvider = 'anthropic' | 'openrouter' | 'none';

export interface ResolvedProvider {
  provider: AiProvider;
  apiKey: string | null;
  /** Human label for error messages and telemetry. */
  label: string;
}

export function resolveProvider(): ResolvedProvider {
  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) return { provider: 'anthropic', apiKey: anthropic, label: 'Anthropic' };

  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter) return { provider: 'openrouter', apiKey: openrouter, label: 'OpenRouter' };

  return { provider: 'none', apiKey: null, label: 'no provider' };
}

/**
 * Resolve a model id for one of ByteLabs' two roles, respecting per-role env
 * overrides and provider-appropriate defaults.
 *
 * Provider defaults are chosen so a deployment that sets only its key works out
 * of the box; deployments that want a different model set the env var.
 */
export function resolveModel(role: 'brief' | 'assist', provider: AiProvider): string {
  const override =
    role === 'brief'
      ? process.env.BYTELABS_BRIEF_MODEL?.trim()
      : process.env.BYTELABS_ASSIST_MODEL?.trim();
  if (override) return override;

  if (provider === 'openrouter') {
    // OpenRouter uses vendor-scoped slugs. Sonnet is the safe default for both
    // roles — fast enough for the parser, capable enough for the assistant.
    return 'anthropic/claude-sonnet-4.5';
  }
  // Anthropic path keeps the existing defaults.
  return role === 'brief' ? 'claude-opus-5' : 'claude-opus-5';
}
