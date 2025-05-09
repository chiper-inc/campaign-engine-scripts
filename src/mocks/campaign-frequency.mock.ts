import { IFrequencyParameter } from './interfaces.ts';
import { CHANNEL, LOCATION, STORE_STATUS } from '../enums.ts';

export const frequencyByLocationAndStatusAndRange: IFrequencyParameter[] = [
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Hibernating, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Lead, frequency: 7 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.New, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Resurrected, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Retained, frequency: 3 },

  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 210, to: 359, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Lead, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 210, to: 359, frequency: 3},
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Hibernating, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Lead, frequency: 0 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.New, frequency: 7 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Resurrected, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 3},
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Hibernating, frequency: 3},
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Lead, frequency: 7 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.New, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Resurrected, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Retained, frequency: 3 },

  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Retained, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },

  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Retained, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },

  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Churn, from: 210, to: 359, frequency: 3 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.WhatsApp, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Retained, frequency: 2 },

// *****
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Churn, from: 210, to: 359, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BAQ, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Churn, from: 210, to: 359, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BOG, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 210, to: 359, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 360, to: 449, frequency: 3 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 450, to: 539, frequency: 3 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 540, to: 719, frequency: 3 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 720, to: 899, frequency: 4 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Churn, from: 900, to: 1079, frequency: 4 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CLO, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Churn, from: 210, to: 359, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Churn, from: 360, to: 449, frequency: 3 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Churn, from: 450, to: 539, frequency: 3 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Churn, from: 540, to: 719, frequency: 3 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Churn, from: 720, to: 899, frequency: 4 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Churn, from: 900, to: 1079, frequency: 4 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.CMX, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Churn, from: 210, to: 359, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.SCL, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Churn, from: 180, to: 209, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Churn, from: 210, to: 359, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.MDE, storeStatus: STORE_STATUS.Retained, frequency: 2 },

  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Retained, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.BGA, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },

  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Churn, from: 90, to: 119, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Churn, from: 120, to: 149, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Churn, from: 150, to: 179, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Retained, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Resurrected, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.New, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Lead, frequency: 2 },
  { communicationChannel: CHANNEL.PushNotification, locationId: LOCATION.VLN, storeStatus: STORE_STATUS.Hibernating, frequency: 2 },
];