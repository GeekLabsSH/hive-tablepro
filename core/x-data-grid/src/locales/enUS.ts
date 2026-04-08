import { enUS as enUSCore } from '@cronoslogistics/hive-tablepro/core/mui-material/src/locale';
import { GRID_DEFAULT_LOCALE_TEXT } from '../constants/localeTextConstants';
import { getGridLocalization, Localization } from '../utils/getGridLocalization';

export const enUS: Localization = getGridLocalization(GRID_DEFAULT_LOCALE_TEXT, enUSCore);
