import type { SelectOptionsModel } from "../models/CommonTypes";

export const removeDuplicateByValue = (list: any[], value: unknown) => {
  return list.filter((obj, index, self) => {
    const isValueNew = obj.value === value;
    const isFirstIndex =
      self.findIndex((o) => o.value === value && o.value === obj.value) === index;
    return !isValueNew || isFirstIndex;
  });
};

export const getAgentNetworkLabel = (
  selectOption: SelectOptionsModel,
  showPartnerNetworks: boolean,
  t: (key: string) => string
) => {
  if (selectOption == null) return;
  if (!showPartnerNetworks) return selectOption.label;
  let editedLabel = selectOption.label;
  editedLabel += " - (";
  let networkPartnerlabels = "";
  if (selectOption.listNetworkName != undefined && selectOption.listNetworkName.length > 0) {
    const listNetworkName = selectOption.listNetworkName;
    for (let i = 0; i < listNetworkName.length; i++) {
      networkPartnerlabels += listNetworkName[i];
      if (i < listNetworkName.length - 1) {
        networkPartnerlabels += ", ";
      }
    }
  } else {
    networkPartnerlabels += t("TK_noNetwork");
  }

  editedLabel += networkPartnerlabels + ")";
  return editedLabel;
};

export const getListAgentNetworkLabel = (
  selectOption: SelectOptionsModel[],
  showPartnerNetworks: boolean,
  t: (key: string) => string
) => {
  if (selectOption == null) return;
  selectOption.forEach(
    (option) =>
      (option.label = getAgentNetworkLabel(option, showPartnerNetworks, t) as string)
  );
};
