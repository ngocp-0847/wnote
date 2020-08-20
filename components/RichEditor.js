import React from 'react';

import {Editor, ContentState, EditorState, SelectionState,
  RichUtils, Entity, AtomicBlockUtils,
  Modifier, DefaultDraftBlockRenderMap,
  genKey , getDefaultKeyBinding, KeyBindingUtil} from '../draft-js/lib/Draft';

import convertFromHTML from '../draft-js/lib/convertFromHTMLToContentBlocks.js';

import CodeUtils from '../draft-js-code/lib';
import Atomic from './Atomic';
import CodeBlock from './CodeBlock';
import {getCurrentBlock} from '../components/utils/editor';
import {addBlock, addAtomicBlock} from '../components/utils/modifiers';
import {getAllBlocks, insertBlockAfterKey, getEntities} from '../components/utils';
import {createWithContent, appendBlocks} from '../components/decorator';
import eachSeries from 'async/eachSeries';

import {Map,OrderedSet} from 'immutable';

const ACCEPTED_MIMES_FOR_PASTE = [
  'image/png',
  'image/jpeg',
  'image/gif',
];

const newBlockRenderMap = Map({
  'span': {
    element: 'paragraph'
  },
});

const extendedBlockRenderMap = DefaultDraftBlockRenderMap.merge(newBlockRenderMap);

const {hasCommandModifier} = KeyBindingUtil;

function myKeyBindingFn(e) {
  console.log('myKeyBindingFn:', e, e.shiftKey, e.metaKey);
  if (e.keyCode === 83 /* `S` key */ && hasCommandModifier(e)) {
    return 'myeditor-save';
  } else if (e.metaKey && e.key === 'h') {
    return 'highlight';
  }

  return getDefaultKeyBinding(e);
}

export class RichEditor extends React.Component {
  constructor(props) {
    super(props);
  }

  readImageAsDataUrl = (image, callback) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result);
    };
    reader.readAsDataURL(image);
  };

  insertImageIntoEditor = (editorState, base64) => {
    const contentState = editorState.getCurrentContent()
    const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', {src: base64});
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

    const newEditorState = AtomicBlockUtils.insertAtomicBlock(
      editorState,
      entityKey,
      ' '
    );
    return newEditorState;
  };

  handlePastedFiles = (files) => {
    const { editorState } = this.props;
    if (files && files.length) {
      const file = files[0];

      if (ACCEPTED_MIMES_FOR_PASTE.includes(file.type)) {
        this.readImageAsDataUrl(file, base64 => {
          const withAtomic = this.insertImageIntoEditor(editorState, base64);
          this.onChange(withAtomic);
        });

        return 'handled';
      }
    }

    return 'not-handled';
  };

  handleDroppedFiles = (selection, files) => {
    const { editorState } = this.props;
    const anchorKey = selection.getAnchorKey();
    console.log('handleDroppedFiles:', selection, files);
    if (files && files.length) {
      let newEditorState = editorState;
      var iterator = (file, done) => {
        if (ACCEPTED_MIMES_FOR_PASTE.includes(file.type)) {
          this.readImageAsDataUrl(file, base64 => {
            console.log('handleDroppedFiles:readImageAsDataUrl:', selection, file);
            const contentState = newEditorState.getCurrentContent();
            const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', {src: base64});
            const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

            let focusOffset = selection.getFocusOffset();
            let anchorKeyDrop = selection.getAnchorKey();
            let blockDrop = contentState.getBlockForKey(anchorKeyDrop);
            const contentStateWithImgDrop = Modifier.insertText(contentStateWithEntity, selection, ' ', null, entityKey);

            newEditorState = EditorState.push(newEditorState, contentStateWithImgDrop, 'apply-entity');

            done(null, true);
          });
        } else {
          done(null, true);
        }
      };

      eachSeries(files, iterator, (err, res) => {
        console.log('handleDroppedFiles:async:', err, res);
        const newSelection = selection.merge({
          anchorOffset: selection.getAnchorOffset() + files.length,
          focusOffset: selection.getFocusOffset() + files.length,
        })
        newEditorState = EditorState.forceSelection(newEditorState, newSelection);
        newEditorState = RichUtils.insertSoftNewline(newEditorState);
        this.onChange(newEditorState);
      });

      return 'handled';
    }

    return 'not-handled';
  };

  getEntities = (editorState, entityType = null) => {
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

  onChange = editorState => {
    console.log('onChange:', getAllBlocks(editorState).toJS(), getEntities(editorState))
    this.props.onChange(editorState);
  };

  focus = () => this.refs.editor.focus();

  handleKeyCommand = command => {
    console.log('handleKeyCommand:', command);
    let newState = RichUtils.handleKeyCommand(this.props.editorState, command)
    if (command === 'myeditor-save') {
      return 'handled';
    } else if (command === 'backspace') {
      const editorState = this.props.editorState;
      const contentState = editorState.getCurrentContent();
      const selectionState = editorState.getSelection();
      if (!selectionState.isCollapsed()) return 'not-handled';
      const currentBlock = getCurrentBlock(editorState);
      console.log('handleKeyCommand:backspace:', currentBlock);
      if (currentBlock) {
        const entityKey = currentBlock.getEntityAt(selectionState.getAnchorOffset());
        if (entityKey) {
          const entityImage = contentState.getEntity(entityKey);
          if (entityImage.getType == 'IMAGE') {
            console.log('handleKeyCommand:backspace:selectionStateBefore:', selectionState);
            console.log('handleKeyCommand:entityImage:getStartOffset:',
              selectionState.getStartOffset(),
              selectionState.getFocusOffset(),
              selectionState.getAnchorOffset(),
              selectionState.getAnchorKey(),
              selectionState.getFocusKey(),
              currentBlock.getLength()
              );
            const withoutAtomicEntity = Modifier.removeRange(
              contentState,
              new SelectionState({
                anchorKey: currentBlock.getKey(),
                anchorOffset: selectionState.getAnchorOffset(),
                focusKey: currentBlock.getKey(),
                focusOffset: selectionState.getAnchorOffset() + 1,
              }),
              'backward',
            );
            const targetSelection = new SelectionState({
                anchorKey: currentBlock.getKey(),
                anchorOffset: selectionState.getAnchorOffset() - 1,
                focusKey: currentBlock.getKey(),
                focusOffset: selectionState.getAnchorOffset() - 1,
            });

            console.log('handleKeyCommand:backspace:afterSelection:', targetSelection);
            let newEditorState = EditorState.push(
              editorState,
              withoutAtomicEntity,
              'remove-range',
            );
            console.log('handleKeyCommand:backspace:', targetSelection);
            newEditorState = EditorState.forceSelection(newEditorState, targetSelection);

            this.onChange(newEditorState);
            return 'handled';
          }
        }
      }
    } else if (command === 'highlight') {
      newState = RichUtils.toggleInlineStyle(editorState, 'HIGHLIGHT');
      this.onChange(newState);
      return 'handled';
    }

    if (newState) {
      console.log('handleKeyCommand:newState:', newState);
      this.onChange(newState);
      return 'handled';
    }

    return 'not-handled';
  };
  handleDrop = (selection, dataTransfer, isInternal) => {
    if (isInternal) {
      const {editorState} = this.props;
      const contentState = editorState.getCurrentContent();
      let blockKey = dataTransfer.data.getData('blockKey');
      let start = parseInt(dataTransfer.data.getData('start'));
      let end = parseInt(dataTransfer.data.getData('end'));
      let entityKey = dataTransfer.data.getData('entityKey');
      let selectionState = SelectionState.createEmpty('foo');
      let removeSelection = selectionState.merge({
        anchorKey: blockKey,
        anchorOffset: start,
        focusKey: blockKey,
        focusOffset: end,
      });
      console.log('handleDrop:selection:', selection, removeSelection);
      const contentStateRemove = Modifier.removeRange(contentState, removeSelection, 'backward');
      console.log('handleDrop:contentStateRemove:', contentStateRemove);
      const contentStateDrop = Modifier.insertText(contentStateRemove, selection, ' ', null, entityKey);

      const newEditorState = EditorState.push(editorState, contentStateDrop, 'apply-entity');
      setTimeout(() => {
        this.onChange(newEditorState);
      }, 0);
      return 'handled';
    }
    console.log('handleDrop:',selection, dataTransfer.data, isInternal);
    return 'not-handled';
  };
  onTab = (evt) => {
    const { editorState } = this.props;
    if (!CodeUtils.hasSelectionInBlock(editorState)) return 'not-handled';

    this.onChange(CodeUtils.onTab(evt, editorState));
    return 'handled';
  }
  toggleBlockType = blockType => {
    this.onChange(RichUtils.toggleBlockType(this.props.editorState, blockType));
  };
  toggleInlineStyle = inlineStyle => {
    this.onChange(
      RichUtils.toggleInlineStyle(this.props.editorState, inlineStyle)
    );
  };
  myBlockRenderer = block => {
    const type = block.getType();
    // console.log('myBlockRenderer:getEntityAt:', block.getType(), block, block.getEntityAt(0));
    if (block.getType() === 'atomic' && block.getEntityAt(0)) {
      return {
        component: Atomic,
        editable: false,
      };
    }

    return null;
  };

  handlePastedText = (text, html, editorState) => {
    const contentState = editorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();
    const selectionState = editorState.getSelection();
    const currentBlock = getCurrentBlock(editorState);

    if (currentBlock.getType() == 'code-block') {
      const newContentState = Modifier.replaceText(contentState, selectionState, text.trim());
      const newEditorState = EditorState.push(editorState, newContentState, 'insert-fragment');
      // console.log('handlePastedText:addBlock:', getAllBlocks(newEditorState).toJS());
      this.onChange(newEditorState);
      return 'handled';
    } else {
      if (html) {
        const blocksFromHTML = convertFromHTML(html);
        const state = ContentState.createFromBlockArray(
          blocksFromHTML.contentBlocks,
          blocksFromHTML.entityMap,
        );
        this.onChange(appendBlocks(editorState, blocksFromHTML.contentBlocks, blocksFromHTML.entityMap));
        console.log('handlePastedText:blocksFromHTML:', blocksFromHTML.contentBlocks);
        return true;
      } else {
        let newContentState = Modifier.replaceText(
          contentState,
          selectionState,
          text
        )
        let newEditorState = EditorState.push(
          editorState,
          newContentState,
          'insert-text'
        );

        this.onChange(newEditorState);
        return true;
      }
    }
  };
  handleReturn = (e, editorState) => {
    console.log('handleReturn:', e, editorState);
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const blockKey = selection.getAnchorKey();
    const anchorOffset = selection.getAnchorOffset();
    const block = contentState.getBlockForKey(blockKey);
    const entityKey = block.getEntityAt(anchorOffset);
    if (entityKey) {
      const entityInstance = contentState.getEntity(entityKey);
      const newSelection = selection.merge({
        anchorOffset: selection.getAnchorOffset() + 1,
        focusOffset: selection.getFocusOffset() + 1,
      })
      if (entityInstance && entityInstance.type == 'IMAGE') {
        let newEditorState = EditorState.forceSelection(editorState, newSelection);
        newEditorState = RichUtils.insertSoftNewline(newEditorState);
        this.onChange(newEditorState);
        console.log('handleReturn:newSelection:', newSelection, newEditorState);
        return 'handled';
      }
      console.log('handleReturn:blockKey:', blockKey, block, entityInstance);
    }

    return 'not-handled';
  };
  onFocus = (e) => {
    const { editorState } = this.props;
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    setTimeout(() => {
      console.log('onFocus:', selection);
    }, 0)
  };
  componentDidMount () {
    console.log('componentDidMount:');
  }
  render() {
    const { editorState } = this.props;
    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = 'RichEditor-editor';
    var contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== 'unstyled') {
        className += ' RichEditor-hidePlaceholder';
      }
    }
    return (
      <div className="wrap-editor">
        <div className="toolbar">
          <BlockStyleControls
            editorState={editorState}
            onToggle={this.toggleBlockType}
          />
          <InlineStyleControls
            editorState={editorState}
            onToggle={this.toggleInlineStyle}
          />
        </div>
        <div className="area-scroll">
          <div className="RichEditor-root">
            <div className={className} onClick={this.focus}>
              <Editor
                handleDrop={this.handleDrop}
                handleDroppedFiles={this.handleDroppedFiles}
                blockRenderMap={extendedBlockRenderMap}
                handlePastedText={this.handlePastedText}
                blockRendererFn={this.myBlockRenderer}
                handlePastedFiles={this.handlePastedFiles}
                blockStyleFn={getBlockStyle}
                customStyleMap={styleMap}
                editorState={editorState}
                handleKeyCommand={this.handleKeyCommand}
                keyBindingFn={myKeyBindingFn}
                onChange={this.onChange}
                onTab={this.onTab}
                handleReturn={this.handleReturn}
                placeholder="Write note..."
                ref="editor"
                spellCheck={false}
                onFocus={this.onFocus}
                // plugins={[codeEditorPlugin]}
              />
            </div>
          </div>
        </div>
          <style jsx global>{`
            .wrap-editor{
              display: flex;
              flex-direction: column;
            }
            .wrap-editor .toolbar{
              display: block;
              padding: 4px;
            }
            .RichEditor-root {
              background: #fff;
              border-top: 1px solid #ddd;
              font-family: 'Georgia', serif;
              font-size: 14px;
              padding: 5px;
            }
            .RichEditor-editor {
              cursor: text;
              font-size: 16px;
              margin-top: 2px;
            }

            .RichEditor-editor .public-DraftEditorPlaceholder-root,
            .RichEditor-editor .public-DraftEditor-content {
              padding: 2px;
            }

            .RichEditor-editor .public-DraftEditor-content {
              min-height: 100px;
            }

            .RichEditor-hidePlaceholder .public-DraftEditorPlaceholder-root {
              display: none;
            }

            .RichEditor-editor .RichEditor-blockquote {
              border-left: 5px solid #eee;
              color: #666;
              font-family: 'Hoefler Text', 'Georgia', serif;
              font-style: italic;
              margin: 16px 0;
              padding: 10px 20px;
            }

            .RichEditor-editor .public-DraftStyleDefault-pre {
              background-color: rgba(0, 0, 0, 0.05);
              font-family: 'Inconsolata', 'Menlo', 'Consolas', monospace;
              font-size: 14px;
              padding: 5px;
              overflow-x: scroll;
            }

            .RichEditor-editor .public-DraftStyleDefault-pre pre {
              // white-space: normal;
              margin: 5px 0px;
            }

            .RichEditor-controls {
              font-family: 'Helvetica', sans-serif;
              font-size: 14px;
              margin-bottom: 5px;
              user-select: none;
              display: inline-block;
            }

            .RichEditor-styleButton {
              color: #999;
              cursor: pointer;
              margin-right: 16px;
              padding: 2px 0;
              display: inline-block;
            }

            .RichEditor-activeButton {
              color: #5890ff;
            }

        `}</style>
      </div>
    );
  }
}

const defaultStyle = {
  background: '#ffffb6',
  padding: '0 .2em',
};

// Custom overrides for "code" style.
const styleMap = {
  'HIGHLIGHT': {
    ...defaultStyle,
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote':
      return 'RichEditor-blockquote';
    default:
      return null;
  }
}
class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = e => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }
  render() {
    let className = 'RichEditor-styleButton';
    if (this.props.active) {
      className += ' RichEditor-activeButton';
    }
    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}
const BLOCK_TYPES = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  { label: 'H4', style: 'header-four' },
  { label: 'H5', style: 'header-five' },
  { label: 'H6', style: 'header-six' },
  { label: 'Blockquote', style: 'blockquote' },
  { label: 'UL', style: 'unordered-list-item' },
  { label: 'OL', style: 'ordered-list-item' },
  { label: 'Code Block', style: 'code-block' },
];
const BlockStyleControls = props => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const block = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey());

  let blockType = null;

  if (block) {
    blockType = block.getType();
  }

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map(type =>
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      )}
    </div>
  );
};
var INLINE_STYLES = [
  { label: 'Bold', style: 'BOLD' },
  { label: 'Italic', style: 'ITALIC' },
  { label: 'Underline', style: 'UNDERLINE' },
  { label: 'Monospace', style: 'CODE' },
  { label: 'Highlight', style: 'HIGHLIGHT' },
];
const InlineStyleControls = props => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const block = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey());

  let currentStyle = OrderedSet();

  if (block) {
    currentStyle = editorState.getCurrentInlineStyle();
  }

  // console.log('InlineStyleControls:currentStyle', currentStyle);
  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map(type =>
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      )}
    </div>
  );
};
