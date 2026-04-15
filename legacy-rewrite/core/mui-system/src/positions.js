import style from './style';
import compFunction from './compFunction';

export const position = style({
  prop: 'position',
});

export const zIndex = style({
  prop: 'zIndex',
  themeKey: 'zIndex',
});

export const top = style({
  prop: 'top',
});

export const right = style({
  prop: 'right',
});

export const bottom = style({
  prop: 'bottom',
});

export const left = style({
  prop: 'left',
});

export default compFunction(position, zIndex, top, right, bottom, left);
