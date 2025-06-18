import * as UTILS from '../utils/index.ts';
import * as MOCKS from '../mocks/connectly-greetings.mock.ts';

import { TypeCampaignVariables, TypeStore } from '../types.ts';
import { IUtm, ICallToActionLink, IUtmCallToAction } from './interfaces.ts';
import { CampaignProvider } from './campaign.provider.ts';
import { ConnectlyCarouselNotificationAI } from './connectly.vertex-ai.provider.ts';
import { MessageMetadata } from './message.metadata.ts';
import { CHANNEL, STORE_STATUS } from '../enums.ts';
import { WhatsappMessageFactory } from './whatsapp.message.factory.ts';
import { CHANNEL_PROVIDER } from '../constants.ts';

export class WhatsappCampaignProvider extends CampaignProvider {
  constructor(
    store: TypeStore,
    campaignName: string,
    variables: TypeCampaignVariables,
    utm: IUtm,
    lng: string,
  ) {
    super(variables, lng);
    this.messageValues.push(
      WhatsappMessageFactory.createWhatsappMessageProvider(
        CHANNEL_PROVIDER[CHANNEL.WhatsApp],
        {
          store,
          campaignName,
          utm: {
            ...utm,
            campaignContent: undefined,
          },
        },
      ),
    );
  }

  public async setMessagesVariables(includeGenAi: boolean): Promise<this> {
    const carouselContentGenerator =
      ConnectlyCarouselNotificationAI.getInstance();
    const { greeting } = includeGenAi
      ? ((await carouselContentGenerator.generateContent(
          this.variableValues,
        )) as { greeting: string; products: string[] })
      : // products removed from here;
        { greeting: this.generateGreeting(this.variableValues) };

    this.messageValues.forEach((message) => {
      message.setVariables({
        ...this.variableValues,
        greeting,
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

  private generateGreeting(variables: TypeCampaignVariables): string {
    const greetings =
      MOCKS.GREETINGS[variables.sgmt as STORE_STATUS] ||
      MOCKS.GREETINGS[STORE_STATUS._default];
    const greetingTemplate = UTILS.choose(greetings);
    return UTILS.replaceParams(greetingTemplate, [variables.name]);
  }
}
