import { SelectionState, EditorState, Modifier, AtomicBlockUtils, genKey } from 'draft-js';
import {isEmpty} from 'lodash';
/**
 * Function returns collection of currently selected blocks.
 */
export function getSelectedBlocksMap(editorState) {
    const selectionState = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const startKey = selectionState.getStartKey();
    const endKey = selectionState.getEndKey();
    const blockMap = contentState.getBlockMap();
    return blockMap
      .toSeq()
      .skipUntil((_, k) => k === startKey)
      .takeUntil((_, k) => k === endKey)
      .concat([[endKey, blockMap.get(endKey)]]);
  }

/**
 * Function returns collection of currently selected blocks.
 */
export function getSelectedBlocksList(editorState) {
    return getSelectedBlocksMap(editorState).toList();
}

/**
 * Function returns the first selected block.
 */
export function getSelectedBlock(editorState) {
    if (editorState) {
        return getSelectedBlocksList(editorState).get(0);
    }
    return undefined;
}

/**
 * Function returns list of all blocks in the editor.
 */
export function getAllBlocks(editorState) {
  if (editorState) {
    return editorState
      .getCurrentContent()
      .getBlockMap()
      .toList();
  }
  return new List();
}

export function insertBlockAfterKey(editorState, blockKey, blockMapInsert) {
  const selection = editorState.getSelection();
  const contentState = editorState.getCurrentContent();
  const currentBlock = contentState.getBlockForKey(selection.getStartKey());
  const currentType = currentBlock.getType();
  const blockMap = contentState.getBlockMap();
  let startOffsetCharactor = selection.getStartOffset();
   // Split the blocks
  let blocksBefore = blockMap.toSeq().takeUntil(function (v) {
      return v === currentBlock
   })
  const blocksAfter = blockMap.toSeq().skipUntil(function (v) {
      return v === currentBlock
  }).rest()
  console.log('insertBlockAfterKey:currentBlock:', currentBlock);

  let isFirstBlockInsert = true;
  let lastBlockKey = null;
  let anchorOffset = null;

  for(let [key, blockInsert] of blockMapInsert) {
    if (isFirstBlockInsert) {
      let characterBeforeSelect = currentBlock.getText().slice(0, startOffsetCharactor);
      blockInsert = currentBlock.merge({text: characterBeforeSelect+blockInsert.getText(),
        characterList: blockInsert.getCharacterList()});
      blocksBefore = blocksBefore.concat([[blockInsert.getKey(), blockInsert]]);
      isFirstBlockInsert = false;
    } else {
      blockInsert = blockInsert.merge({type: currentType});
      blocksBefore = blocksBefore.concat([[key, blockInsert]]);
    }

    lastBlockKey = blockInsert.getKey();
    anchorOffset = blockInsert.getLength();
  }

  if (!isEmpty(blocksAfter.toArray())) {
    blocksBefore = blocksBefore.concat(blocksAfter)
  }
  const newBlockMap = blocksBefore.toOrderedMap();
  console.log('insertBlockAfterKey:blocksBuild:', newBlockMap.toJS());
  let newContentState = contentState.merge({
    blockMap: newBlockMap,
    selectionBefore: selection,
    selectionAfter: selection,
  })

  let newEditorState = EditorState.push(editorState, newContentState, 'insert-fragment');

  if (lastBlockKey != null && anchorOffset != null) {
    let newSelection = selection.merge({
      anchorKey: lastBlockKey,
      anchorOffset: anchorOffset,
    });

    newEditorState = EditorState.forceSelection(
      newEditorState,
      newSelection
    );
  }

  return newEditorState;
}

export function getEntities(editorState, entityType = null) {
    const content = editorState.getCurrentContent();
    const entities = [];
    content.getBlocksAsArray().forEach((block) => {
        let selectedEntity = null;
        block.findEntityRanges(
            (character) => {
                if (character.getEntity() !== null) {
                    const entity = content.getEntity(character.getEntity());
                    if (!entityType || (entityType && entity.getType() === entityType)) {
                        selectedEntity = {
                            entityKey: character.getEntity(),
                            blockKey: block.getKey(),
                            entity: content.getEntity(character.getEntity()),
                        };
                        return true;
                    }
                }
                return false;
            },
            (start, end) => {
                entities.push({...selectedEntity, start, end});
            });
    });
    return entities;
};

