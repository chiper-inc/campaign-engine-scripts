import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { IUtm } from '../integrations/interfaces.ts';
import { CampaignService } from './campaign.service.ts';
import { ConnectlyMessageService } from './connectly.message.service.ts';
import { ICallToActionLink } from '../main.ts';

export class ConnectlyCampaignService extends CampaignService {
  constructor(
    store: TypeStore,
    campaignName: string,
    variables: TypeCampaignVariables,
    utm: IUtm,
    lng: string,
  ) {
    super(variables, lng);
    this.messageValues.push(
      new ConnectlyMessageService(store, campaignName, utm),
    );
  }

  public setMessagesVariables(): this {
    this.messageValues.forEach((message) => {
      message.setVariables(this.variableValues);
    });
    return this;
  }

  public setPathVariables(shortLinks: ICallToActionLink[]): this {
    const utm = this.messageValues[0].utm;

    const paths: string[] = [];
    for (const variable in this.variableValues) {
      if (variable.startsWith('path')) {
        paths.push(variable);
      }
    }

    paths.forEach((path, i) => {
      const shortLink = this.getPathVariable({
        url:
          shortLinks[i].shortenUrl ?? `https://sl.chiper.co/shortlink_${i + 1}`,
        utm,
      });
      this.variableValues[path] = shortLink;
    });
    return this;
  }

  private getPathVariable({ utm, url }: { utm: IUtm; url: string }) {
    const queryParams = `utm_source=${utm.campaignSource || ''}&utm_medium=${
      utm.campaignMedium || ''
    }&utm_content=${utm.campaignContent || ''}&utm_campaign=${
      utm.campaignName
    }&utm_term=${utm.campaignTerm || ''}`;
    return `${url.split('/').slice(3)}?${queryParams}`; // remove protocol and hostname
  }
}
