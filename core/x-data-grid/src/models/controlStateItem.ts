import type { OutputSelector } from '../utils/createSelector';
import { GridCallbackDetails } from './api/gridCallbackDetails';
import type { GridControlledStateEventLookup, GridEventLookup } from './events';
import { GridStateCommunity } from './gridStateCommunity';

export interface GridControlStateItem<
  State extends GridStateCommunity,
  E extends keyof GridControlledStateEventLookup,
> {
  stateId: string;
  propModel?: GridEventLookup[E]['params'] | any;
  stateSelector:
  | OutputSelector<
    { state: State; instanceId: string },
    GridControlledStateEventLookup[E]['params']
  >
  | ((state: State) => GridControlledStateEventLookup[E]['params']);
  propOnChange?: (
    model: GridControlledStateEventLookup[E]['params'],
    details: GridCallbackDetails,
  ) => void;
  changeEvent: E;
}
