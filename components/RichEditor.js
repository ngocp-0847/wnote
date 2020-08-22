import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';


function RichEditor(pros) {
  onChange = editorState => {
    console.log('onChange:', getAllBlocks(editorState).toJS(), getEntities(editorState))
    this.props.onChange(editorState);
  };
  
  return (
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


