import './toast.css';

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

let container = null;

function getContainer() {
    if (!container || !document.contains(container)) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function dismiss(toast) {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hiding');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

export function showToast(message, type = 'success', duration = 3500) {
    const c = getContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = ICONS[type] ?? ICONS.success;

    const msg = document.createElement('span');
    msg.className = 'toast-message';
    msg.textContent = message;

    const close = document.createElement('button');
    close.className = 'toast-close';
    close.textContent = '×';
    close.onclick = () => dismiss(toast);

    toast.append(icon, msg, close);
    c.appendChild(toast);

    // Double rAF so the transition plays after paint
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-visible')));

    setTimeout(() => dismiss(toast), duration);
}
