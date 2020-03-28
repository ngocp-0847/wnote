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
  activeNoteSidebar
} from './actions/noteAction';
import noteService from './services/noteService.js'
import {EditorState, convertFromRaw} from 'draft-js';
import request from './requestHelper';
import Router from 'next/router';
import uuidv4 from 'uuid/v4';

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
  console.log('fnSaveNote start:', payload)
  const noteSaved = yield call([noteService, 'fnSaveNote'], payload[0], payload[1]);
  console.log('fnSaveNote after saved:', noteSaved)
  yield put(updateItemList(noteSaved));
}

function* fnLoadListNote({ payload }) {
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

function* fnLoadNoteLastest() {
  console.log('fnLoadNoteLastest:', userID)
  var userID = localStorage.getItem('userID');
  var noteID = uuidv4()
  if (userID == null) {
    userID = uuidv4()
    localStorage.setItem('userID', userID)
    const responseRouter = yield call(Router.push, `/w/[id]`, `/w/${noteID}`, {shallow:true});
    yield put(changeStatusForSave(true));
  } else {
    var body = {
      userID: localStorage.getItem('userID'),
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

    var hits = data.hits;
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
    'shortContent': {shortText: null, shortImage: null},
    'userID': localStorage.getItem('userID'),
    'createdAt': new Date().getTime(),
    'updatedAt': new Date().getTime(),
  };

  const noteSaved = yield call([noteService, 'fnSaveNote'], noteID, body);

  yield put(updateItemList(noteSaved));
  yield put(changeStatusForSave(true)); //cancel save editor.
}

function* fnLoadNoteById({ payload }) {
  const data = yield request('/api/note/'+payload.noteID, {
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
    const state = convertFromRaw(JSON.parse(data.hits[0]._source.content));
    var editorState = EditorState.createWithContent(state);
    yield put(updateEditorState(editorState));
  }

  yield put(changeStatusForSave(true));
}

function* fnActiveNoteSidebar({ payload }) {
  console.log('fnActiveNoteSidebar', payload)
  yield put(changeStatusForSave(false)); //cancel save editor.
  const responseRouter = yield call(Router.push, `/w/[id]`, `/w/${payload._id}`, {shallow:true});
  yield* fnLoadNoteById({payload: {noteID: payload._id}})
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* rootSaga() {
  console.log('rootSaga', startSaveNote().type)
  yield all([
    takeLatest(startSaveNote().type, fnSaveNote),
    takeLatest(loadListNote().type, fnLoadListNote),
    takeLatest(loadNoteLatest().type, fnLoadNoteLastest),
    takeLatest(loadNoteById().type, fnLoadNoteById),
    takeLatest(newEmptyNote().type, fnNewEmptyNote),
    takeLatest(activeNoteSidebar().type, fnActiveNoteSidebar),
  ])
}
