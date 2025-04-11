import { LbApiOperacionesIntegration } from '../integrations/lb-api-operaciones.ts';
import { ICallToAction, IUtm } from '../integrations/interfaces.ts';
import { ICommunication, IUtmCallToAction } from './interfaces.ts';
import { LoggingProvider } from './logging.provider.ts';
import { ICallToActionLink } from './interfaces.ts';
import { IShortLinkResponse } from '../integrations/interfaces.ts';

export class DeeplinkProvider {
  private readonly lbApiOperacionesIntegration: LbApiOperacionesIntegration;
  private readonly logger: LoggingProvider;
  constructor() {
    this.lbApiOperacionesIntegration = new LbApiOperacionesIntegration();
    this.logger = new LoggingProvider({ context: DeeplinkProvider.name });
  }

  public generateLinks = async (
    communications: ICommunication[],
    includeLinks: boolean,
  ): Promise<number[]> => {
    if (!includeLinks) return Promise.resolve([]);

    const storeIds = await this.updateCallToActionShortLinks(communications);
    this.updatePathVariable(communications);
    return storeIds;
  };

  private async updateCallToActionShortLinks(
    communications: ICommunication[],
  ): Promise<number[]> {
    const communicationMap = communications.reduce(
      (acc, communication) => {
        const { utmCallToActions } = communication;
        for (const utmCallToAction of utmCallToActions) {
          const key = this.getUtmAndCallToActionKey(utmCallToAction);
          acc.set(key, utmCallToAction);
        }
        acc.set(
          this.getUtmAndCallToActionKey(communication.utmCallToAction),
          communication.utmCallToAction,
        );
        return acc;
      },
      new Map() as Map<string, IUtmCallToAction>,
    );

    const shortLinkMap = new Map<string, ICallToActionLink>();
    for (const [key, value] of (
      await this.createShortLinks(communicationMap)
    ).entries()) {
      shortLinkMap.set(key, value);
    }

    const storeSet = new Set<number>();

    communications.forEach((communication) => {
      const { utmCallToActions, utmCallToAction, storeId } = communication;
      communication.shortLinks = utmCallToActions.map((utmCallToAction) =>
        this.func(storeSet, shortLinkMap, { utmCallToAction, storeId }),
      );

      communication.shortLink = this.func(storeSet, shortLinkMap, {
        utmCallToAction,
        storeId,
      });
    });
    return Array.from(storeSet);
  }

  private updatePathVariable = (communications: ICommunication[]): void => {
    communications.forEach((communication) => {
      const { campaignService, shortLinks = [] } = communication;
      campaignService?.setPathVariables(shortLinks);
    });
  };

  private getUtmAndCallToActionKey({
    utm,
    callToAction,
  }: {
    utm: IUtm;
    callToAction: Partial<ICallToAction>;
  }): string {
    return `${utm.campaignName}|${callToAction.actionTypeId ?? ''}|${
      callToAction.storeReferenceId ?? callToAction.referencePromotionId ?? ''
    }|${(callToAction.storeReferences || []).sort((a, b) => a.localeCompare(b)).join(',')}|${
      callToAction.macroId ?? ''
    }|${callToAction.brandId ?? ''}`;
  }

  private async createShortLinks(
    preMap: Map<string, IUtmCallToAction>,
  ): Promise<Map<string, ICallToActionLink>> {
    const responses = await this.lbApiOperacionesIntegration.createAllShortLink(
      Array.from(preMap.entries()).map(([key, value]) => ({
        key,
        value: {
          utm: value.utm,
          callToAction: value.callToAction,
        },
        storeId: value.storeId,
      })),
    );
    return responses.reduce((acc, obj) => {
      const { key, response } = obj;

      const data = response?.data ?? {
        utm: { websiteURL: null, shortenURL: null, campaignContent: null },
      };

      acc.set(key, {
        fullUrl: data.utm.websiteURL ?? '',
        shortenUrl: data.utm.shortenURL ?? '',
        campaignContent: data.utm.campaignContent ?? '',
      });
      return acc;
    }, new Map());
  }

  private func = (
    storeSet: Set<number>,
    shortLinkMap: Map<string, ICallToActionLink>,
    {
      utmCallToAction,
      storeId,
    }: { utmCallToAction: IUtmCallToAction; storeId: number },
  ) => {
    const functionName = this.func.name;
    const key = this.getUtmAndCallToActionKey(utmCallToAction);
    const shortLink = shortLinkMap.get(key);
    if (this.isEmptyLink(shortLink)) {
      this.logger.error({
        message: 'Error creating short link',
        functionName,
        error: new Error('Short link is empty'),
        data: { storeId, key, shortLink, utmCallToAction },
      });
      storeSet.add(storeId);
    }
    return shortLink as ICallToActionLink;
  };

  private isEmptyLink(link: ICallToActionLink | undefined): boolean {
    return !link || link.fullUrl === '' || link.shortenUrl === '';
  }
}
