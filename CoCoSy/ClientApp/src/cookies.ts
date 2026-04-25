import { v4 } from 'uuid';

export function getCookie(name: string): string {
    return localStorage.getItem(name) ?? '';
}

export function setCookie(name: string, value: string) {
    localStorage.setItem(name, value);
}

export const voterId: string = (() => {
    const saved = localStorage.getItem('voterId');
    if (saved) return saved;
    const id = v4();
    localStorage.setItem('voterId', id);
    return id;
})();
