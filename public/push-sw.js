// Service worker for push reminders — deliberately nothing else. No caching and
// no fetch handler, so registering it can never serve a stale copy of the app.
// Payloads are encrypted by the server (src/lib/web-push.server.ts) and arrive
// here as JSON: { title, body, url, tag }.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let message = { title: "Ascent", body: "", url: "/dashboard", tag: undefined };
  try {
    if (event.data) message = { ...message, ...event.data.json() };
  } catch {
    // An unreadable payload still gets a notification: browsers penalise a
    // push that shows nothing.
  }

  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      tag: message.tag,
      icon: "/favicon.ico",
      data: { url: message.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/dashboard", self.location.origin);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Reuse an open tab on the app rather than stacking new ones.
      for (const client of windows) {
        if (new URL(client.url).origin === target.origin && "focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target.href);
          return;
        }
      }
      await self.clients.openWindow(target.href);
    })(),
  );
});
