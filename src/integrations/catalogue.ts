import { MONEY_FORMATTER } from '../constants.ts';
import { LOCATION } from '../enums.ts';
import { Config } from '../config.ts';
import { ICatalogueReference } from './interfaces.ts';

export interface ICatalogueProductPrice {
  storeReferences: {
    id: number;
    name: string;
    description: string;
    storeReferenceName: string;
    packagingType: string;
    stock: number;
    sku: string;
    brandId?: number;
    brandName?: string;
    subCategoryId: number;
    macroId: number;
    medium: string;
    formattedPrice?: {
      customerTotal: number;
      total: number;
      discount?: number;
      maxQuantity?: number;
    }[];
  }[];
  storeRefenceIdsInStock: number[];
}

export class CatalogueIntegration {
  private readonly url: string;
  private readonly oldImageUrl: string;
  private readonly newImageUrl: string;
  private readonly headers: { [key: string]: string };
  private readonly loggerInfo = {
    stt: 'stt-chatbot',
    context: CatalogueIntegration.name,
    functionName: 'undetermined',
    message: 'NO INFORMATION',
  };

  constructor() {
    this.url = Config.catalogue.apiUrl;
    this.oldImageUrl = Config.catalogue.oldImageUrl;
    this.newImageUrl = Config.catalogue.newImageUrl;
    this.headers = {
      ['Content-Type']: 'application/json',
      ['Version']: '2.0',
    };
  }

  async getReferencePricesFromCatalogue({
    storeReferenceIds,
    warehouseIds,
    locationId,
    storeId,
  }: {
    storeReferenceIds: number[];
    warehouseIds: number[];
    locationId: LOCATION;
    storeId: number;
  }): Promise<{
    status: number;
    statusText: string;
    data?: ICatalogueReference[];
  }> {
    const url = `${this.url}/cart/${storeId}/references`;
    const body = {
      storeReferenceIds,
      promotIds: [],
      warehouseIds,
      locationId: Number(locationId),
    };
    const functionName = this.getReferencePricesFromCatalogue.name;
    const input = { url, body, params: { storeId }, headers: this.headers };
    const resp = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data: ICatalogueReference[] | undefined =
          res.status === 200
            ? this.formatReferencesPrices({
                prices: await res.json(),
                locationId: locationId,
                source: 'catalogue',
              })
            : undefined;
        return {
          status: res.status,
          statusText: res.statusText,
          data,
        };
      })
      .catch((error) => {
        console.error({
          ...this.loggerInfo,
          functionName,
          message: error.message,
          error,
          data: { input },
        });
        throw error;
      });
    return resp;
  }

  private formatReferencesPrices({
    prices,
    locationId,
    source,
  }: {
    prices: ICatalogueProductPrice;
    locationId: LOCATION;
    source: string;
  }): ICatalogueReference[] {
    console.log(JSON.stringify(prices, null, 2));
    const { storeReferences } = prices;
    const moneyFormat = (
      MONEY_FORMATTER[locationId] ?? MONEY_FORMATTER[LOCATION._default]
    ).format;
    const storeReferenceIdsSet = new Set();

    return storeReferences.reduce(
      (accum: ICatalogueReference[], storeReference) => {
        if (storeReferenceIdsSet.has(storeReference.id)) return accum;

        const pricing = storeReference.formattedPrice;
        if (!pricing || !pricing.length) return accum;

        const display = this.formatDescription(storeReference.name);
        const name = this.formatDescription(storeReference.description);
        const description = this.formatDescription(
          storeReference.storeReferenceName,
        );
        const brandName = this.formatDescription(
          storeReference.brandName || 'No Disponible',
        );
        const url = this.formatImageUrl(storeReference.medium);
        const packaging = this.formatPackaging(storeReference.packagingType);
        const [a, b = { total: undefined }] = pricing;
        const pricingSummary =
          pricing.length > 1
            ? {
                regularTotal: moneyFormat(b.total ?? 0),
                discountedTotal: moneyFormat(a.total),
                discount: a.discount,
                discountedMaximumQuantity: a.maxQuantity,
                showAs: 'discounted_product',
              }
            : {
                regularTotal: moneyFormat(a.total),
                showAs: 'regular_product',
              };
        storeReferenceIdsSet.add(storeReference.id);
        accum.push({
          id: storeReference.id,
          sku: storeReference.sku,
          display,
          name,
          description,
          stockout: !storeReference.stock ? 1 : 0,
          packaging,
          brandId: storeReference.brandId || 0,
          brandName,
          macroId: storeReference.macroId,
          categoryId: storeReference.subCategoryId,
          url,
          source,
          ...pricingSummary,
        });
        return accum;
      },
      [] as ICatalogueReference[],
    );
  }

  private formatDescription(description: string): string {
    return description.trim().replace(/\s{2,}/g, ' ');
  }

  private formatPackaging(description: string): string {
    return description.trim().replace(/\(s\)|\(es\)/g, '');
  }

  private formatImageUrl(url: string): string {
    return `${url}`.replace(this.oldImageUrl, this.newImageUrl);
  }
}
