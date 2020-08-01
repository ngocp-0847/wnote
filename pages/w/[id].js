import Head from 'next/head';
import Layout from '../../components/layout.js';
import React, { useEffect, useState } from 'react';
import NoSSR from 'react-no-ssr';
import { RichEditor } from '../../components/RichEditor';
import convertToRaw from '../../draft-js/lib/convertFromDraftStateToRaw.js';
import Router, { useRouter, withRouter } from 'next/router';
import {connect} from 'react-redux';
import {useIdentity} from '../../lib/withIdentity';

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
  loadDefineIdentity
} from '../../redux/actions/noteAction';
import classNames from 'classnames';
import {debounce} from 'lodash';

function WID(props) {
    Router.events.on('routeChangeComplete', (url) => {
        props.routeChangeComplete(url)
    });

    const [eventText, setEventText] = useState('');
    const [editor, setEditor] = useState(null);

    let getContentForShortext = (editorState) => {
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

    let onNewNote = () => {
        props.newEmptyNote();
    };

    let pushToService = () => {
        const editorState = props.editorState;
        var shortContent = getContentForShortext(editorState);
        var rawTextSearch = editorState.getCurrentContent().getPlainText();
        var body = {
            'content': JSON.stringify(convertToRaw(editorState.getCurrentContent())),
            'shortContent': shortContent,
            'userID': localStorage.getItem('userID'),
            'rawTextSearch': rawTextSearch,
            'createdAt': new Date().getTime(),
            'updatedAt': new Date().getTime(),
        }
        props.startSaveNote([props.router.query.id, body])
    };

    let debouncePush = debounce(pushToService, 300);

    let onChangeEditor = (editorState) => {
        console.log('onChangeEditor:', props.shouldSave)
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
        props.loadDefineIdentity();
        var body = {
            userID: localStorage.getItem('userID'),
        }
        props.loadListNote(localStorage.getItem('userID'))
        props.loadNoteById({noteID: props.router.query.id})
    }, []);

    let activeNoteSidebar = (note) => {
        props.activeNoteSidebar(note)
    };

    let debounceSearch = debounce(() => {
        console.log('search:debounceSearch:', eventText);
        if (eventText != '') {
            props.setSearch(eventText);
        } else {
            props.unsetSearch();
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

    const styleNotImage = {maxWidth: '100%'};
    const styleHasImage = {maxWidth: '122px'};

    let router = useRouter();

    let login = () => {
        router.push('/api/auth/github')
    };
    
    const userAuth = useIdentity();
    console.log('userAuth:', userAuth)
    const isLogin = userAuth == null ? false : true;
    let areaAuth = null;
    if (isLogin) {
        areaAuth = (<div className="auth">
                <span id="avatar"><img src={userAuth.photos[0].value} className="re-img"/></span>
                <span id="name-auth" >{userAuth.username}</span>
            </div>);
    } else {
        areaAuth = (<div className="auth">
                <button id="btn-login" onClick={login}>Login</button>
            </div>);
    }
    
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
                {areaAuth}
            </div>
            <NoSSR>
                <div className="editor">
                <RichEditor
                    editorState={props.editorState}
                    onChange={onChangeEditor}
                    ref={element => {
                        setEditor(element)
                    }}
                    />
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
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(WID)));
