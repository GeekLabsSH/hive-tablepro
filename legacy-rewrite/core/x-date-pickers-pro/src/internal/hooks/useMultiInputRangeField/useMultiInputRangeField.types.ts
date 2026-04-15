import { UseFieldResponse } from '@geeklabssh/hive-tablepro/core/x-date-pickers/src/internals';

export interface UseMultiInputRangeFieldResponse<TChildProps extends {}> {
  startDate: UseFieldResponse<TChildProps> & { error: boolean; readOnly: boolean };
  endDate: UseFieldResponse<TChildProps> & { error: boolean; readOnly: boolean };
}
