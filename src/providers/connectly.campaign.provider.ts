import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { IUtm, ICallToActionLink, IUtmCallToAction } from './interfaces.ts';
import { CampaignProvider } from './campaign.provider.ts';
import { ConnectlyMessageProvider } from './connectly.message.provider.ts';
import { ConnectlyCarouselNotificationAI } from './connectly.vertex-ai.provider.ts';
import { OFFER_TYPE } from '../repositories/interfaces.ts';
import { MessageMetadata } from './message.metadata.ts';

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
      new ConnectlyMessageProvider(store, campaignName, {
        ...utm,
        campaignContent: undefined,
      }),
    );
  }

  public async setMessagesVariables(): Promise<this> {
    // this.messageValues.forEach((message) => {
    //   console.log(message);
    // });

    const carouselContentGenerator =
      ConnectlyCarouselNotificationAI.getInstance();
    const carouselContent = (await carouselContentGenerator.generateContent(
      this.variableValues,
    )) as unknown as { greeting: string; products: string[] };

    const products: TypeCampaignVariables = {};
    for (let i = 0; i < carouselContent.products.length; i++) {
      const index = `sku_${i + 1}`;
      products[index] =
        this.variableValues[`type_${i + 1}`] === OFFER_TYPE.storeReference
          ? carouselContent.products[i]
          : this.getPromotionMessage(String(this.variableValues[index]));
    }

    this.messageValues.forEach((message) => {
      message.setVariables({
        ...this.variableValues,
        ...products,
        greeting: carouselContent.greeting,
      });
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
        utm: { ...utm, campaignContent: shortLinks[i].campaignContent },
      });
      this.variableValues[path] = shortLink;
    });

    this.messageValues.forEach((message) =>
      message.setPaths(this.variableValues),
    );

    // this.messageValues.forEach((message) => {
    //   console.log(message);
    // });

    return this;
  }

  public setMetadata(utmCallToActions: IUtmCallToAction[]): this {
    this.messageValues[0].metadata = utmCallToActions.map(
      (utmCallToAction) => new MessageMetadata(utmCallToAction),
    );
    return this;
  }

  private getPathVariable({ utm, url }: { utm: IUtm; url: string }) {
    const queryParams = `utm_content=${utm.campaignContent || ''}&utm_campaign=${
      utm.campaignName
    }&utm_source=${utm.campaignSource || ''}&utm_medium=${
      utm.campaignMedium || ''
    }&utm_term=${utm.campaignTerm || ''}`;
    return `${url.split('/').slice(3)}?${queryParams}`; // remove protocol and hostname which is included in the WA Template
  }

  public getMessageName(): string {
    return `${this.messageValues[0]?.messageName ?? ''}`;
  }
}
