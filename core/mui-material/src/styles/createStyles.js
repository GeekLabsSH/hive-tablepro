let warnedOnce = false;

// To remove in v6
export default function createStyles(styles) {
  if (!warnedOnce) {
    console.warn(
      [
        "HIVE: createStyles from @cronoslogistics/hive-tablepro/core/mui-material/src/styles is deprecated.",
        "Please use @mui/styles/createStyles",
      ].join("\n")
    );

    warnedOnce = true;
  }
  return styles;
}
