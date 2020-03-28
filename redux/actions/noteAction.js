//Action Types
import {createAction} from 'redux-actions';

export const LOAD_LIST_NOTE = 'LOAD_LIST_NOTE';
export const UPDATE_LIST_NOTE = 'UPDATE_LIST_NOTE';
export const UPDATE_NOTE_SAVE = 'UPDATE_NOTE_SAVE';
export const FILL_NOTE_ACTIVE = 'FILL_NOTE_ACTIVE';
export const START_SAVE_NOTE = 'START_SAVE_NOTE';
export const GET_DATA_FAIL = 'GET_DATA_FAIL';
export const UPDATE_ITEM_LIST = 'UPDATE_ITEM_LIST';
export const LOAD_NOTE_LATEST = 'LOAD_NOTE_LATEST';
export const CHANGE_STATUS_FOR_SAVE = 'CHANGE_STATUS_FOR_SAVE';
export const ROUTE_CHANGE_COMPLETE = 'ROUTE_CHANGE_COMPLETE';
export const LOAD_NOTE_BY_ID = 'LOAD_NOTE_BY_ID';
export const UPDATE_EDITOR_STATE = 'UPDATE_EDITOR_STATE';
export const NEW_EMPTY_NOTE = 'NEW_EMPTY_NOTE';
export const ACTIVE_NOTE_SIDEBAR = 'ACTIVE_NOTE_SIDEBAR';

export const [
  loadListNote,
  updateListNote,
  updateNoteSave,
  fillNoteActive,
  startSaveNote,
  getDataFail,
  updateItemList,
  loadNoteLatest,
  changeStatusForSave,
  routeChangeComplete,
  loadNoteById,
  updateEditorState,
  newEmptyNote,
  activeNoteSidebar,
  ] = [
  createAction(LOAD_LIST_NOTE),
  createAction(UPDATE_LIST_NOTE),
  createAction(UPDATE_NOTE_SAVE),
  createAction(FILL_NOTE_ACTIVE),
  createAction(START_SAVE_NOTE),
  createAction(GET_DATA_FAIL),
  createAction(UPDATE_ITEM_LIST),
  createAction(LOAD_NOTE_LATEST),
  createAction(CHANGE_STATUS_FOR_SAVE),
  createAction(ROUTE_CHANGE_COMPLETE),
  createAction(LOAD_NOTE_BY_ID),
  createAction(UPDATE_EDITOR_STATE),
  createAction(NEW_EMPTY_NOTE),
  createAction(ACTIVE_NOTE_SIDEBAR),
];

