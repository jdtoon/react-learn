const parentOrigin = referrerOrigin();
const list = document.getElementById('loc-list');
const filter = document.getElementById('loc-filter');
const status = document.getElementById('loc-status');

function referrerOrigin() {
  try {
    return new URL(document.referrer).origin;
  } catch {
    return window.location.origin;
  }
}

function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

function select(item) {
  for (const button of list.querySelectorAll('.loc-store')) {
    button.setAttribute('aria-pressed', String(button.closest('li') === item));
  }
  const storeId = item.dataset.storeId;
  const label = item.dataset.label;
  status.textContent = `Selected: ${label}`;
  window.parent.postMessage(
    { type: 'locator:store-selected', payload: { storeId, label } },
    parentOrigin,
  );
}

list.addEventListener('click', (event) => {
  const item = event.target.closest('li[data-store-id]');
  if (item) select(item);
});

filter.addEventListener('input', () => {
  const needle = filter.value.trim().toLowerCase();
  for (const item of list.children) {
    item.hidden = needle !== '' && !item.dataset.label.toLowerCase().includes(needle);
  }
});

window.addEventListener('message', (event) => {
  if (event.source !== window.parent || event.origin !== parentOrigin) return;
  if (event.data && event.data.type === 'host:theme') applyTheme(event.data.theme);
});
