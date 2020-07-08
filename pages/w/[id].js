import Head from 'next/head';
import Layout from '../../components/layout.js';
import React, { Component } from 'react';
import NoSSR from 'react-no-ssr';
import { RichEditor } from '../../components/RichEditor';
import convertToRaw from '../../draft-js/lib/convertFromDraftStateToRaw.js';
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
  unsetSearch,
  deleteNote,
} from '../../redux/actions/noteAction';
import classNames from 'classnames';
import {debounce} from 'lodash';

class WID extends Component {
  constructor(props) {
    super(props);
    Router.events.on('routeChangeComplete', (url) => {
      this.props.routeChangeComplete(url)
    });

    this.state = {eventText: ''};

    this.props.loadNoteById({noteID: this.props.router.query.id})
  }

  getContentForShortext = (editorState) => {
    let contentState = editorState.getCurrentContent();
    let arrBlocks = contentState.getBlocksAsArray();
    let shortText = null;
    let shortImage = null;

    arrBlocks.forEach((block, key) => {
      let text = block.getText().trim().substr(0, 100);
      if (shortImage == null) {
        block.findEntityRanges(
          (character) => {
              if (character.getEntity() !== null) {
                  const entity = contentState.getEntity(character.getEntity());
                  if (shortImage == null && entity && entity.getType() === 'IMAGE') {
                      const entityInstance = contentState.getEntity(character.getEntity());
                      shortImage = entityInstance.getData();
                      return true;
                  }
              }
              return false;
          },
          (start, end) => {
          }
        );
      }
      if (shortText == null && text != '') {
        shortText = text
      } else if (shortText != null && shortText.length < 100 && text != '') {
        shortText += ' ' + text
      }

      if (shortImage != null && (shortText != null && shortText.length < 100)) {
        return false;
      }
    })

    return {shortText: shortText, shortImage: shortImage}
  }

  onNewNote = () => {
    this.props.newEmptyNote();
  };
  pushToService = () => {
    const editorState = this.props.editorState;
    var shortContent = this.getContentForShortext(editorState);
    var rawTextSearch = editorState.getCurrentContent().getPlainText();
    var body = {
        'content': JSON.stringify(convertToRaw(editorState.getCurrentContent())),
        'shortContent': shortContent,
        'userID': localStorage.getItem('userID'),
        'rawTextSearch': rawTextSearch,
        'createdAt': new Date().getTime(),
        'updatedAt': new Date().getTime(),
    }
    this.props.startSaveNote([this.props.router.query.id, body])
  };
  debouncePush = debounce(this.pushToService, 300);

  onChange = (editorState) => {
      if (this.props.shouldSave) {
        const newContent = editorState.getCurrentContent();
        const oldContent = this.props.editorState.getCurrentContent();
        if (!newContent.equals(oldContent)) {
          this.debouncePush();
        }
        this.props.updateEditorState(editorState);
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
  debounceSearch = debounce(() => {
    let eventText = this.state.eventText;
    console.log('search:debounceSearch:', eventText);
    if (eventText != '') {
      this.props.setSearch(eventText);
    } else {
      this.props.unsetSearch();
    }
  }, 300);

  search = (e) => {
    let eventText = e.target.value.trim();
    console.log('search:components:', eventText);
    this.setState({eventText: eventText});
    this.debounceSearch();
  };

  deleteNote = (e) => {
    this.props.deleteNote(this.props.noteActive._id);
  };

  render() {
    const styleNotImage = {maxWidth: '100%'};
    const styleHasImage = {maxWidth: '122px'};

    return (
      <main>
        <div className="sidebar-note">
          <div className="inner-list-note">
            <p id="header-ln">notes</p>
            <div className="wr-hei-note">
              <div className="list-note">
                  {
                    this.props.notes && this.props.notes.map((note, i) => {

                      let styleText = styleNotImage;
                      if (note._source && note._source.shortContent && note._source.shortContent.shortImage) {
                        styleText = styleHasImage;
                      }

                      return (
                        <div key={i} className={classNames({'note-c': true, 'active': note._id == this.props.noteActive._id})}
                          onClick={this.activeNoteSidebar.bind(this, note)}>
                          <div style={styleText} className="text">{(note._source && note._source.shortContent) ? note._source.shortContent.shortText : ''}</div>
                          {
                            (note._source && note._source.shortContent && note._source.shortContent.shortImage) &&
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
            <button id="btn-n-note" onClick={this.onNewNote}>New</button>
            <div className="wrap-search">
              <input name="input-search" className="input-search" placeholder="Search" onChange={this.search} />
            </div>
            <div id="con-r">
              <button id="btn-d-no" onClick={this.deleteNote}>Delete</button>
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
  deleteNote: deleteNote,
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(WID)));
