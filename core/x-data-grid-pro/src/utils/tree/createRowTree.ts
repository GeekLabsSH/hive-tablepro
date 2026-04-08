import { GridRowId, GridTreeNode, GRID_ROOT_GROUP_ID } from '@cronoslogistics/hive-tablepro/core/x-data-grid/src';
import { buildRootGroup, GridRowTreeCreationValue } from '@cronoslogistics/hive-tablepro/core/x-data-grid/src/internals';
import { DataGridProProps } from '../../models/dataGridProProps';
import { insertDataRowInTree } from './insertDataRowInTree';
import { GridTreePathDuplicateHandler, RowTreeBuilderNode } from './models';

interface CreateRowTreeParams {
  nodes: RowTreeBuilderNode[];
  defaultGroupingExpansionDepth: number;
  isGroupExpandedByDefault?: DataGridProProps['isGroupExpandedByDefault'];
  groupingName: string;
  onDuplicatePath?: GridTreePathDuplicateHandler;
}

/**
 * Transform a list of rows into a tree structure where each row references its parent and children.
 */
export const createRowTree = (params: CreateRowTreeParams): GridRowTreeCreationValue => {
  const dataRowIds: GridRowId[] = [];
  const tree: Record<GridRowId, GridTreeNode> = {
    [GRID_ROOT_GROUP_ID]: buildRootGroup(),
  };
  const treeDepths: GridRowTreeCreationValue['treeDepths'] = {};

  for (let i = 0; i < params.nodes.length; i += 1) {
    const node = params.nodes[i];
    dataRowIds.push(node.id);

    insertDataRowInTree({
      tree,
      id: node.id,
      path: node.path,
      onDuplicatePath: params.onDuplicatePath,
      treeDepths,
      isGroupExpandedByDefault: params.isGroupExpandedByDefault,
      defaultGroupingExpansionDepth: params.defaultGroupingExpansionDepth,
    });
  }

  return {
    tree,
    treeDepths,
    groupingName: params.groupingName,
    dataRowIds,
  };
};
