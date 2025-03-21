import { IFrequencyParameter } from '../mocks/interfaces.ts';
import { frequencyByLocationAndStatusAndRange } from '../mocks/campaign-frequency.mock.ts';

export { frequencyByLocationAndStatusAndRange };

export const getLocationStatusRangeKey = (
  frequencyParameter: Partial<IFrequencyParameter>,
): string => {
  const { locationId, storeStatus, from, to } = frequencyParameter;
  const timeRange = from || to ? `${from ?? 'Any'}-${to ?? 'Any'}` : null;
  return `${locationId}|${storeStatus}|${timeRange ?? ''}`;
};

export const frequencyMap = frequencyByLocationAndStatusAndRange.reduce(
  (acc, parameter) => {
    acc.set(getLocationStatusRangeKey(parameter), parameter.frequency);
    return acc;
  },
  new Map(),
);
