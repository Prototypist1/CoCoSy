import { CSSProperties } from 'react';

export const glow = "255, 255, 255";
export const topGradient = "238, 220, 206";
export const botGradient = "126, 157, 143";
export const shadow = "0, 0, 0";
export const backdropFilter = "hue-rotate(-30deg) saturate(105%) brightness(110%) blur(10px)";
export const halfBackdropFilter = "hue-rotate(-15deg) saturate(102.5%) brightness(105%) blur(5px)";

export const panelShadow = `inset 0px 1px 4px rgb(${glow},0.5), 0px 2px 7px rgb(${shadow},0.3), 0px 1px 2px rgb(${shadow},0.5)`;
export const halfPanelShadow = `inset 0px 1px 4px rgb(${glow},0.5), 0px 1px 3px rgb(${shadow},0.65), 0px 1px 1px rgb(${shadow},0.75)`;
export const flexTransition = 'flex 0.1s linear';
export const widthTransition = 'width 0.1s linear';

export const fadingDividerOuter: CSSProperties = {
    width: 9,
    margin: '6px 0',
    alignSelf: 'stretch',
    display: 'flex',
    alignItems: 'stretch',
    maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
};

export const fadingDividerInner: CSSProperties = {
    flex: 1,
    margin: '0 4px',
    backgroundColor: `rgb(${shadow},0.15)`,
    boxShadow: `0 0 4px rgb(${glow},0.4)`,
};

export const buttonStyle: CSSProperties = {
    fontFamily: 'font-awesome',
    color: 'rgb(255,255,255)',
    textShadow: `0 1px 5px rgb(${shadow}, .5)`,
    fontSize: '30px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 8px',
    zIndex: 1,
};

export const baseStyle: CSSProperties = {
    fontFamily: "'Inter', system-ui, sans-serif",
    overflowWrap: "break-word",
    userSelect: "none",
    textShadow: `0px 1px 5px rbh(${glow}, 0.5)`,
    borderRadius: "8px",
    boxShadow: panelShadow,
    backdropFilter: backdropFilter,
    zIndex: 1,
};

export const optionStyle: CSSProperties = {
    ...baseStyle,
    fontSize: 18,
    overflow: 'hidden',
    borderRadius: '9999px',
};

export const chipStyle: CSSProperties = {
    ...optionStyle,
    maxWidth: 300,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 0,
    padding: '4px',
    gap: 3,
    borderRadius: '6px',
    backdropFilter: halfBackdropFilter,
    boxShadow: halfPanelShadow,
};

export const chipTextStyle: CSSProperties = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
};
