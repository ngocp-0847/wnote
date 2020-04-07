var Draft = require('draft-js');
var getIndentation = require('./utils/getIndentation');
var getIndentForLine = require('./utils/getIndentForLine');

ContentState = Draft.ContentState;
ContentBlock = Draft.ContentBlock;
SelectionState = Draft.SelectionState;
EditorState = Draft.EditorState;

const { Record, List } = require('immutable');

// TODO: tab should complete indentation instead of just inserting one

var indentation = '  ';

function removeIndentText(text) {
  let currentIndentLine = getIndentForLine(text);
  return text.substr(currentIndentLine.length);
}

/**
 * return [anchorOffset, focusOffset] for selection remove.
 * @param  {[type]} text [description]
 * @return {[type]}      [description]
 */
function offsetIndentWillRemove(text) {
  let currentIndentLine = getIndentForLine(text);
  return text.substr(currentIndentLine.length);
}
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

  if (selectionState.isCollapsed()) {
    if (e.shiftKey) {
      let blockText = currentBlock.getText();
      let currentIndentLine = getIndentForLine(blockText);
      let newIndent = '';
      let newTextChange = '';
      const length = currentBlock.getLength();

      if (currentIndentLine != '') {
        if (currentIndentLine.length >= indentation.length) {
          newIndent = currentIndentLine.substr(indentation.length);
        }
      }
      console.log('onTab:shiftKey:', '|'+newIndent+'|', '|'+removeIndentText(blockText)+'|')
      const blockSelection = SelectionState
          .createEmpty(currentBlock.getKey())
          .merge({
            anchorOffset: 0,
            focusOffset: length,
          });
      newTextChange = newIndent + removeIndentText(blockText);
      contentState = Draft.Modifier.replaceText(
        contentState,
        blockSelection,
        newTextChange
      )
      let newEditorState = Draft.EditorState.push(
        editorState,
        contentState,
        'insert-text'
      );
      console.log('onTab:newIndent:', newIndent.length, '|'+newIndent+'|');
      let currentKey = currentBlock.getKey();
      let newSelection = selectionState.merge({
        anchorKey: currentKey,
        anchorOffset: newIndent.length,
        focusKey: currentKey,
        focusOffset: newIndent.length,
      });

      newEditorState = EditorState.forceSelection(
        newEditorState,
        newSelection
      );

      return newEditorState;
    } else {
      contentState = Draft.Modifier.insertText(
        contentState,
        selectionState,
        indentation
      );
      return Draft.EditorState.push(
        editorState,
        contentState,
        'insert-text'
      );
    }
  } else {
    let anchorKey = selectionState.getAnchorKey();
    let anchorOffset = selectionState.getAnchorOffset();
    let focusKey = selectionState.getFocusKey();
    let focusOffset = selectionState.getFocusOffset();
    let isBackward = selectionState.getIsBackward();

    console.log('onTab:key:', anchorKey, focusKey);

    let block = contentState.getBlockForKey(anchorKey);

    while (block != null) {
      const blockKey = block.getKey();
      const length = block.getLength();

      const blockSelection = SelectionState
          .createEmpty(blockKey)
          .merge({
            anchorOffset: 0,
            focusOffset: length,
          });
      let newTextChange = '';
      let blockText = block.getText();
      let currentIndentLine = getIndentForLine(blockText);
      let newIndent = '';

      if (e.shiftKey) {
        if (currentIndentLine != '') {
          if (currentIndentLine.length >= indentation.length) {
            newIndent = currentIndentLine.substr(indentation.length);
          }
        }
        let deltaMove = (currentIndentLine.length - newIndent.length);
        if (anchorKey == blockKey) {
          anchorOffset -= deltaMove;
        }
        if (focusKey == blockKey) {
          focusOffset -= deltaMove;
        }
        console.log('onTab:shiftKey:', newIndent+'|', removeIndentText(blockText)+'|')
        newTextChange = newIndent + removeIndentText(blockText);
      } else {
        if (anchorKey == blockKey) {
          anchorOffset += indentation.length;
        }

        if (focusKey == blockKey) {
          focusOffset += indentation.length;
        }

        newTextChange = indentation + block.getText();
      }

      contentState = Draft.Modifier.replaceText(
        contentState,
        blockSelection,
        newTextChange
      )

      const isBreak = (!isBackward && blockKey == endKey) || (isBackward && blockKey == startKey);
      if (isBreak) {
        break;
      } else {
        if (selectionState.getIsBackward()) {
          block = contentState.getBlockBefore(blockKey)
        } else {
          block = contentState.getBlockAfter(blockKey)
        }
      }
    }

    let newEditorState = Draft.EditorState.push(
      editorState,
      contentState,
      'insert-text'
    );
    let keyCreated = isBackward ? focusKey : anchorKey;
    const newSelection = SelectionState
        .createEmpty(keyCreated)
        .merge({
          anchorKey: anchorKey,
          anchorOffset: anchorOffset,
          focusKey: focusKey,
          focusOffset: focusOffset,
          isBackward: isBackward,
        });

    newEditorState = EditorState.forceSelection(
      newEditorState,
      newSelection
    );
    return newEditorState;
  }
}

module.exports = onTab;
