import Layout from '../../components/layout.js';
import React, { useEffect, useState, useRef, useMemo, Component } from 'react';
import { useRouter, withRouter } from 'next/router';
import {connect} from 'react-redux';
import RichEditor from '../../components/RichEditor';
import { Transforms, Node } from 'slate';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';

const serialize = value => {
    return (
      value
        // Return the string content of each paragraph in the value's children.
        .map(n => Node.string(n))
        // Join them all with line breaks denoting paragraphs.
        .join('\n')
    )
}

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
  initDetailnote,
  pinNote
} from '../../redux/actions/noteAction';

import classNames from 'classnames';
import {debounce} from 'lodash';


import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from 'react-loader-spinner';

function WID(props) {
    const [eventText, setEventText] = useState('');
    const initFlag = useRef(true);
    const editorRef = useRef(null);

    let router = useRouter();

    let onNewNote = () => {
        Transforms.deselect(editorRef.current);
        props.newEmptyNote();
    };

    let pushToService = () => {
        const editorState = props.editorState;
        let rawTextSearch = serialize(editorState);
       
        var body = {
            'content': JSON.stringify(editorState),
            'shortContent': {shortText: rawTextSearch.substring(0, 100), shortImage: null},
            'userID': localStorage.getItem('userID'),
            'rawTextSearch': rawTextSearch,
            'createdAt': new Date().getTime(),
            'updatedAt': new Date().getTime(),
        }
        console.log('startSaveNote:', props.shouldSave);
        props.startSaveNote([props.router.query.id, body])
    };

    let debouncePush = debounce(pushToService, 300);

    let onChangeEditor = (editorState) => {
        props.updateEditorState(editorState);
    };

    useEffect(() => {
        console.log('shouldSave:', props.shouldSave);
        if (props.shouldSave.length == 0) {
            debouncePush();
        }
    }, [props.editorState]);

    useEffect(() => {
        console.log('componentDid:props.router:', props.router);
        props.initDetailnote({noteID: props.router.query.id});
    }, []);

    useEffect(() => {
        if (editorRef.current) {
            console.log('router:change:', editorRef.current)
            // editorRef.current.moveTo(0);
        }
        console.log('query:change:');
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

    const [isPinned, setIsPinned] = useState(false);
    let pinNote = (e) => {
        props.pinNote({noteID: props.noteActive._id, action: !isPinned});
    };

    useEffect(() => {
        if (props.userAuth && props.noteActive) {
            let notePinned = _.find(props.notesPinned, (o) => {
                return o._id == props.noteActive._id;
            });
            setIsPinned(notePinned !== undefined);
        }
    }, [props.notesPinned, props.noteActive]);

    console.log('isPinned', isPinned);

    const styleNotImage = {maxWidth: '100%'};
    const styleHasImage = {maxWidth: '122px'};
      
    return (
        <main>
            <div id="stick-note">
                <div id="inner-stick">
                    <p id="header-ln">pinned</p>
                        <div className="list-note">
                            <ul className="ul-note">
                            {
                                props.notesPinned && props.notesPinned.map((note, i) => {

                                let styleText = styleNotImage;
                                if (note._source && note._source.shortContent
                                    && note._source.shortContent.shortImage) {
                                    styleText = styleHasImage;
                                }
                                return (
                                    <li key={i} className={classNames({'note-c': true, 'active': note._id == props.noteActive._id})}
                                        onClick={activeNoteSidebar.bind(this, note)}>
                                        <span style={styleText} className="text">{(note._source && note._source.shortContent) ? note._source.shortContent.shortText.substring(0, 18) : ''}</span>
                                    </li>
                                )
                                })
                            }
                            </ul>  
                        </div>
                </div>
            </div> 
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
                    <div id="con-r-n">
                        <Button id="btn-n-note" color="primary" onClick={onNewNote} size="small">
                            New
                        </Button>
                        <Input id="input-search" placeholder="Search"  size="small" onChange={search} />
                        <Button color="primary" onClick={pinNote} size="small">
                            {isPinned ? 'Unpin' : 'Pin'}
                        </Button>
                        <Button id="btn-delete" color="secondary" onClick={deleteNote} size="small">
                            Delete
                        </Button>
                    </div>
                    <div className="auth">
                        <span id="avatar"><img src={props.userAuth && props.userAuth._source.photos[0].value} className="re-img"/></span>
                        <span id="name-auth" >{props.userAuth && props.userAuth._source.username}</span>
                        <div id="wr-ar-lo" >
                            <Button id="btn-logout" color="secondary" onClick={logout} size="small">
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            
                <div className="editor">
                    {props.shouldSave.length != 0 && (<Loader type="ThreeDots" color="#2BAD60" height="100" width="100" />)}
                    <RichEditor 
                        value={props.editorState} 
                        editorRef={(e) => editorRef.current = e}
                        onChange={newValue => onChangeEditor(newValue)} />
                </div>

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
    notesPinned: state.note.notesPinned,
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
    pinNote: pinNote,
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(WID)));
