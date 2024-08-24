self.addEventListener("push", function (event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/public/images/icon-192x192.png",
    badge: "/public/images/icon-192x192.png",
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
