import {
  ICommunication,
  IUtmCallToAction,
  IOffer,
  IStoreRecommendation,
} from './interfaces.ts';
import { TypeCampaignVariables, TypeSku, TypeStore } from '../types.ts';
import { CampaignFactory } from './campaign.factory.ts';
import { MessageProvider } from './message.provider.ts';
import { ICallToAction, IUtm } from './interfaces.ts';
import { Config } from '../config.ts';
import { OFFER_TYPE } from '../repositories/interfaces.ts';
import { v4 as uuid } from 'uuid';
import * as UTILS from '../utils/index.ts';

export class CommunicationProvider {
  public generateEntries(
    storesMap: Map<string, IStoreRecommendation>,
  ): ICommunication[] {
    const entries: ICommunication[] = [];
    for (const data of Array.from(storesMap.values())) {
      const {
        store,
        campaign,
        skus,
        utm: coreUtm,
        params: { communicationChannel: channel },
      } = data;

      const {
        variables,
        offers,
      }: {
        variables?: TypeCampaignVariables;
        offers?: IOffer[];
      } = this.generateVariablesAndRecommendations(campaign.variables, {
        store,
        skus,
      }) ?? {
        variables: undefined,
        offers: undefined,
      };

      if (!variables || !offers) continue;

      campaign.paths.forEach((path) => {
        variables[path] = path;
      });

      const campaignService = CampaignFactory.createCampaignService(
        channel,
        store,
        campaign.name,
        variables,
        coreUtm,
        'es',
      );

      const utmCallToActions = this.generateCallToActionPaths(
        campaignService.messages,
        campaign.paths,
        store.storeId,
        offers,
      );

      if (!utmCallToActions) continue;

      const utmCallToAction = this.generateCallToAction(
        coreUtm,
        store.storeId,
        offers,
      );

      entries.push({
        storeId: store.storeId,
        campaignService,
        connectlyEntry: undefined,
        clevertapEntry: undefined,
        utm: coreUtm,
        utmCallToAction,
        utmCallToActions,
      });
    }
    // console.error(JSON.stringify(entries, null, 2));
    return entries;
  }

  private generateVariablesAndRecommendations(
    variablesList: string[],
    obj: {
      store: TypeStore;
      skus: TypeSku[];
    },
  ): {
    variables: TypeCampaignVariables;
    offers: IOffer[];
  } | null {
    const typeMap: { [k: string]: string } = {
      name: 'store',
      sgmt: 'store',
      sku: 'skus',
      dsct: 'skus',
      img: 'skus',
      // prc: 'skus',
    };
    const subTypeMap: { [k: string]: string } = {
      name: 'name',
      sgmt: 'storeStatus',
      sku: 'reference',
      dsct: 'discountFormatted',
      img: 'image',
    };
    const offers = [];
    let variables: TypeCampaignVariables = {};
    for (const variable of variablesList) {
      const [varName, varIndex] = variable.split('_');
      const property = (obj as { [k: string]: TypeStore | TypeSku[] })[
        typeMap[varName]
      ];

      if (!property) {
        variables = { ...variables, [variable]: `Variable[${variable}]` };
      } else if (varIndex) {
        const resp = this.getVariableFromSku(
          variable,
          property as TypeSku[],
          Number(varIndex) - 1,
          subTypeMap[varName],
        );

        if (!resp) return null;

        variables = { ...variables, ...resp.variable };
        if (resp.offer) {
          offers.push(resp.offer ?? 0);
        }
      } else {
        const resp = this.getVariableFromStore(
          variable,
          property as TypeStore,
          subTypeMap[varName],
        );

        if (!resp) return null;

        variables = { ...variables, ...resp };
      }
    }
    return { variables, offers };
  }

  private generateCallToActionPaths(
    messageServices: MessageProvider[],
    paths: string[],
    storeId: number,
    offers: IOffer[],
  ): IUtmCallToAction[] | null {
    const pathObj = [];
    for (const path of paths.filter((e) => e.startsWith('path'))) {
      const [, index]: string[] = path.split('_');
      if (!path) return null;
      let callToAction: Partial<ICallToAction> = {};
      let utm: IUtm | undefined = undefined;
      if (index && index !== 'dsct') {
        if (isNaN(Number(index))) {
          // path_n
          callToAction = this.generateCallToActionToOfferList(offers);
          utm = messageServices[0]?.utm;
        } else {
          const i = Number(index) - 1;
          callToAction = this.generateCallToActionToOfferDetail(offers[i]);
          utm = messageServices[i]?.utm ?? messageServices[0]?.utm;
        }
      } else {
        callToAction = this.generateCallToActionToDiscountList();
        utm = messageServices[0]?.utm;
      }
      pathObj.push({
        storeId,
        utm: { ...utm, campaignContent: uuid() },
        callToAction,
      });
    }

    return pathObj.length ? pathObj : null;
  }

  private generateCallToAction(
    utm: IUtm,
    storeId: number,
    offers: IOffer[],
  ): IUtmCallToAction {
    let callToAction: Partial<ICallToAction> = {};
    if (offers.length === 1) {
      callToAction = this.generateCallToActionToOfferDetail(offers[0]);
    } else if (offers.length > 1) {
      // 2 or more skus then C2A_OFFER_LIST

      callToAction = this.generateCallToActionToOfferList(offers);
    } else {
      // NO Sku included
      callToAction = this.generateCallToActionToDiscountList();
    }
    return {
      callToAction,
      storeId,
      utm,
    };
  }

  private generateCallToActionToOfferList(offers: IOffer[]) {
    return {
      actionTypeId: Config.lbApiOperaciones.callToAction.offerList,
      storeReferenceIds: offers.map(
        ({ type, storeReferenceId, referencePromotionId }) =>
          type === OFFER_TYPE.storeReference
            ? String(storeReferenceId)
            : `C-${referencePromotionId}`,
      ),
      imageUrl: this.generateCustomOfferImage(),
      title: this.generateCustomOfferTitle(),
    };
  }

  private generateCallToActionToOfferDetail(
    offer: IOffer,
  ): Partial<ICallToAction> {
    const { type, storeReferenceId, referencePromotionId } = offer;
    const { reference, referencePromotion } =
      Config.lbApiOperaciones.callToAction;

    return type === OFFER_TYPE.storeReference
      ? { actionTypeId: reference, storeReferenceId }
      : { actionTypeId: referencePromotion, referencePromotionId };
  }

  private generateCallToActionToDiscountList() {
    return {
      actionTypeId: Config.lbApiOperaciones.callToAction.discountList, // TO DO: When new section is created
      storeReferenceIds: undefined,
    };
  }

  private getVariableFromStore(
    variable: string,
    store: TypeStore,
    varName: string = '-',
  ): TypeCampaignVariables {
    const value =
      (store as TypeCampaignVariables)[varName || '-'] ?? `Store[${variable}]`;
    return {
      [variable]: UTILS.removeExtraSpaces(value) || 'Visitante',
    };
  }

  private getVariableFromSku(
    variable: string,
    skus: TypeSku[],
    index: number,
    varName: string = '_',
  ): {
    variable: TypeCampaignVariables;
    offer?: IOffer;
  } | null {
    if (isNaN(index) || index < 0) return null;

    if (!Array.isArray(skus)) return null;

    if (index >= skus.length) return null;

    const sku = skus[index];
    const value =
      (sku as { [k: string]: string | number })[varName] ?? `Sku[${variable}]`;

    if (!variable.startsWith('sku')) {
      return {
        variable: {
          [variable]: UTILS.removeExtraSpaces(value),
        },
      };
    }

    const offer = {
      type: sku.skuType,
      storeReferenceId:
        sku.storeReferenceId === null ? undefined : sku.storeReferenceId,
      referencePromotionId:
        sku.referencePromotionId === null
          ? undefined
          : sku.referencePromotionId,
    };
    return {
      variable: {
        [variable]: UTILS.removeExtraSpaces(value),
        [`type_${index + 1}`]: offer.type,
      },
      offer,
    };
  }

  private generateCustomOfferTitle(): string {
    return UTILS.choose(
      Config.lbApiOperaciones.callToAction.customOffer.titles,
    );
  }

  private generateCustomOfferImage(): string {
    return UTILS.choose(
      Config.lbApiOperaciones.callToAction.customOffer.imageUrls,
    );
  }
}
