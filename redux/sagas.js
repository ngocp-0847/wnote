import {put, call, takeLatest, takeEvery, all, select, take} from 'redux-saga/effects';
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
  initDetailnote,
  saveNotePinned,
  pinNote,
  updateItemNotePin,
  saveTags,
  updateTagsSaved
} from './actions/noteAction';
import noteService from './services/noteService.js';
import authService from './services/authService.js';
import Router from 'next/router';
import uuidv4 from 'uuid/v4';
import { isEmpty } from 'lodash';

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

function* fnPinNote({payload}) {
    console.log('fnPinNote:', payload);
    yield call([noteService, 'fnPinNote'], payload.noteID, payload.action);
    yield put(updateItemNotePin(payload));
}

function* fnLoadListNote({payload}) {
  try {
    console.log('fnLoadListNote:', payload)
    const data = yield noteService.fnLoadListNote(payload);
    yield put(updateListNote(data.data));
  } catch (error) {
    yield put(getDataFail(error));
  }
}

function* fnLoadListNotePinned() {
    try {
        console.log('fnLoadListNotePinned:')
        const res = yield noteService.fnLoadListNotePinned();
        console.log('fnLoadListNotePinned:save', res)
        if (res.data.notesPinned) {
            yield put(saveNotePinned(res.data.notesPinned.body.hits.hits));
        }
    } catch (error) {
        yield put(getDataFail(error));
    }
}

function* fnInitDetailnote({payload}) {
    let userAuth = yield fnLoadDefineIdentity();
    yield fnLoadListNotePinned();
    console.log('fnInitDetailnote:', payload, userAuth);
    if (userAuth) {
        yield fnLoadListNote({payload: userAuth._source.userGeneId});
        yield fnLoadNoteById({payload: {noteID: payload.noteID}})
    }
    yield put(changeStatusForSave(true));
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
    if (userAuth == false) {
        yield call(Router.push, `/w/login`);
        return false;
    }
    let noteID = uuidv4();
    yield put(changeStatusForSave(false));
    const data = yield noteService.fnLoadNoteLastest(userAuth.userGeneId)
    console.log('fnLoadNoteLastest:', data)
    if (data.code == 200) {
        let rawdata = data.data;
        var hits = rawdata.noteLatest.body.hits.hits;
        if (hits.length != 0) {
            noteID = hits[0]._id
            // yield put(fillNoteActive(hits[0]));
            yield call(Router.push, `/w/[id]`, `/w/${noteID}`, {shallow:true});
        } else {
            yield call(Router.push, `/w/[id]`, `/w/${noteID}`, {shallow:true});
        }
    } else {
        yield fnNewEmptyNote();
    }
    yield put(changeStatusForSave(true));
}

function* fnNewEmptyNote() {
    var noteID = uuidv4();
    console.log('fnNewEmptyNote:', noteID)
    yield put(changeStatusForSave(false)); //cancel save editor.
    yield call(Router.push, `/w/[id]`, `/w/${noteID}`, {shallow:true});
    var editorState = [{
        type: 'paragraph',
        children: [{ text: '' }],
    }];

  yield put(updateEditorState(editorState));
  var body = {
    'content': JSON.stringify(editorState),
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
  console.log('fnLoadNoteById:', payload)
  yield put(changeStatusForSave(false)); //cancel save editor.
  const response = yield noteService.fnLoadNoteByID(payload.noteID);
  let data = [];
  if (response.code == 200) {
    data = response.data
  }
  
  if ((data.total.value && data.total.value > 0) || data.total > 0) {
    yield put(fillNoteActive(data.hits[0]));
    try {
      // console.log('fnLoadNoteById:beforeClearContent:');
      console.log('fnLoadNoteById:beforeSetContent:');
      yield put(updateEditorState(JSON.parse(data.hits[0]._source.content)));
    } catch(e) {
      console.log('fnLoadNoteById:catch:', e);
      yield put(updateEditorState(''));
    }
  }
  yield put(changeStatusForSave(true));
}

function* fnActiveNoteSidebar({ payload }) {
  console.log('fnActiveNoteSidebar', payload)
  yield put(changeStatusForSave(false)); //cancel save editor.
//   yield put(updateEditorState(''));
  yield call(Router.push, `/w/[id]`, `/w/${payload._id}`, {shallow:true});
  yield fnLoadNoteById({payload: {noteID: payload._id}})
  yield put(changeStatusForSave(true));
}

function* fnSearch({ payload }) {
  console.log('fnSearch', payload)
  let body = {
    userID: localStorage.getItem('userID'),
    text: payload,
  }
  yield put(changeStatusForSave(false));
  const results = yield call([noteService, 'fnSearch'], body);
  yield put(changeStatusForSave(true));

  console.log('fnSearch:call', results)
  yield put(updateListNote(results.data.hits));
  let noteLastest = !isEmpty(results.data.hits) ? results.data.hits[0] : null;
  console.log('fnSearch:noteLastest:', noteLastest);
  if (noteLastest) {
    yield fnActiveNoteSidebar({payload: {_id: noteLastest._id}});
  }
}

function* fnUnSearch() {
  console.log('fnUnSearch');
  var userID = localStorage.getItem('userID');
  yield* fnLoadListNote({payload: userID});
}

function* fnSaveTags({payload}) {
  console.log('fnSaveTags', payload);
  yield call(waitFor, state => state.note.shouldSave);
  const tagsSaved = yield call([noteService, 'fnSaveTags'], payload[0], payload[1]);
  yield put(updateTagsSaved({noteID: payload[0], tags: payload[1]['tags']}));
}

function* fnDeleteNote({ payload }) {
  console.log('fnDeleteNote:', payload);
  yield put(changeStatusForSave(false));
  let body = {
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
  yield put(changeStatusForSave(true));
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* rootSaga(context) {
  console.log('rootSaga', context)
  yield all([
    takeLatest(initDetailnote().type, fnInitDetailnote),
    takeLatest(loadDefineIdentity().type, fnLoadDefineIdentity),
    takeLatest(startSaveNote().type, fnSaveNote),
    takeLatest(loadListNote().type, fnLoadListNote),
    takeLatest(loadNoteLatest().type, fnLoadNoteLastest),
    takeLatest(loadNoteById().type, fnLoadNoteById),
    takeLatest(newEmptyNote().type, fnNewEmptyNote),
    takeLatest(activeNoteSidebar().type, fnActiveNoteSidebar),
    takeEvery(setSearch().type, fnSearch),
    takeLatest(unsetSearch().type, fnUnSearch),
    takeLatest(deleteNote().type, fnDeleteNote),
    takeLatest(pinNote().type, fnPinNote),
    takeLatest(saveTags().type, fnSaveTags),
  ])
}
