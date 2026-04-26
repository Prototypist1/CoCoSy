import React, { CSSProperties } from 'react';
import { buttonStyle } from './theme';

export function VoteButton({ icon, onClick, style, disabled, title }: {
    icon: string,
    onClick?: () => void,
    style?: CSSProperties,
    disabled?: boolean,
    title?: string,
}) {
    return (
        <button
            className={'vote-button'}
            style={{ ...buttonStyle, ...style }}
            onClick={onClick}
            disabled={disabled}
            title={title}
        >{icon}</button>
    );
}
