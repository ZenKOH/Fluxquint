const root = document.querySelector('#app');
if (!root) throw new Error('Fluxquint™ application root is missing.');

async function startFluxquint() {
  try {
    const { GameApp } = await import('./ui/app.js?v=1.1.1');
    new GameApp(root);
  } catch (error) {
    console.error('Fluxquint™ failed to start.', error);
    root.innerHTML = `
      <main class="boot-shell fatal-error" role="alert">
        <section class="boot-card">
          <div class="boot-mark" aria-hidden="true">!</div>
          <h1>Fluxquint™ could not start</h1>
          <p>The game assets were not published correctly. Reload once. If this message remains, verify that GitHub Pages is serving the completed build.</p>
          <p><small>Build v1.1.1</small></p>
        </section>
      </main>`;
  }
}

startFluxquint();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=1.1.1').catch((error) => {
    console.warn('Fluxquint™ offline support could not be enabled.', error);
  }));
}
