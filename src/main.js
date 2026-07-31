import { GameApp } from './ui/app.js';

const root = document.querySelector('#app');
if (!root) throw new Error('Fluxquint™ application root is missing.');

try {
  new GameApp(root);
} catch (error) {
  console.error('Fluxquint™ failed to start.', error);
  root.innerHTML = '<main class="fatal-error"><h1>Fluxquint™ could not start</h1><p>Reload the page. If the problem continues, report the browser and build version.</p></main>';
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.warn('Fluxquint™ offline support could not be enabled.', error);
  }));
}
