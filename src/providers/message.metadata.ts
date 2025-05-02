import { TypeSku } from '../types.ts';
import { ICallToAction, IUtm, IUtmCallToAction } from './interfaces.ts';
import { Config } from '../config.ts';

export interface IMessageMetadata<T> {
  data: T;
  metadata: MessageMetadata[];
}

export type MessageMetadataList<T> = IMessageMetadata<T>[];
export class MessageMetadata {
  public static actionType = {
    [Config.lbApiOperaciones.callToAction.reference]: 'GO_TO_REFERENCE',
    [Config.lbApiOperaciones.callToAction.referencePromotion]:
      'GO_TO_REFERENCE_PROMOTION',
    [Config.lbApiOperaciones.callToAction.offerList]: 'GO_TO_CUSTOM_OFFER',
    [Config.lbApiOperaciones.callToAction.discountList]: 'GO_TO_DISCOUNT_LIST',
    [Config.lbApiOperaciones.callToAction.macro]: 'GO_TO_MACRO',
    [Config.lbApiOperaciones.callToAction.brand]: 'GO_TO_BRAND',
  };

  readonly $skus: TypeSku[];
  readonly $utm: IUtm;
  readonly storeId: number;
  readonly $callToAction: Partial<ICallToAction>;

  constructor({ skus, utm, storeId, callToAction }: IUtmCallToAction) {
    this.$skus = skus;
    this.$utm = utm;
    this.storeId = storeId;
    this.$callToAction = callToAction;
  }
  public get skus(): TypeSku[] {
    return this.$skus;
  }
  public get utm(): IUtm {
    return this.$utm;
  }
  public get store(): number {
    return this.storeId;
  }
  public get callToAction(): ICallToAction {
    return this.$callToAction as ICallToAction;
  }

  public expand(i: number, f: (i?: number, j?: number) => string): unknown {
    const { callToAction, skus, utm } = this;
    return {
      utm,
      callToAction: {
        ...callToAction,
        actionType: MessageMetadata.actionType[callToAction.actionTypeId],
      },
      skus: skus.map((sku, j) => ({ ...sku, copy: f(i, j) })),
    };
  }
}
