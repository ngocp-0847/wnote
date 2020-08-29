import Layout from '../../components/layout.js';
import React, { useEffect, useState, useRef, Component } from 'react';
import NoSSR from 'react-no-ssr';
import { useRouter, withRouter } from 'next/router';
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

import highlight from 'highlight.js';
import 'highlight.js/styles/github-gist.css';

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from 'react-loader-spinner';

class FormHtmlEditor extends Component {
  constructor(props) {
    super(props)
    if (document) {
        highlight.configure({
            languages: ['javascript', 'php'],
        })
        this.quill = require('react-quill');
        const ImageUploader = require('../../quill-image-uploader/src/quill.imageUploader');
        var Size = this.quill.Quill.import('attributors/style/size');
        Size.whitelist = ['16px', '18px', '20px'];
        this.quill.Quill.register(Size, true);

        this.quill.Quill.register({
            "modules/imageUploader": ImageUploader.default,
        });
        this.refQuill = null;
    }
  }

  modules = {
    syntax: {
        highlight: text => highlight.highlightAuto(text).value,
    },
    toolbar: [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'size': ['16px', '18px', '20px'] }],
        [{ 'header': [1, 2, 3, 4, false] }],
        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean']  
    ],
    clipboard: {
        matchVisual: false,
    },
    imageUploader: {
        upload: file => {
            return new Promise((resolve, reject) => {
                const formData = new FormData();
                formData.append("image", file);
                fetch("/api/note/upload",
                  {
                    method: "POST",
                    body: formData
                  }
                )
                  .then(response => response.json())
                  .then(result => {
                    console.log(result);
                    resolve(result.data.uri);
                  })
                  .catch(error => {
                    reject("Upload failed");
                    console.error("Error:", error);
                  });
            });
        }
    },
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
            value={this.props.value}
            theme='snow'
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
    let router = useRouter();

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
        props.updateEditorState(editorState);
    };

    useEffect(() => {
        if (props.shouldSave) {
            debouncePush();
        }
    }, [props.editorState]);

    useEffect(() => {
        console.log('componentDid:props.router:', props.router);
        props.initDetailnote({noteID: props.router.query.id});
    }, []);

    useEffect(() => {
        console.log('query:change:');
        if (reactQuillRef.current != null) {
            console.log('setSelection:');
        }
    }, [router.query.id]);

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
                        {!props.shouldSave && (<Loader type="ThreeDots" color="#2BAD60" height="100" width="100" />)}
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
