import {put, call, takeLatest, all, select, take} from 'redux-saga/effects';
import {
  startSaveNote,
  updateItemList,
  getDataFail,
  loadListNote,
  updateListNote,
  loadNoteLatest,
  fillNoteActive,
  changeStatusForSave,
  loadNoteById,
  updateEditorState,
  newEmptyNote,
  activeNoteSidebar,
  setSearch,
  unsetSearch,
  deleteNote,
  removeFromList,
  loadDefineIdentity,
  saveUserAuth,
} from './actions/noteAction';
import noteService from './services/noteService.js';
import authService from './services/authService.js';
import {EditorState, convertFromRaw} from 'draft-js';
import request from './requestHelper';
import Router from 'next/router';
import uuidv4 from 'uuid/v4';
import { isEmpty } from 'lodash';
import {createWithContent} from '../components/decorator';

import es6promise from 'es6-promise';
import 'isomorphic-unfetch';

es6promise.polyfill()

function* waitFor(selector) {
  if (yield select(selector)) return; // (1)

  while (true) {
    yield take('*'); // (1a)
    if (yield select(selector)) return; // (1b)
  }
}

function* fnSaveNote({payload}) {
  yield call(waitFor, state => state.note.shouldSave);
  const noteSaved = yield call([noteService, 'fnSaveNote'], payload[0], payload[1]);
  yield put(updateItemList(noteSaved));
}

function* fnLoadListNote({payload}) {
  try {
    var body = {
      userID: payload
    }
    const data = yield request('/api/note', {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *client
      body: JSON.stringify(body) // body data type must match "Content-Type" header
    });
    yield put(updateListNote(data.data));
  } catch (error) {
    yield put(getDataFail(error));
  }
}

function* fnLoadDefineIdentity() {
    // if user authen github
    const resAuth = yield authService.fnAuthInfo();
    if (resAuth.code == 200) {
        console.log('fnLoadDefineIdentity:', resAuth.data);
        if (resAuth.data == false) {
            yield call(Router.push, `/w/login`);
            return false;
        } else {
            yield put(saveUserAuth(resAuth.data));
            localStorage.setItem('userID', resAuth.data._source.userGeneId);
            return resAuth.data;
        }
    }
}

function* fnLoadNoteLastest(action) {
    const userAuth = yield fnLoadDefineIdentity();
    console.log('fnLoadNoteLastest:userAuth:', userAuth, action.payload);
    if (userAuth == false) {
        action.payload.push('/api/auth/github');
    }
    let noteID = uuidv4();
    yield put(changeStatusForSave(true));

    var body = {
        userID: userAuth.userGeneId,
    }
    const data = yield request('/api/note/latest', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *client
        body: JSON.stringify(body) // body data type must match "Content-Type" header
    });
    console.log('fnLoadNoteLastest:request:', data)
    if (data.code == 200) {
        let rawdata = data.data;
        var hits = rawdata.noteLatest.body.hits.hits;
        if (hits.length != 0) {
        noteID = hits[0]._id
        yield put(fillNoteActive(hits[0]));
        const responseRouter = yield call(Router.push, `/w/[id]`, `/w/${noteID}`, {shallow:true});
        yield put(changeStatusForSave(true));
        } else {
        const responseRouter = yield call(Router.push, `/w/[id]`, `/w/${noteID}`, {shallow:true});
        yield put(changeStatusForSave(true));
        }
    }
}

function* fnNewEmptyNote() {
  var noteID = uuidv4();
  console.log('fnNewEmptyNote:', noteID)
  yield put(changeStatusForSave(false)); //cancel save editor.
  const responseRouter = yield call(Router.push, `/w/[id]`, `/w/${noteID}`, {shallow:true});
  var editorState = EditorState.createEmpty();
  yield put(updateEditorState(editorState));
  var body = {
    'content': '',
    'rawTextSearch': '',
    'shortContent': {shortText: null, shortImage: null},
    'userID': localStorage.getItem('userID'),
    'createdAt': new Date().getTime(),
    'updatedAt': new Date().getTime(),
    'deletedAt': null,
  };

  const noteSaved = yield call([noteService, 'fnSaveNote'], noteID, body);

  yield put(updateItemList(noteSaved));
  yield put(changeStatusForSave(true)); //cancel save editor.
}

function* fnLoadNoteById({ payload }) {
  var userID = localStorage.getItem('userID');
  const data = yield request('/api/note/'+payload.noteID+'?userID='+userID, {
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *client
  });

  if (data.total > 0) {
    yield put(fillNoteActive(data.hits[0]));
    try {
      const state = convertFromRaw(JSON.parse(data.hits[0]._source.content));
      var editorState = createWithContent(state);
      yield put(updateEditorState(editorState));
    } catch(e) {
      console.log('fnLoadNoteById:catch:', e);
      var editorState = EditorState.createEmpty();
      yield put(updateEditorState(editorState));
    }
  }

  yield put(changeStatusForSave(true));
}

function* fnActiveNoteSidebar({ payload }) {
  console.log('fnActiveNoteSidebar', payload)
  yield put(changeStatusForSave(false)); //cancel save editor.
  const responseRouter = yield call(Router.push, `/w/[id]`, `/w/${payload._id}`, {shallow:true});
  yield* fnLoadNoteById({payload: {noteID: payload._id}})
}

function* fnSearch({ payload }) {
  console.log('fnSearch', payload)
  let body = {
    userID: localStorage.getItem('userID'),
    text: payload,
  }
  const results = yield call([noteService, 'fnSearch'], body);
  console.log('fnSearch:call', results)
  yield put(updateListNote(results.hits));
  let noteLastest = !isEmpty(results.hits) ? results.hits[0] : null;
  console.log('fnSearch:noteLastest:', noteLastest);
  if (noteLastest) {
    yield* fnActiveNoteSidebar({payload: {_id: noteLastest._id}});
  }
}

function* fnUnSearch() {
  console.log('fnUnSearch');
  var userID = localStorage.getItem('userID');
  yield* fnLoadListNote({payload: userID});
}

function* fnDeleteNote({ payload }) {
  console.log('fnDeleteNote:',payload);
  let userID = localStorage.getItem('userID');
  let body = {
    userID: localStorage.getItem('userID'),
    noteID: payload,
  }
  const results = yield call([noteService, 'deleteNote'], body);
  console.log('fnDeleteNote:results:', results);
  if (results.code == 200) {
    yield put(removeFromList(results.data.body._id));
    const noteLatestState = yield select((state) => {
      if (state.note.notes.length > 0) return state.note.notes[0];
      return null;
    });
    console.log('fnDeleteNote:noteLatestState:', noteLatestState);
    if (noteLatestState) {
      yield* fnLoadNoteById({payload: {noteID: noteLatestState._id}});
    }
  }
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* rootSaga() {
  console.log('rootSaga', startSaveNote().type)
  yield all([
    takeLatest(loadDefineIdentity().type, fnLoadDefineIdentity),
    takeLatest(startSaveNote().type, fnSaveNote),
    takeLatest(loadListNote().type, fnLoadListNote),
    takeLatest(loadNoteLatest().type, fnLoadNoteLastest),
    takeLatest(loadNoteById().type, fnLoadNoteById),
    takeLatest(newEmptyNote().type, fnNewEmptyNote),
    takeLatest(activeNoteSidebar().type, fnActiveNoteSidebar),
    takeLatest(setSearch().type, fnSearch),
    takeLatest(unsetSearch().type, fnUnSearch),
    takeLatest(deleteNote().type, fnDeleteNote),
  ])
}
