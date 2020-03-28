import Head from 'next/head';
import Layout from '../../components/layout.js';
import React, { Component } from 'react';
import NoSSR from 'react-no-ssr';
import { RichEditor } from '../../components/RichEditor';
import {EditorState, ContentState, convertToRaw} from 'draft-js';
import Router, { useRouter, withRouter } from 'next/router';
import {connect} from 'react-redux';
import {loadListNote,
  startSaveNote,
  routeChangeComplete,
  loadNoteById,
  updateEditorState,
  newEmptyNote,
  activeNoteSidebar
} from '../../redux/actions/noteAction';
import classNames from 'classnames';

class WID extends Component {
  constructor(props) {
    super(props);
    Router.events.on('routeChangeComplete', (url) => {
      this.props.routeChangeComplete(url)
    });

    this.props.loadNoteById({noteID: this.props.router.query.id})
  }
  getContentForShortext = (editorState) => {
    var contentState = editorState.getCurrentContent();
    var arrBlocks = contentState.getBlocksAsArray();
    var shortText = null;
    var shortImage = null;

    arrBlocks.forEach((block, key) => {
      var text = block.getText();

      if (shortImage == null && block.getType() == 'atomic') {
        var blockKey = block.getEntityAt(0)
        const blockImage = contentState.getEntity(blockKey);
        shortImage = blockImage.getData();
      }
      if (shortText == null && text.trim() != '') {
        shortText = block.getText()
      }
      if (shortImage != null && shortText != null) {
        return false;
      }
    })

    return {shortText: shortText, shortImage: shortImage}
  }

  onNewNote = () => {
    this.props.newEmptyNote();
  };

  onChange = (editorState) => {
      if (this.props.shouldSave) {
        var shortContent = this.getContentForShortext(editorState)
        var body = {
            'content': JSON.stringify(convertToRaw(editorState.getCurrentContent())),
            'shortContent': shortContent,
            'userID': localStorage.getItem('userID'),
            'createdAt': new Date().getTime(),
            'updatedAt': new Date().getTime(),
        }
        this.props.updateEditorState(editorState);
        this.props.startSaveNote([this.props.router.query.id, body])
      }
  };

  componentDidMount() {
    var body = {
        userID: localStorage.getItem('userID'),
    }

    this.props.loadListNote(localStorage.getItem('userID'))
  }
  activeNoteSidebar = (note) => {
    this.props.activeNoteSidebar(note)
  };
  render() {
    return (
      <main>
        <div className="sidebar-note">
          <div className="inner-list-note">
            <p id="header-ln">notes</p>
            <div className="wr-hei-note">
              <div className="list-note">
                  {
                    this.props.notes.map((note, i) => {
                      return (
                        <div key={i} className={classNames({'note-c': true, 'active': note._id == this.props.noteActive._id})} onClick={this.activeNoteSidebar.bind(this, note)}>
                          <div className="text">{note._source.shortContent ? note._source.shortContent.shortText : ''}</div>
                          {
                            (note._source.shortContent && note._source.shortContent.shortImage) &&
                            (
                              <div className="image-s">
                                <img src={(note._source.shortContent && note._source.shortContent.shortImage) ? note._source.shortContent.shortImage.src : ''} />
                              </div>
                            )
                          }
                        </div>
                      )
                    })
                  }
              </div>
            </div>
          </div>
        </div>
        <div className="main-note">
          <div id="header-editor">
            <h4 id="title-note">Editor</h4>
            <button id="btn-n-note" onClick={this.onNewNote}>New</button>
          </div>
          <NoSSR>
            <div className="editor">
              <RichEditor
                editorState={this.props.editorState}
                onChange={this.onChange}
                ref={element => {
                  this.editor = element
                }}
                />
            </div>
          </NoSSR>
        </div>
      </main>
    )
  }
}

const mapStateToProps = state => {
  return {
    notes: state.note.notes,
    noteActive: state.note.noteActive,
    shouldSave: state.note.shouldSave,
    editorState: state.note.editorState,
  };
};

const mapDispatchToProps = {
  loadNoteById: loadNoteById,
  loadListNote: loadListNote,
  startSaveNote: startSaveNote,
  routeChangeComplete: routeChangeComplete,
  updateEditorState: updateEditorState,
  newEmptyNote: newEmptyNote,
  activeNoteSidebar: activeNoteSidebar,
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(WID)));
