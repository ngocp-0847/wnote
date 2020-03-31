import Head from 'next/head';
import Layout from '../../components/layout.js';
import React, { Component } from 'react';
import NoSSR from 'react-no-ssr';
import { RichEditor } from '../../components/RichEditor';
import {EditorState, convertToRaw} from 'draft-js';
import Router, { useRouter, withRouter } from 'next/router';
import {connect} from 'react-redux';
import {loadListNote,
  startSaveNote,
  routeChangeComplete,
  loadNoteById,
  updateEditorState,
  newEmptyNote,
  activeNoteSidebar,
  setSearch,
  unsetSearch
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
    let contentState = editorState.getCurrentContent();
    let arrBlocks = contentState.getBlocksAsArray();
    let shortText = null;
    let shortImage = null;

    arrBlocks.forEach((block, key) => {
      let text = block.getText().trim().substr(0, 100);

      if (shortImage == null && block.getType() == 'atomic') {
        let blockKey = block.getEntityAt(0);
        if (blockKey) {
          const blockImage = contentState.getEntity(blockKey);
          shortImage = blockImage.getData();
        }
      }
      if (shortText == null && text != '') {
        shortText = text
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
        var rawTextSearch = editorState.getCurrentContent().getPlainText();
        var body = {
            'content': JSON.stringify(convertToRaw(editorState.getCurrentContent())),
            'shortContent': shortContent,
            'userID': localStorage.getItem('userID'),
            'rawTextSearch': rawTextSearch,
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

  search = (e) => {
    let eventText = e.target.value.trim();
    console.log('search:components:', eventText);
    if (eventText != '') {
      this.props.setSearch(eventText);
    } else {
      this.props.unsetSearch();
    }
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
            <div className="wrap-search">
              <input name="input-search" className="input-search" placeholder="Search" onChange={this.search} />
            </div>
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
  setSearch: setSearch,
  unsetSearch: unsetSearch,
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(WID)));
