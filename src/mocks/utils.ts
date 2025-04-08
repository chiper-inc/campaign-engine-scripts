
export const generateParams = (params: string[], length: number) =>
  Array.from({ length }, (_, i) => params.map((p) => `${p}_${i + 1}`)).flat();

export const NAME = ['name'];
export const NAME_SGMT = ['name', 'sgmt'];
export const PATH = ['path'];
export const SKU_DSCT_IMG = ['sku', 'dsct', 'img'];
export const SKU_DSCT = ['sku', 'dsct'];
