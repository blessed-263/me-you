export const AUTH_CHANGED_EVENT = 'yme-auth-changed';

export function dispatchAuthChanged(): void {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
