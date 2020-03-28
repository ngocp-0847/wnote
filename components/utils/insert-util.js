import {EditorState, ContentBlock} from 'draft-js';

export default (direction, editorState) => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const currentBlock = contentState.getBlockForKey(selection.getEndKey());

   const blockMap = contentState.getBlockMap()
   // Split the blocks
   const blocksBefore = blockMap.toSeq().takeUntil(function (v) {
      return v === currentBlock
   })
   const blocksAfter = blockMap.toSeq().skipUntil(function (v) {
      return v === currentBlock
   }).rest()
   const newBlockKey = genKey()
   let newBlocks = direction === 'before' ? [
      [newBlockKey, new ContentBlock({
         key: newBlockKey,
         type: 'unstyled',
         text: '',
         characterList: List(),
      })],
      [currentBlock.getKey(), currentBlock],
   ] : [
      [currentBlock.getKey(), currentBlock],
      [newBlockKey, new ContentBlock({
         key: newBlockKey,
         type: 'unstyled',
         text: '',
         characterList: List(),
      })],
   ];
   const newBlockMap = blocksBefore.concat(newBlocks, blocksAfter).toOrderedMap()
   const newContentState = contentState.merge({
      blockMap: newBlockMap,
      selectionBefore: selection,
      selectionAfter: selection,
   })
   return EditorState.push(editorState, newContentState, 'insert-fragment');
}
