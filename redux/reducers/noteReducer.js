import {UPDATE_LIST_NOTE,
    UPDATE_ITEM_LIST,
    FILL_NOTE_ACTIVE,
    CHANGE_STATUS_FOR_SAVE,
    UPDATE_EDITOR_STATE,
    SET_SEARCH,
    UNSET_SEARCH,
    REMOVE_FROM_LIST,
} from '../actions/noteAction';
import { findIndex } from 'lodash';
import update from 'immutability-helper';
import {EditorState} from 'draft-js';

const noteReducer = (state =
  {value: 0, notes: [], isSearch: true, textSearch: '', noteActive: {}, shouldSave: false, editorState: EditorState.createEmpty()}, action) => {
  console.log('noteReducer:', action.type)
  switch (action.type) {
    case REMOVE_FROM_LIST:
      var indexNoteActive = findIndex(state.notes, (note) => {
        return note._id == action.payload;
      });
      if (indexNoteActive != -1) {
        var newNotes = update(state.notes, {$splice: [[indexNoteActive, 1]]});
        return {...state, notes: newNotes};
      }
      return {...state};
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
        const oldItem = state.notes[indexNoteActive];
        const newItem = update(oldItem, {$merge: action.payload});
        let newArrNotes = update(state.notes, {$splice: [[indexNoteActive,1]]});
        newArrNotes = update(newArrNotes, {$unshift: [newItem]});
        let noteActive = Object.assign({}, state.notes[indexNoteActive]);
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
