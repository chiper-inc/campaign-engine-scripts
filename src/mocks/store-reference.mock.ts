import { IStoreReferenceData } from '../integrations/interfaces.ts';

const queryImageParams = 'w=800&h=400&fit=fill&bg=white';
const storeRerenceArray: [number | null, [number, string]][] = [
  [null, [-1, 'https://chiper-old-imgs.imgix.net/app/no-image-ryahXCwGV-R.jpg']],
];

export const StoreReferenceMap: Map<number | null, IStoreReferenceData> = new Map(
  storeRerenceArray.map(([storeReferenceId, [referenceId, regular]]) => [
    storeReferenceId,
    {
      referenceId,
      storeReferenceId: storeReferenceId as unknown as number,
      regular: `${regular}?${queryImageParams}`,
    },
  ]),
);
