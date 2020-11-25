import Layout from '../../components/layout.js';
import React, { useEffect, useState, useRef, useCallback} from 'react';
import { useRouter, withRouter } from 'next/router';
import {connect} from 'react-redux';
import RichEditor from '../../components/RichEditor';
import { Transforms, Node } from 'slate';
import Button from '@material-ui/core/Button';
import AsyncCreatableSelect from 'react-select/async-creatable';
import request from '../../redux/requestHelper';
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
  pinNote,
  saveTags
} from '../../redux/actions/noteAction';

import classNames from 'classnames';
import {debounce} from 'lodash';

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from 'react-loader-spinner';

function WID(props) {
    console.log('rerun:WID')
    const [eventText, setEventText] = useState('');
    const initFlag = useRef(true);
    const editorRef = useRef(null);

    const handleChangeTags = (tags) => {
        console.log('handleChangeTags:', tags)
        let ntags = [];
        if (tags && Array.isArray(tags)) {
            ntags = tags.map((item) => {return item.value})
        }

        let body = {
            tags: ntags,
        }
        props.saveTags([props.router.query.id, body])
    };

    let router = useRouter();

    let onNewNote = () => {
        Transforms.deselect(editorRef.current);
        props.newEmptyNote();
    };

    let debouncePush = useRef(debounce((editorState, noteID) => {
        let rawTextSearch = serialize(editorState);

        var body = {
            'content': JSON.stringify(editorState),
            'shortContent': {shortText: rawTextSearch.substring(0, 100), shortImage: null},
            'userID': localStorage.getItem('userID'),
            'rawTextSearch': rawTextSearch,
            'createdAt': new Date().getTime(),
            'updatedAt': new Date().getTime(),
        }
        console.log('startSaveNote:', body);
        props.startSaveNote([noteID, body])
      }, 2300));

    let onChangeEditor = (editorState) => {
        props.updateEditorState(editorState);
    };

    useEffect(() => {
        console.log('shouldSave:', props.shouldSave);
        if (props.shouldSave.length == 0) {
            console.log('trigger:debouncePush');
            debouncePush.current(props.editorState, props.router.query.id);
        }
    }, [props.editorState]);

    useEffect(() => {
        console.log('componentDid:props.router:', props.router);
        props.initDetailnote({noteID: props.router.query.id});
    }, []);

    useEffect(() => {
        if (editorRef.current) {
            console.log('router:change:', editorRef.current)
        }
        console.log('query:change:');
    }, [router.query.id]);

    let activeNoteSidebar = (note) => {
        props.activeNoteSidebar(note)
    };

    let debounceSearch = useRef(debounce((eventText, initFlag) => {
        console.log('search:debounceSearch:', eventText, initFlag.current);
        if (eventText != '') {
            props.setSearch(eventText);
        } else {
            if (!initFlag.current) {
                props.unsetSearch();
            }
            initFlag.current = false;
        }
      }, 1300));

    let search = (e) => {
        console.log('search:', e.target.value.trim())
        setEventText(e.target.value.trim());
    };

    useEffect(() => {
        debounceSearch.current(eventText, initFlag)
    }, [eventText]);

    let deleteNote = (e) => {
        props.deleteNote(props.noteActive._id);
    };

    let logout = (e) => {
        router.push('/api/auth/logout')
    }

    const [isPinned, setIsPinned] = useState(false);

    let tags = (props.noteActive._source && props.noteActive._source.tags) ? props.noteActive._source.tags : []
    tags = tags.map((item) => {
        return {
            value: item,
            label: item,
        }
    })

    console.log('tags:', tags)
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

    let onTabKeyDown = (e) => {
        console.log('onTabKeyDown:', e.keyCode)
    }

    let promisesOption = debounce((inputValue, callback) => {
        let paramSearch = new URLSearchParams({search: inputValue}).toString()

        request('/api/note/suggest-tags?' + paramSearch, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *client,
        }).then((response) => {
            if (response.code == 200) {
                let optionRemotes = response.data.tags.body.hits.hits.map((item) => {
                    return {
                        value: item._id,
                        label: item._id,
                    }
                });
                console.log('optionRemotes:', optionRemotes)
                callback(optionRemotes)
            } else {
                callback([])
            }
        })
    }, 500)


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
                <div id="header-editor" className="flex pl-4 pt-1 pb-1 mb-2 bg-gray-200">
                    <div id="con-r-n items-start flex-grow">
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
                    <div id="tabs-area" className="">
                        <AsyncCreatableSelect
                            isMulti
                            components={{ ClearIndicator:() => null }}
                            onKeyDown={onTabKeyDown}
                            onChange={handleChangeTags}
                            value={tags}
                            loadOptions={promisesOption}
                        />
                    </div>
                    <div className="flex flex-1 rounded-lg items-end justify-end">
                        <span id="avatar"><img src={props.userAuth && props.userAuth._source.photos[0].value} className="re-img w-6"/></span>
                        <div className="m-2">
                            <span id="name-auth" >{props.userAuth && props.userAuth._source.username}</span>
                        </div>
                        <div id="wr-ar-lo" className="items-end">
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
    saveTags: saveTags,
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
