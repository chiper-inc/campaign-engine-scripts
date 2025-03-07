import { LOCATION } from "./constants.js";

export const frequencyByStatus = {
  Churn: {
    _default: 0,
    [LOCATION.BAQ]: 0, // 4,
    [LOCATION.BOG]: 0, // 2,
    [LOCATION.CLO]: 0, // 3,
    [LOCATION.CMX]: 0, // 4,
    [LOCATION.MDE]: 0, // 4,
    [LOCATION.VLN]: 0, // 4,
  },
  Hibernating: {
    _default: 0,
    [LOCATION.BAQ]: 2,
    [LOCATION.BOG]: 2,
    [LOCATION.CLO]: 2,
    [LOCATION.CMX]: 4,
    [LOCATION.MDE]: 2,
    [LOCATION.VLN]: 2,
  },
  Lead: {
    _default: 0,
    [LOCATION.BAQ]: 2,
    [LOCATION.BOG]: 2,
    [LOCATION.CLO]: 2,
    [LOCATION.CMX]: 8,
    [LOCATION.MDE]: 2,
    [LOCATION.VLN]: 2,
  },
  New: {
    _default: 0,
  },
  Resurrected: {
    _default: 0,
    [LOCATION.BAQ]: 2,
    [LOCATION.BOG]: 2,
    [LOCATION.CLO]: 2,
    [LOCATION.CMX]: 4,
    [LOCATION.MDE]: 2,
    [LOCATION.SCL]: 2,
    [LOCATION.VLN]: 2,
  },
  Retained: {
    _default: 0,
    [LOCATION.BAQ]: 2,
    [LOCATION.BOG]: 2,
    [LOCATION.CLO]: 2,
    [LOCATION.CMX]: 4,
    [LOCATION.MDE]: 2,
    [LOCATION.VLN]: 2,
  },
  _default: 2,
};

const NAME = ["name"];
const NAME_1SKU = ["name", "sku_1", "dsct_1"];
const NAME_2SKU = ["name", "sku_1", "dsct_1", "sku_2", "dsct_2"];
const NAME_3SKU = ["name", "sku_1", "dsct_1", "sku_2", "dsct_2", "sku_3", "dsct_3"];
const NAME_4SKU = ["name", "sku_1", "dsct_1", "sku_2", "dsct_2", "sku_3", "dsct_3", "sku_4", "dsct_4"];
const NAME_5SKU = ["name", "sku_1", "dsct_1", "sku_2", "dsct_2", "sku_3", "dsct_3", "sku_4", "dsct_4", "sku_5", "dsct_5"];

export const campaignsBySatatus = {
  Churn: {
    names: [
      "API_Churn_1_es_v0",
      "API_Churn_2_es_v0",
      "API_Churn_3_es_v0",
      "API_Churn_4_es_v0",
      "API_Churn_5_es_v0",
      "API_Churn_6_es_v0",
      "API_Churn_7_es_v0",
    ],
    variables: {
      _default: NAME_4SKU,
      API_Churn_1_es_v0: NAME_1SKU,
      API_Churn_2_es_v0: NAME_2SKU,
      API_Churn_3_es_v0: NAME_3SKU,
      API_Churn_4_es_v0: NAME_4SKU,
      API_Churn_5_es_v0: NAME_5SKU,
    }
  },
  Lead: {
    names: [
      "API_Lead_1_es_v0",
      "API_Lead_2_es_v0",
      "API_Lead_3_es_v0",
      "API_Lead_4_es_v0",
      "API_Lead_5_es_v0",
      "API_Lead_6_es_v0",
      "API_Lead_7_es_v0",
    ],
    variables: {
      _default: NAME_4SKU,
      API_Lead_1_es_v0: NAME_1SKU,
      API_Lead_2_es_v0: NAME_2SKU,
      API_Lead_3_es_v0: NAME_3SKU,
      API_Lead_4_es_v0: NAME_4SKU,
      API_Lead_5_es_v0: NAME_5SKU,
    }
  },
  New: {
    names: [
      "API_New_1_es_v0",
      "API_New_2_es_v0",
      "API_New_3_es_v0",
      "API_New_4_es_v0",
      "API_New_5_es_v0",
      "API_New_6_es_v0",
      "API_New_7_es_v0",
    ],
  },
  Hibernating: {
    names: [
      "API_Hibernating_1_es_v0",
      "API_Hibernating_2_es_v0",
      "API_Hibernating_3_es_v0",
      "API_Hibernating_4_es_v0",
      "API_Hibernating_5_es_v0",
      "API_Hibernating_6_es_v0",
      "API_Hibernating_7_es_v0",
    ],
    variables: {
      _default: NAME_4SKU,
      API_Hibernating_1_es_v0: NAME_1SKU,
      API_Hibernating_2_es_v0: NAME_2SKU,
      API_Hibernating_3_es_v0: NAME_3SKU,
      API_Hibernating_4_es_v0: NAME_4SKU,
      API_Hibernating_5_es_v0: NAME_5SKU,
    }

  },
  Retained: {
    names: [
      "API_Retained_1_es_v0",
      "API_Retained_2_es_v0",
      "API_Retained_3_es_v0",
      "API_Retained_4_es_v0",
      "API_Retained_5_es_v0",
      "API_Retained_6_es_v0",
      "API_Retained_7_es_v0",
    ],
    variables: {
      _default: NAME_4SKU,
      API_Retained_1_es_v0: NAME_1SKU,
      API_Retained_2_es_v0: NAME_2SKU,
      API_Retained_3_es_v0: NAME_3SKU,
      API_Retained_4_es_v0: NAME_4SKU,
      API_Retained_5_es_v0: NAME_5SKU,
    }

  },
  Resurrected: {
    names: [
      "API_Resurrected_1_es_v0",
      "API_Resurrected_2_es_v0",
      "API_Resurrected_3_es_v0",
      "API_Resurrected_4_es_v0",
      "API_Resurrected_5_es_v0",
      "API_Resurrected_6_es_v0",
      "API_Resurrected_7_es_v0",
    ],
    variables: {
      _default: NAME_4SKU,
      API_Resurrected_1_es_v0: NAME_1SKU,
      API_Resurrected_2_es_v0: NAME_2SKU,
      API_Resurrected_3_es_v0: NAME_3SKU,
      API_Resurrected_4_es_v0: NAME_4SKU,
      API_Resurrected_5_es_v0: NAME_5SKU,
    }
  },
  variables: {
    _default: NAME,
  }
}

