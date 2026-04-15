import { isHostComponent } from "../../../mui-base/src";

const shouldSpreadAdditionalProps = (Slot) => {
  return !Slot || !isHostComponent(Slot);
};

export default shouldSpreadAdditionalProps;
