import Layout from '../../components/layout.js';
import React, { useEffect, useState, useRef, Component } from 'react';
import NoSSR from 'react-no-ssr';
import Router, { useRouter, withRouter } from 'next/router';
import {connect} from 'react-redux';

import {
  loadListNote,
  startSaveNote,
  routeChangeComplete,
  loadNoteById,
  updateEditorState,
  newEmptyNote,
  activeNoteSidebar,
  setSearch,
  unsetSearch,
  deleteNote,
  loadDefineIdentity,
  initDetailnote
} from '../../redux/actions/noteAction';
import classNames from 'classnames';
import {debounce} from 'lodash';
import 'react-quill/dist/quill.snow.css';

class FormHtmlEditor extends Component {
  constructor(props) {
    super(props)
    if (document) {
        this.quill = require('react-quill');
        this.refQuill = null;
    }
  }

  modules = {
    toolbar: [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean']  
    ],
  }

  getRef() {
    return this.refQuill
  }

  getEditor() {
    return this.refQuill.getEditor()
  }

  render() {
    const Quill = this.quill
    if (Quill) {
      return (
        <Quill
            modules={this.modules}
            ref={(e) => {this.refQuill = e}}
            onChange={this.props.onChange}
            theme="snow"
            value={this.props.value}
        />
      )
    } else {
      return null
    }
  }
}

function WID(props) {
    const [eventText, setEventText] = useState('');
    const reactQuillRef = useRef();
    const initFlag = useRef(true);

    let onNewNote = () => {
        props.newEmptyNote();
    };

    let pushToService = () => {
        const editorState = props.editorState;
        let rawTextSearch = editorState
        if (reactQuillRef.current != null) {
            rawTextSearch = reactQuillRef.current.getEditor().getText();
        }

        var body = {
            'content': editorState,
            'shortContent': {shortText: rawTextSearch.substring(0, 100), shortImage: null},
            'userID': localStorage.getItem('userID'),
            'rawTextSearch': rawTextSearch,
            'createdAt': new Date().getTime(),
            'updatedAt': new Date().getTime(),
        }
        props.startSaveNote([props.router.query.id, body])
    };

    let debouncePush = debounce(pushToService, 300);

    let onChangeEditor = (editorState) => {
        if (props.shouldSave) {
            props.updateEditorState(editorState);
        }
    };

    useEffect(() => {
        if (props.shouldSave) {
            debouncePush();
        }
    }, [props.editorState]);

    useEffect(() => {
        props.initDetailnote({noteID: props.router.query.id});
    }, []);

    let activeNoteSidebar = (note) => {
        props.activeNoteSidebar(note)
    };

    let debounceSearch = debounce(() => {
        console.log('search:debounceSearch:', eventText, initFlag.current);
        if (eventText != '') {
            props.setSearch(eventText);
        } else {
            if (!initFlag.current) {
                props.unsetSearch();
            }
            initFlag.current = false;
        }
    }, 300);

    let search = (e) => {
        console.log('search:', e.target.value.trim())
        setEventText(e.target.value.trim());
    };

    useEffect(() => {
        debounceSearch()
    }, [eventText]);

    let deleteNote = (e) => {
        props.deleteNote(props.noteActive._id);
    };

    let router = useRouter()
    let logout = (e) => {
        router.push('/api/auth/logout')
    }

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
                                props.notes && props.notes.map((note, i) => {

                                let styleText = styleNotImage;
                                if (note._source && note._source.shortContent
                                    && note._source.shortContent.shortImage) {
                                    styleText = styleHasImage;
                                }
                                return (
                                    <div key={i} className={classNames({'note-c': true, 'active': note._id == props.noteActive._id})}
                                        onClick={activeNoteSidebar.bind(this, note)}>
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
                    <button id="btn-n-note" onClick={onNewNote}>New</button>
                    <div className="wrap-search">
                        <input name="input-search" className="input-search" placeholder="Search" onChange={search} />
                    </div>
                    <div id="con-r">
                        <button id="btn-d-no" onClick={deleteNote}>Delete</button>
                    </div>
                    <div className="auth">
                        <span id="avatar"><img src={props.userAuth && props.userAuth._source.photos[0].value} className="re-img"/></span>
                        <span id="name-auth" >{props.userAuth && props.userAuth._source.username}</span>
                        <div id="wr-ar-lo" >
                            <a onClick={logout} id="btn-logout">Logout</a>
                        </div>
                    </div>
                </div>
                <NoSSR>
                    <div className="editor">
                        <FormHtmlEditor value={props.editorState}
                            ref={reactQuillRef}
                            onChange={onChangeEditor} />
                    </div>
                </NoSSR>
            </div>
        </main>
    )
}

const mapStateToProps = state => {
  return {
    notes: state.note.notes,
    noteActive: state.note.noteActive,
    shouldSave: state.note.shouldSave,
    editorState: state.note.editorState,
    userAuth: state.note.userAuth,
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
    loadDefineIdentity: loadDefineIdentity,
    initDetailnote: initDetailnote,
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(WID)));
