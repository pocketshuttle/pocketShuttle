self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : "no payload";
  const options = {
    body: data.body,
    icon: "/public/images/icon-192x192.png",
    badge: "/public/images/icon-192x192.png",
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // This looks to see if the current window is already open and
  // focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow("/");
      })
  );
});
