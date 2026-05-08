// SBLT CUP Service Worker

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.message,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.link || "/",
    },
    actions: [
      { action: "open", title: "Xem ngay" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "SBLT CUP", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
        }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});
