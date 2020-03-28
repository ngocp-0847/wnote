import React from 'react';
import {Editor, EditorState, RichUtils, Entity, AtomicBlockUtils,
  Modifier, DefaultDraftBlockRenderMap, genKey ,
  getDefaultKeyBinding, KeyBindingUtil
} from 'draft-js';

import CodeUtils from '../draft-js-code/lib';
import Atomic from './Atomic';
import CodeBlock from './CodeBlock';
import {getCurrentBlock} from '../components/utils/editor';
import {addBlock, addAtomicBlock, addBlockWithKey} from '../components/utils/modifiers';
import {getAllBlocks, insertBlockAfterKey} from '../components/utils';

import { Map } from 'immutable';

const ACCEPTED_MIMES_FOR_PASTE = [
  'image/png',
  'image/jpeg',
  'image/gif',
];

const newBlockRenderMap = Map({
});
const extendedBlockRenderMap = DefaultDraftBlockRenderMap.merge(newBlockRenderMap);

const {hasCommandModifier} = KeyBindingUtil;

function myKeyBindingFn(e) {
  console.log('myKeyBindingFn:', e, e.shiftKey);
  if (e.keyCode === 83 /* `S` key */ && hasCommandModifier(e)) {
    return 'myeditor-save';
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
    const contentStateWithEntity = contentState.createEntity('image', 'IMMUTABLE', {src: base64});
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
  onChange = editorState => {
    console.log('onChange:', getAllBlocks(editorState).toJS())
    this.props.onChange(editorState);
  };

  focus = () => this.refs.editor.focus();

  handleKeyCommand = command => {
    console.log('handleKeyCommand:', command);
    if (command === 'myeditor-save') {
      return 'handled';
    }
    return 'not-handled';

    // const { editorState } = this.props;
    // const newState = RichUtils.handleKeyCommand(editorState, command);
    // if (newState) {
    //   this.onChange(newState);
    //   return true;
    // }
    // return false;
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
    if (block.getType() === 'atomic') {
      return {
        component: Atomic,
        editable: true,
      };
    }

    return null;
  };
  handlePastedText = (text, html, editorState) => {
    const blockMapTextPaste = ContentState.createFromText(text.trim()).blockMap;
    const contentState = editorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();
    const selectionState = editorState.getSelection();
    const currentBlock = getCurrentBlock(editorState);
    console.log('handlePasteListText:', blockMapTextPaste.toJS())

    if (currentBlock.getType() == 'code-block') {
      let editorState = this.props.editorState;
      editorState = insertBlockAfterKey(editorState, currentBlock.getKey(), blockMapTextPaste)
      console.log('after add Block:', getAllBlocks(editorState).toJS());
      this.onChange(editorState);
      console.log('return true');
      return true;
    } else {
      var newState = Modifier.replaceWithFragment(
        this.props.editorState.getCurrentContent(),
        this.props.editorState.getSelection(),
        blockMap
      );
      newState = EditorState.push(this.props.editorState, newState, 'insert-fragment');
    }
    this.onChange(newState);
    return true;
  };
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
      <div className="RichEditor-root">
        <BlockStyleControls
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        <div className={className} onClick={this.focus}>
          <Editor
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
            placeholder="Write note..."
            ref="editor"
            spellCheck={true}
            // plugins={[codeEditorPlugin]}
          />
        </div>
           <style jsx global>{`
              .RichEditor-root {
                background: #fff;
                border: 1px solid #ddd;
                font-family: 'Georgia', serif;
                font-size: 14px;

                padding: 15px;
              }

              .RichEditor-editor {
                border-top: 1px solid #ddd;
                cursor: text;
                font-size: 16px;
                margin-top: 10px;
              }

              .RichEditor-editor .public-DraftEditorPlaceholder-root,
              .RichEditor-editor .public-DraftEditor-content {
                margin: 0 -15px -15px;
                padding: 15px;
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
              }

              .RichEditor-editor .public-DraftStyleDefault-pre pre {
                // white-space: normal;
              }

              .RichEditor-controls {
                font-family: 'Helvetica', sans-serif;
                font-size: 14px;
                margin-bottom: 5px;
                user-select: none;
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
// Custom overrides for "code" style.
const styleMap = {
  // CODE: {
  //   backgroundColor: 'rgba(0, 0, 0, 0.05)',
  //   fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
  //   fontSize: 12,
  //   padding: 2,
  //   margin: 2,
  // },
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
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();
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
];
const InlineStyleControls = props => {
  var currentStyle = props.editorState.getCurrentInlineStyle();
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
