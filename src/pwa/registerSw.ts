export function registerServiceWorker(): void {
  if (import.meta.env.DEV) {
    // Keep dev server behavior predictable: no SW caching/interception in development.
    void navigator.serviceWorker?.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => void registration.unregister());
    });
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  });
}
