//Action Types
import {createSideEffectActions, createAction} from 'redux-actions';

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
export const SET_SEARCH = 'SET_SEARCH';
export const UNSET_SEARCH = 'UNSET_SEARCH';
export const DELETE_NOTE = 'DELETE_NOTE';
export const REMOVE_FROM_LIST = 'REMOVE_FROM_LIST';
export const LOAD_DEFINE_IDENTITY = 'LOAD_DEFINE_IDENTITY';
export const SAVE_USER_AUTH = 'SAVE_USER_AUTH';
export const INIT_DETAIL_NOTE = 'INIT_DETAIL_NOTE';
export const SAVE_NOTE_PINNED = 'SAVE_NOTE_PINNED';
export const PIN_NOTE = 'PIN_NOTE';
export const UPDATE_ITEM_NOTE_PIN = 'UPDATE_ITEM_NOTE_PIN';
export const SAVE_TAGS = 'SAVE_TAGS';
export const UPDATE_TAGS_SAVED = 'UPDATE_TAGS_SAVED';
export const LOAD_NOTES_PAGI = 'LOAD_NOTES_PAGI';
export const UPDATE_APPENT_NOTES = 'UPDATE_APPENT_NOTES';

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
  updateTagsSaved,
  loadNotesPagi,
  updateAppentNotes,
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
  createAction(SET_SEARCH),
  createAction(UNSET_SEARCH),
  createAction(DELETE_NOTE),
  createAction(REMOVE_FROM_LIST),
  createAction(LOAD_DEFINE_IDENTITY),
  createAction(SAVE_USER_AUTH),
  createAction(INIT_DETAIL_NOTE),
  createAction(SAVE_NOTE_PINNED),
  createAction(PIN_NOTE),
  createAction(UPDATE_ITEM_NOTE_PIN),
  createAction(SAVE_TAGS),
  createAction(UPDATE_TAGS_SAVED),
  createAction(LOAD_NOTES_PAGI),
  createAction(UPDATE_APPENT_NOTES),
];

