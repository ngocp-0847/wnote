var Draft = require('draft-js');
var getIndentation = require('./utils/getIndentation');
ContentState = Draft.ContentState;
ContentBlock = Draft.ContentBlock;
SelectionState = Draft.SelectionState;

const { Record, List } = require('immutable');

// TODO: tab should complete indentation instead of just inserting one

/**
 * Handle pressing tab in the editor
 *
 * @param {SyntheticKeyboardEvent} event
 * @param {Draft.EditorState} editorState
 * @return {Draft.EditorState}
 */
function onTab(e, editorState) {
  e.preventDefault();

  var contentState = editorState.getCurrentContent();
  var selectionState = editorState.getSelection();
  var startKey = selectionState.getStartKey();
  var endKey = selectionState.getEndKey();

  var currentBlock = contentState.getBlockForKey(startKey);
  var endBlock = contentState.getBlockForKey(endKey);

  var indentation = getIndentation(currentBlock.getText());

  if (selectionState.isCollapsed()) {
    contentState = Draft.Modifier.insertText(
      contentState,
      selectionState,
      indentation
    );
  } else {
    contentState.getBlockMap().map((block, k) => {
      const blockKey = block.getKey();
      const length = block.getLength()

      const blockSelection = SelectionState
          .createEmpty(blockKey)
          .merge({
            anchorOffset: 0,
            focusOffset: length,
          });

          contentState = Draft.Modifier.replaceText(
            contentState,
            blockSelection,
            indentation + block.getText(),
          )
    })
  }

  return Draft.EditorState.push(
    editorState,
    contentState
  );
}

module.exports = onTab;
