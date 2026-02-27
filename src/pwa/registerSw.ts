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
    const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
    const swUrl = new URL('sw.js', new URL(baseUrl, window.location.origin));
    swUrl.searchParams.set('v', __APP_VERSION__);

    void navigator.serviceWorker.register(swUrl.toString()).catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  });
}
