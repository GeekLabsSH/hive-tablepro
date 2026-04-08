import { unstable_generateUtilityClasses as generateUtilityClasses } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import generateUtilityClass from "../generateUtilityClass";

export function getHiddenCssUtilityClass(slot) {
  return generateUtilityClass("PrivateHiddenCss", slot);
}

const hiddenCssClasses = generateUtilityClasses("PrivateHiddenCss", [
  "root",
  "xlDown",
  "xlUp",
  "onlyXl",
  "lgDown",
  "lgUp",
  "onlyLg",
  "mdDown",
  "mdUp",
  "onlyMd",
  "smDown",
  "smUp",
  "onlySm",
  "xsDown",
  "xsUp",
  "onlyXs",
]);

export default hiddenCssClasses;
