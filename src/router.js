// Hash-based SPA router with pixel transition animations

const routes = {};
let currentPage = null;

export function registerRoute(hash, renderFn) {
  routes[hash] = renderFn;
}

export function navigate(hash) {
  window.location.hash = hash;
}

export function getCurrentRoute() {
  return window.location.hash.slice(1) || 'welcome';
}

export function initRouter(appElement) {
  function handleRoute() {
    const route = getCurrentRoute();
    const renderFn = routes[route] || routes['welcome'];

    if (!renderFn) return;

    // Pixel dissolve transition
    appElement.classList.add('page-exit');

    setTimeout(() => {
      appElement.innerHTML = '';
      currentPage = route;
      renderFn(appElement);
      appElement.classList.remove('page-exit');
      appElement.classList.add('page-enter');

      setTimeout(() => {
        appElement.classList.remove('page-enter');
      }, 500);
    }, 300);
  }

  window.addEventListener('hashchange', handleRoute);

  // Initial route
  if (!window.location.hash) {
    window.location.hash = '#welcome';
  } else {
    handleRoute();
  }
}
