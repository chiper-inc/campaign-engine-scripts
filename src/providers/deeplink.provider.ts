import { LbApiOperacionesIntegration } from '../integrations/lb-api-operaciones.ts';
import {
  ICallToAction,
  ICallToActionLink,
  IUtm,
} from '../integrations/interfaces.ts';
import { IPreEntry, IUtmCallToAction } from '../scripts/interfaces.ts';
import { CampaignProvider } from './campaign.provider.ts';

export class DeeplinkProvider {
  private readonly lbApiOperacionesIntegration: LbApiOperacionesIntegration;
  constructor() {
    this.lbApiOperacionesIntegration = new LbApiOperacionesIntegration();
  }

  public generateLinks = async (
    preEntries: IPreEntry[],
    includeLinks: boolean,
  ): Promise<IPreEntry[]> => {
    if (!includeLinks) return Promise.resolve(preEntries);

    const preEntriesWithShortLinks =
      await this.generateCallToActionShortLinks(preEntries);
    return this.generatePathVariable(preEntriesWithShortLinks);
  };

  private async generateCallToActionShortLinks(
    preEntries: IPreEntry[],
  ): Promise<IPreEntry[]> {
    const preMap: Map<string, IUtmCallToAction> = preEntries.reduce(
      (acc, preEntry) => {
        const { utmCallToActions } = preEntry;
        for (const utmCallToAction of utmCallToActions) {
          const key = this.getUtmAndCallToActionKey(utmCallToAction);
          acc.set(key, utmCallToAction);
        }
        return acc;
      },
      new Map(),
    );

    // console.error('Short Links:', preMap);

    const shortLinkMap = new Map();
    for (const [key, value] of (
      await this.createShortLinks(preMap)
    ).entries()) {
      shortLinkMap.set(key, value);
    }
    return preEntries.map((preEntry) => {
      const { utmCallToAction, utmCallToActions } = preEntry;
      return {
        ...preEntry,
        shortLink: shortLinkMap.get(
          this.getUtmAndCallToActionKey(utmCallToAction),
        ),
        shortLinks: utmCallToActions.map((utmCallToAction) =>
          shortLinkMap.get(this.getUtmAndCallToActionKey(utmCallToAction)),
        ),
      };
    });
  }

  private generatePathVariable = (preEntries: IPreEntry[]): IPreEntry[] => {
    return preEntries.map((preEntry) => {
      const { campaignService, shortLinks = [] } = preEntry;
      campaignService?.setPathVariables(shortLinks);
      return preEntry;
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
      })),
    );
    return responses.reduce((acc, obj) => {
      const { key, response, campaignService } = obj as {
        key: string;
        response: { data?: { shortLink?: string } };
        campaignService: CampaignProvider;
      };
      const data = (response?.data ?? { utm: {} }) as {
        utm: { websiteURL?: string; shortenURL?: string };
      }; // TODO include the interface for LB-API response
      acc.set(key, {
        fullUrl: data?.utm?.websiteURL ?? '',
        shortenUrl: data.utm.shortenURL ?? '',
        campaignService,
      });
      return acc;
    }, new Map());
  }
}
