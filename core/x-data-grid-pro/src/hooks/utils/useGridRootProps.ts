import { useGridRootProps as useCommunityGridRootProps } from '@cronoslogistics/hive-tablepro/core/x-data-grid/src';
import { DataGridProProcessedProps } from '../../models/dataGridProProps';

export const useGridRootProps = useCommunityGridRootProps as () => DataGridProProcessedProps;
