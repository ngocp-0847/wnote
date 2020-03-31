import {UPDATE_LIST_NOTE,
    UPDATE_ITEM_LIST,
    FILL_NOTE_ACTIVE,
    CHANGE_STATUS_FOR_SAVE,
    UPDATE_EDITOR_STATE,
    SET_SEARCH,
    UNSET_SEARCH,
} from '../actions/noteAction';
import { findIndex } from 'lodash';
import update from 'immutability-helper';
import {EditorState} from 'draft-js';

const noteReducer = (state =
  {value: 0, notes: [], isSearch: true, textSearch: '', noteActive: {}, shouldSave: false, editorState: EditorState.createEmpty()}, action) => {
  console.log('noteReducer:', action.type)
  switch (action.type) {
    case UNSET_SEARCH:
      return {...state, isSearch: false, textSearch: ''};
    case SET_SEARCH:
      return {...state, isSearch: true, textSearch: action.payload};
    case UPDATE_LIST_NOTE:
      return {...state, notes: action.payload};
    case UPDATE_ITEM_LIST:
      var indexNoteActive = findIndex(state.notes, (note) => {
        return note._id == action.payload._id;
      });
      if (indexNoteActive != -1) {
        var newArrNotes = update(state.notes, {[indexNoteActive]: {$set: action.payload}})
        var noteActive = Object.assign({}, state.notes[indexNoteActive])
        return {...state, notes: newArrNotes, noteActive: noteActive};
      } else {
        newArrNotes = update(state.notes, {$unshift: [action.payload]})
        return {...state, notes: newArrNotes, noteActive: action.payload};
      }
    case FILL_NOTE_ACTIVE:
      var indexNoteActive = findIndex(state.notes, (note) => {
        return note._id == action.payload._id;
      });
      if (indexNoteActive != -1) {
          var newArrNotes = update(state.notes, {[indexNoteActive]: {$set: action.payload}})
          var noteActive = Object.assign({}, state.notes[indexNoteActive])
          return {...state, noteActive: noteActive};
      }
      return {...state, noteActive: action.payload};
    case UPDATE_EDITOR_STATE:
      return {...state, editorState: action.payload};
    case CHANGE_STATUS_FOR_SAVE:
        return {...state, shouldSave: action.payload};
    default:
        return {...state};
  }
};

export default noteReducer;
