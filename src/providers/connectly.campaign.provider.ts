import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { IUtm, ICallToActionLink } from '../integrations/interfaces.ts';
import { CampaignProvider } from './campaign.provider.ts';
import { ConnectlyMessageProvider } from './connectly.message.provider.ts';

export class ConnectlyCampaignProvider extends CampaignProvider {
  constructor(
    store: TypeStore,
    campaignName: string,
    variables: TypeCampaignVariables,
    utm: IUtm,
    lng: string,
  ) {
    super(variables, lng);
    this.messageValues.push(
      new ConnectlyMessageProvider(store, campaignName, utm),
    );
  }

  public async setMessagesVariables(): Promise<this> {
    this.messageValues.forEach((message) => {
      message.setVariables(this.variableValues);
    });
    return Promise.resolve(this);
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

  public getMessageName(): string {
    return `${this.messageValues[0]?.messageName ?? ''}`;
  }
}
