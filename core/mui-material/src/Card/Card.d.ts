import { OverridableComponent, OverrideProps } from '@GeekLabsSH/hive-tablepro/core/mui-material/src/OverridableComponent';
import { SxProps } from '@GeekLabsSH/hive-tablepro/core/mui-system/src';
import { DistributiveOmit } from '@GeekLabsSH/hive-tablepro/core/mui-types';
import * as React from 'react';
import { Theme } from '..';
import { PaperProps } from '../Paper';
import { CardClasses } from './cardClasses';

// TODO: v6 remove this interface, it is not used
export interface CardPropsColorOverrides { }

export interface CardTypeMap<P = {}, D extends React.ElementType = 'div'> {
  props: P &
  DistributiveOmit<PaperProps, 'classes'> & {
    /**
     * Override or extend the styles applied to the component.
     */
    classes?: Partial<CardClasses>;
    /**
     * If `true`, the card will use raised styling.
     * @default false
     */
    raised?: boolean;
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps<Theme>;
  };
  defaultComponent: D;
}

/**
 *
 * Demos:
 *
 * - [Card](https://mui.com/material-ui/react-card/)
 *
 * API:
 *
 * - [Card API](https://mui.com/material-ui/api/card/)
 * - inherits [Paper API](https://mui.com/material-ui/api/paper/)
 */

declare const Card: OverridableComponent<CardTypeMap>;

export type CardProps<
  D extends React.ElementType = CardTypeMap['defaultComponent'],
  P = {},
> = OverrideProps<CardTypeMap<P, D>, D>;

export default Card;
