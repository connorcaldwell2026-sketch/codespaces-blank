self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'SafeMap Alert', body: 'New alert received.' };
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, data }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
