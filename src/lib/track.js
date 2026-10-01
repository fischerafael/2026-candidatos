// PostHog: só liga se a chave do projeto estiver definida no build (VITE_POSTHOG_KEY).
// A biblioteca é carregada à parte, depois do app, para não pesar no carregamento inicial.
let ph = null;

export function initTracking() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
    });
    ph = posthog;
  });
}

export const track = (event, props) => ph?.capture(event, props);
