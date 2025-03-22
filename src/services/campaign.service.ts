import { TypeCampaignVariables } from "../types.ts";
import { IUtm } from "../integrations/interfaces.ts";

export abstract class CampaignService {
  protected readonly lng: string = 'es';
  protected constructor(lng = 'es'){
    this.lng = lng;
  }

  public abstract utm: IUtm;

  public getVariablesForN(
    variables: TypeCampaignVariables, 
    n: number
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
}