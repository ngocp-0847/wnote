import Layout from '../../components/layout.js';
import React, {Component, useEffect, useState, useRef, useCallback, useMemo} from 'react';

import { useRouter, withRouter } from 'next/router';
import {connect} from 'react-redux';
import Button from '../../components/Button';
import AsyncCreatableSelect from 'react-select/async-creatable';
import request from '../../redux/requestHelper';
import Input from '../../components/Input';
import NoSSR from 'react-no-ssr';

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
  saveTags,
  loadNotesPagi,
} from '../../redux/actions/noteAction';

import classNames from 'classnames';
import {debounce} from 'lodash';
import 'react-quill/dist/quill.snow.css';

import highlight from 'highlight.js';
import 'highlight.js/styles/github-gist.css';

import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Loader from 'react-loader-spinner';

const customStylesSelect = {
    menu: (provided, state) => ({
        ...provided,
        width: state.selectProps.width,
        // borderBottom: '1px dotted pink',
        color: state.selectProps.menuColor,
        // padding: 10,
    }),
    control: (provided) => ({
        ...provided,
        width: 200,
        backgroundColor: '#edf2f7',
        borderTop: 'none',
        borderRight: 'none',
        borderLeft: 'none',
        borderRadius: 'none',
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        backgroundColor: '#64ea86',
    }),
    container: style => ({
        ...style,
    }),
}
class FormHtmlEditor extends Component {
    constructor(props) {
      super(props)
      if (typeof document !== 'undefined') {
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
    console.log('rerun:WID')
    const [eventText, setEventText] = useState('');
    const initFlag = useRef(true);
    const reactQuillRef = useRef();

    const handleChangeTags = useCallback((tags) => {
        console.log('handleChangeTags:', tags)
        let ntags = [];
        if (tags && Array.isArray(tags)) {
            ntags = tags.map((item) => {return item.value})
        }

        let body = {
            tags: ntags,
        }
        props.saveTags([props.router.query.id, body])
    }, [props.router.query.id]);

    let router = useRouter();

    let onNewNote = () => {
        props.newEmptyNote();
    };

    let debouncePush = useRef(debounce((editorState, noteID, rawTextSearch) => {
        var body = {
            'content': JSON.stringify(editorState),
            'shortContent': {shortText: rawTextSearch.substring(0, 100), shortImage: null},
            'userID': localStorage.getItem('userID'),
            'rawTextSearch': rawTextSearch,
            'createdAt': new Date().getTime(),
            'updatedAt': new Date().getTime(),
        }

        props.startSaveNote([noteID, body])
      }, 2300));

    let onChangeEditor = (editorState) => {
        props.updateEditorState(editorState);
    };

    useEffect(() => {
        console.log('shouldSave:', props.shouldSave);
        if (props.shouldSave.length == 0) {
            console.log('trigger:debouncePush:', props.router.query.id);
            let rawTextSearch = '';
            if (reactQuillRef.current != null) {
                rawTextSearch = reactQuillRef.current.getEditor().getText();
                debouncePush.current(props.editorState, props.router.query.id, rawTextSearch);
            }
        }
    }, [props.editorState]);

    useEffect(() => {
        console.log('componentDid:props.router:', props.router);
        props.initDetailnote({noteID: props.router.query.id});
    }, []);

    useEffect(() => {
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
    
    const mergedStylesSelect = useMemo(
        () => ({
          ...customStylesSelect,
        }),
    );

    const handleScrollList = (e) => {
        const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
        if (bottom) { 
            console.log('handleScrollList:touchbottom');
            props.loadNotesPagi();
        }
    }

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
                    <div className="wr-hei-note" onScroll={handleScrollList}>
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
                        <Button label="New" name="btn-new-note" variant="outlined" color="primary" onClick={onNewNote} size="small"></Button>
                        <Input name="input-search" placeholder="Search"  size="small" onChange={search} />
                        <Button label={isPinned ? 'Unpin' : 'Pin'} color="primary" onClick={pinNote} size="small" variant="outlined">
                        </Button>
                        <Button label="Delete" name="btn-delete" variant="outlined" color="secondary" onClick={deleteNote} size="small">
                        </Button>
                    </div>
                    <div id="tabs-area">
                        <AsyncCreatableSelect
                            isMulti
                            placeholder={'tags'}
                            components={{ ClearIndicator:() => null, DropdownIndicator:() => null }}
                            onKeyDown={onTabKeyDown}
                            onChange={handleChangeTags}
                            value={tags}
                            styles={mergedStylesSelect}
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
                <NoSSR>
                    <div className="editor">
                        {props.shouldSave.length != 0 && (<Loader type="ThreeDots" color="#2BAD60" height="100" width="100" />)}
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
    loadNotesPagi: loadNotesPagi,
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(WID)));
