import { LbApiOperacionesIntegration } from '../integrations/lb-api-operaciones.ts';
import {
  ICallToAction,
  ICallToActionLink,
  IUtm,
} from '../integrations/interfaces.ts';
import { IPreEntry, IUtmCallToAction } from '../scripts/interfaces.ts';

export class DeeplinkProvider {
  private readonly lbApiOperacionesIntegration: LbApiOperacionesIntegration;
  constructor() {
    this.lbApiOperacionesIntegration = new LbApiOperacionesIntegration();
  }

  public generateLinks = async (
    preEntries: IPreEntry[],
    includeLinks: boolean,
  ): Promise<number[]> => {
    if (!includeLinks) return Promise.resolve([]);

    const storeIds = await this.updateCallToActionShortLinks(preEntries);
    this.updatePathVariable(preEntries);
    return storeIds;
  };

  private async updateCallToActionShortLinks(
    preEntries: IPreEntry[],
  ): Promise<number[]> {
    const preEntryMap = preEntries.reduce(
      (acc, preEntry) => {
        const { utmCallToActions } = preEntry;
        for (const utmCallToAction of utmCallToActions) {
          const key = this.getUtmAndCallToActionKey(utmCallToAction);
          acc.set(key, utmCallToAction);
        }
        acc.set(
          this.getUtmAndCallToActionKey(preEntry.utmCallToAction),
          preEntry.utmCallToAction,
        );
        return acc;
      },
      new Map() as Map<string, IUtmCallToAction>,
    );
    const shortLinkMap = new Map<string, ICallToActionLink>();
    for (const [key, value] of (
      await this.createShortLinks(preEntryMap)
    ).entries()) {
      shortLinkMap.set(key, value);
    }

    const storeSet = new Set<number>();

    preEntries.forEach((preEntry) => {
      const { utmCallToActions, utmCallToAction, storeId } = preEntry;
      preEntry.shortLinks = utmCallToActions.map((utmCallToAction) =>
        this.func(storeSet, shortLinkMap, { utmCallToAction, storeId }),
      );

      preEntry.shortLink = this.func(storeSet, shortLinkMap, {
        utmCallToAction,
        storeId,
      });
    });
    return Array.from(storeSet);
  }

  private updatePathVariable = (preEntries: IPreEntry[]): void => {
    preEntries.forEach((preEntry) => {
      const { campaignService, shortLinks = [] } = preEntry;
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
      callToAction.storeReferenceId ?? ''
    }|${(callToAction.storeReferenceIds || []).sort((a, b) => a - b).join(',')}|${
      callToAction.macroId ?? ''
    }|${callToAction.brandId ?? ''}`;
  }

  private async createShortLinks(
    preMap: Map<string, IUtmCallToAction>,
  ): Promise<Map<string, ICallToActionLink>> {
    const integration = new LbApiOperacionesIntegration();
    const responses = await integration.createAllShortLink(
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
      const { key, response } = obj as {
        key: string;
        response: { data?: { shortLink?: string } };
      };
      const data = (response?.data ?? { utm: {} }) as {
        utm: { websiteURL?: string; shortenURL?: string };
      }; // TODO include the interface for LB-API response
      acc.set(key, {
        fullUrl: data.utm.websiteURL ?? '',
        shortenUrl: data.utm.shortenURL ?? '',
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
    const shortLink = shortLinkMap.get(
      this.getUtmAndCallToActionKey(utmCallToAction),
    );
    if (this.isEmptyLink(shortLink)) {
      storeSet.add(storeId);
    }
    return shortLink as ICallToActionLink;
  };

  private isEmptyLink(link: ICallToActionLink | undefined): boolean {
    return !link || link.fullUrl === '' || link.shortenUrl === '';
  }
}
