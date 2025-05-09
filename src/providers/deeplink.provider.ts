import { ICallToAction, IUtm } from '../integrations/interfaces.ts';
import { ICommunication, IUtmCallToAction } from './interfaces.ts';
import { LoggingProvider } from './logging.provider.ts';
import { ICallToActionLink } from './interfaces.ts';
import { LbApiOperacionesIntegration } from '../integrations/lb-api-operaciones.ts';
import { Config } from '../config.ts';

export class DeeplinkProvider {
  private static readonly DETAULT_SHORT_LINK = {
    fullUrl:
      'https://tienda.chiper.co/pedir/dashboard?utm_content=6d33dcc3-67a1-4729-a7ca-81455dde4839&utm_term=050525&utm_source=connectly-campaign&utm_medium=164&utm_campaign=default',
    shortenUrl: 'https://sl.chiper.co/g4eA',
    campaignContent: '6d33dcc3-67a1-4729-a7ca-81455dde4839',
  };
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
        // TODO Logic for Offer List Short Link
        // acc.set(
        //   this.getUtmAndCallToActionKey(communication.utmCallToAction),
        //   communication.utmCallToAction,
        // );
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
      communication.shortLinks = utmCallToActions.map((utmCallToAction) => {
        const shortLink = this.shortLinkLookup(storeSet, shortLinkMap, {
          utmCallToAction,
          storeId,
        });
        utmCallToAction.utm.campaignContent = shortLink?.campaignContent;
        return shortLink;
      });

      communication.shortLink = this.shortLinkLookup(storeSet, shortLinkMap, {
        utmCallToAction,
        storeId,
      });
      utmCallToAction.utm.campaignContent = communication.shortLink
        ?.campaignContent as string;
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
    }|${(callToAction.storeReferenceIds || []).sort((a, b) => a.localeCompare(b)).join(',')}|${
      callToAction.macroId ?? ''
    }|${callToAction.brandId ?? ''}`;
  }

  private async createShortLinks(
    preMap: Map<string, IUtmCallToAction>,
  ): Promise<Map<string, ICallToActionLink>> {
    const responses = await this.lbApiOperacionesIntegration.createAllShortLink(
      Array.from(preMap.entries()).map(
        ([key, { storeId, utm, callToAction }]) => ({
          key,
          value: {
            utm,
            callToAction,
            // The Push Notification (PN) does not need to be shortened
            includeShortLink: utm.campaignMedium !== 'PN',
          },
          storeId,
        }),
      ),
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

  private shortLinkLookup = (
    storeSet: Set<number>,
    shortLinkMap: Map<string, ICallToActionLink>,
    {
      utmCallToAction,
      storeId,
    }: { utmCallToAction: IUtmCallToAction; storeId: number },
  ) => {
    const functionName = this.shortLinkLookup.name;

    const key = this.getUtmAndCallToActionKey(utmCallToAction);
    let shortLink = shortLinkMap.get(key);
    if (this.isOfferListLink(utmCallToAction)) {
      shortLink = DeeplinkProvider.DETAULT_SHORT_LINK;
    }
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

  private isOfferListLink({ callToAction }: IUtmCallToAction): boolean {
    return (
      callToAction.actionTypeId ===
      Config.lbApiOperaciones.callToAction.offerList
    );
  }

  private isEmptyLink(link: ICallToActionLink | undefined): boolean {
    return !link || link.fullUrl === '' || link.shortenUrl === '';
  }
}
