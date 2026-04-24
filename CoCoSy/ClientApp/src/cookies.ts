import { v4 } from 'uuid';

export function getCookie(name: string): string {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
}

export function setCookie(name: string, value: string) {
    document.cookie = `${name}=${encodeURIComponent(value)};max-age=${60 * 60 * 24 * 365};path=/`;
}

export const voterId: string = (() => {
    const saved = getCookie('voterId');
    if (saved) return saved;
    const id = v4();
    setCookie('voterId', id);
    return id;
})();
