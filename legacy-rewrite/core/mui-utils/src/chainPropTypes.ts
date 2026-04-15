export default function chainPropTypes(
  propType1: any,
  propType2: any,
) {
  if (process.env.NODE_ENV === 'production') {
    return () => null;
  }

  return function validate(...args) {
    return propType1(...args) || propType2(...args);
  };
}
