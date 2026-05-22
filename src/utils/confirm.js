let pendingResolve = null;

export function showConfirm(message, description = '') {
    return new Promise((resolve) => {
        pendingResolve = resolve;
        document.dispatchEvent(
            new CustomEvent('app:confirm', { detail: { message, description } })
        );
    });
}

export function resolveConfirm(value) {
    if (pendingResolve) {
        pendingResolve(value);
        pendingResolve = null;
    }
}
