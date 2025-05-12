// import { IFrequencyParameter } from '../mocks/interfaces.ts';
// import { frequencyByLocationAndStatusAndRange } from '../mocks/campaign-frequency.mock.ts';

export { frequencyByLocationAndStatusAndRange } from '../mocks/campaign-frequency.mock.ts';

// const getLocationStatusRangeKey = ({
//   locationId,
//   storeStatus,
//   from,
//   to,
//   communicationChannel,
// }: Partial<IFrequencyParameter>): string => {
//   const timeRange = from || to ? `${from ?? 'Any'}to${to ?? 'Any'}` : null;
//   return `${communicationChannel}|${locationId}|${storeStatus}|${timeRange ?? ''}`;
// };

// const frequencyMap = frequencyByLocationAndStatusAndRange.reduce(
//   (acc, parameter) => {
//     acc.set(getLocationStatusRangeKey(parameter), parameter.frequency);
//     return acc;
//   },
//   new Map(),
// );
