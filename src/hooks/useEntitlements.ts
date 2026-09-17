import { useProfile } from "./useLearner";
import {
  entitlementsEnabled,
  entitlementsFor,
  planState,
  trialDaysLeft,
  type Entitlements,
  type PlanId,
} from "@/lib/entitlements";

/**
 * The learner's plan as the UI should treat it — trial counted as Pro, and
 * everything unlocked while ENTITLEMENTS_ENABLED is off.
 *
 * This decides what to *show*. What a learner may actually *do* is enforced in
 * the server functions.
 */
export function useEntitlements(): {
  plan: PlanId;
  trialing: boolean;
  trialUsed: boolean;
  trialDaysLeft: number;
  entitlements: Entitlements;
  enforced: boolean;
  isLoading: boolean;
} {
  const { data: profile, isLoading } = useProfile();
  const state = planState(profile);

  return {
    plan: state.plan,
    trialing: state.trialing,
    trialUsed: state.trialUsed,
    trialDaysLeft: trialDaysLeft(state.trialEndsAt),
    entitlements: entitlementsFor(state.plan),
    enforced: entitlementsEnabled(),
    isLoading,
  };
}
