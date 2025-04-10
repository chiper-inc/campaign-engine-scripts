import * as UTILS from '../utils/index.ts';
import { ICallToActionLink } from './interfaces.ts';
import { TypeCampaignVariables } from '../types.ts';
import { MessageProvider } from './message.provider.ts';

export abstract class CampaignProvider {
  protected readonly lng: string;
  protected readonly messageValues: MessageProvider[];
  protected variableValues: TypeCampaignVariables;

  protected constructor(variables: TypeCampaignVariables, lng = 'es') {
    this.lng = lng;
    this.messageValues = [];
    this.variableValues = { ...variables };
  }

  public get messages() {
    return this.messageValues;
  }

  public get variables() {
    return this.variableValues;
  }

  public abstract setPathVariables(shortLinks: ICallToActionLink[]): this;

  public abstract setMessagesVariables(): Promise<this>;

  public abstract getMessageName(): string;

  public get integrationBody(): unknown[] {
    return this.messageValues.map((message) => message.integrationBody);
  }

  public getVariablesForN(
    variables: TypeCampaignVariables,
    n: number,
  ): TypeCampaignVariables {
    const common: TypeCampaignVariables = {};
    const obj: TypeCampaignVariables = {};
    for (const [k, value] of Object.entries(variables)) {
      const [key, index] = k.split('_');
      if (!index) {
        common[key] = value;
        continue;
      }

      const i = Number(index);
      if (Number.isNaN(i)) continue;

      if (i === n) obj[key] = value;
    }
    return { ...common, ...obj };
  }

  protected getPromotionMessage(description: string): string {
    const emojis = [
      '🛍️',
      '🔥',
      '📣',
      '🚨',
      '💥',
      '🔔',
      '💰',
      '🤑',
      '💲',
      '🛎️',
      '🛒',
    ];
    const prefix = UTILS.choose(emojis);
    const sufix = UTILS.choose(emojis);
    return String(prefix + ` ${description} ` + sufix);
  }
}
