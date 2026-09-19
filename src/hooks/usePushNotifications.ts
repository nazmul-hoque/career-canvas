import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "./useAuth";
import { track } from "@/lib/analytics";
import {
  deletePushSubscriptionFn,
  savePushSubscriptionFn,
  sendTestPushFn,
} from "@/lib/push.functions";

/**
 * Push reminders on *this* browser.
 *
 * The truth about whether this device is subscribed lives in the browser's
 * PushManager, not the database — a learner can revoke permission from site
 * settings without the app ever hearing about it — so that is what gets read.
 */

export type PushState =
  /** The server has no VAPID key, so the option isn't offered at all. */
  | "unconfigured"
  /** No service worker or Push API here (older browsers, iOS outside a home-screen app). */
  | "unsupported"
  /** The learner blocked notifications; only browser settings can undo that. */
  | "denied"
  | "off"
  | "on";

const SW_URL = "/push-sw.js";

const vapidPublicKey = () => import.meta.env["VITE_VAPID_PUBLIC_KEY"] as string | undefined;

function decodeKey(value: string): Uint8Array<ArrayBuffer> {
  const clean = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(clean + "=".repeat((4 - (clean.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

const supported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration(SW_URL);
  return registration ? registration.pushManager.getSubscription() : null;
}

function toPayload(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    keys: { p256dh: json.keys?.["p256dh"] ?? "", auth: json.keys?.["auth"] ?? "" },
    userAgent: navigator.userAgent.slice(0, 300),
  };
}

export function usePushNotifications() {
  const { user } = useSession();
  const qc = useQueryClient();
  const queryKey = ["push", user?.id];

  const state = useQuery({
    queryKey,
    enabled: Boolean(user),
    queryFn: async (): Promise<PushState> => {
      if (!vapidPublicKey()) return "unconfigured";
      if (!supported()) return "unsupported";
      if (Notification.permission === "denied") return "denied";
      const subscription = await currentSubscription();
      if (!subscription) return "off";
      // Re-register on every read: cheap, idempotent, and it moves a shared
      // browser's subscription to whoever is signed in now.
      void savePushSubscriptionFn({ data: toPayload(subscription) }).catch(() => undefined);
      return "on";
    },
  });

  const enable = useMutation({
    mutationFn: async () => {
      const key = vapidPublicKey();
      if (!key || !supported()) throw new Error("This browser can't receive push reminders.");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error(
          permission === "denied"
            ? "Notifications are blocked for this site. Allow them in your browser settings."
            : "Push reminders need notification permission.",
        );
      }

      await navigator.serviceWorker.register(SW_URL);
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeKey(key),
        }));

      await savePushSubscriptionFn({ data: toPayload(subscription) });
      track("push_enabled");
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const disable = useMutation({
    mutationFn: async () => {
      const subscription = supported() ? await currentSubscription() : null;
      if (!subscription) return;
      // Server first: if this fails the browser stays subscribed and the switch
      // stays honest, rather than the job pushing to a device showing "off".
      await deletePushSubscriptionFn({ data: { endpoint: subscription.endpoint } });
      await subscription.unsubscribe();
      track("push_disabled");
    },
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const test = useMutation({ mutationFn: () => sendTestPushFn() });

  return { state: state.data, isLoading: state.isLoading, enable, disable, test };
}
