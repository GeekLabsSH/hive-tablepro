import { sliderUnstyledClasses } from '@GeekLabsSH/hive-tablepro/core/mui-base/src/SliderUnstyled';
import { unstable_generateUtilityClasses as generateUtilityClasses } from '@GeekLabsSH/hive-tablepro/core/mui-utils/src';

const sliderClasses = {
  ...sliderUnstyledClasses,
  ...generateUtilityClasses('MuiSlider', [
    'colorPrimary',
    'colorSecondary',
    'thumbColorPrimary',
    'thumbColorSecondary',
    'sizeSmall',
    'thumbSizeSmall',
  ]),
};

export default sliderClasses;
