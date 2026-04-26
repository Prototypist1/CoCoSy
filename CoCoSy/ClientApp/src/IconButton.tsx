import React, { CSSProperties } from 'react';
import { buttonStyle } from './theme';

export function IconButton({ icon, children, onClick, style, dark, disabled, title }: {
    icon?: string,
    children?: React.ReactNode,
    onClick?: () => void,
    style?: CSSProperties,
    dark?: boolean,
    disabled?: boolean,
    title?: string,
}) {
    return (
        <button
            className={dark ? 'icon-button dark' : 'icon-button'}
            style={{ ...buttonStyle, ...style }}
            onClick={onClick}
            disabled={disabled}
            title={title}
        >{icon ?? children}</button>
    );
}
