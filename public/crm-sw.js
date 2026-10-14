self.addEventListener("push", (event) => {
  let data = {
    title: "Webstudio Expert",
    body: "Neue CRM-Benachrichtigung",
    href: "/crm",
  };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      data: {
        href:
          typeof data.href === "string" && data.href.startsWith("/crm")
            ? data.href
            : "/crm",
      },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.href));
});
