/**
 * Access is modelled as an entitlement with a named source, never as a boolean.
 *
 * ByteLabs sells its own monthly subscription today, and a Studying Kube plan will
 * unlock it as a bundle later. Those are two providers granting the same access.
 * `isSubscribed: boolean` would have to be torn out to support that; this does not.
 */
export const ENTITLEMENT_PROVIDERS = ['bytelabs', 'studying-kube', 'complimentary'] as const;
export type EntitlementProvider = (typeof ENTITLEMENT_PROVIDERS)[number];

/** What an entitlement opens. Scopes are additive across entitlements. */
export const ENTITLEMENT_SCOPES = ['course', 'ground', 'assist'] as const;
export type EntitlementScope = (typeof ENTITLEMENT_SCOPES)[number];

export interface Entitlement {
  provider: EntitlementProvider;
  scopes: readonly EntitlementScope[];
  /** ISO timestamp, or null for an entitlement that does not expire. */
  activeUntil: string | null;
}

export interface EntitlementState {
  entitlements: readonly Entitlement[];
}

export function isActive(entitlement: Entitlement, at: Date = new Date()): boolean {
  if (entitlement.activeUntil === null) return true;
  const until = Date.parse(entitlement.activeUntil);
  return Number.isFinite(until) && until > at.getTime();
}

export function hasScope(
  state: EntitlementState,
  scope: EntitlementScope,
  at: Date = new Date(),
): boolean {
  return state.entitlements.some((e) => isActive(e, at) && e.scopes.includes(scope));
}

/**
 * This build has no auth and no billing, so everything is open. The shape is what
 * matters — when billing lands, only this constant is replaced.
 */
export const LOCAL_ENTITLEMENT_STATE: EntitlementState = {
  entitlements: [
    {
      provider: 'complimentary',
      scopes: ENTITLEMENT_SCOPES,
      activeUntil: null,
    },
  ],
};
