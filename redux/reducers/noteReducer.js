import {UPDATE_LIST_NOTE,
    UPDATE_ITEM_LIST,
    FILL_NOTE_ACTIVE,
    CHANGE_STATUS_FOR_SAVE,
    UPDATE_EDITOR_STATE,
    SET_SEARCH,
    UNSET_SEARCH,
    REMOVE_FROM_LIST,
    SAVE_USER_AUTH,
    SAVE_NOTE_PINNED,
    UPDATE_ITEM_NOTE_PIN,
    UPDATE_TAGS_SAVED
} from '../actions/noteAction';
import { findIndex } from 'lodash';
import update from 'immutability-helper';

const noteReducer = (state =
  {value: 0, notes: [], notesPinned: [], isSearch: true, textSearch: '', noteActive: {},
    shouldSave: [1], editorState: [
      {
        children: [{ text: '' }],
      },
    ], userAuth: null}, action) => {
    
    let indexNoteActive;

    switch (action.type) {
        case UPDATE_ITEM_NOTE_PIN:
            if (action.payload.action) {
                let notePin = _.find(state.notes, (o) => {
                    return o._id == action.payload.noteID;
                });
                let notesPinned = update(state.notesPinned, {$push: [notePin]})
                return {...state, notesPinned: notesPinned};  
            } else {
                let notesPinned = _.filter(state.notesPinned, (o) => {
                    return o._id != action.payload.noteID;
                });
                return {...state, notesPinned: notesPinned};
            }
        case UPDATE_TAGS_SAVED:
            console.log('UPDATE_TAGS_SAVED:', action.payload)
            let indexNoteHasTagSaved = _.findIndex(state.notes, (o) => {
                return o._id == action.payload.noteID;
            });

            let newNotes = update(state.notes, {[indexNoteHasTagSaved]: {_source: {tags: {$set: action.payload.tags}}}})
            let nNoteActive = update(state.noteActive, {_source: {tags: {$set: action.payload.tags}}})

            return {...state, noteActive: nNoteActive, notes: newNotes};
        case SAVE_NOTE_PINNED:
            return {...state, notesPinned: action.payload};
        case SAVE_USER_AUTH:
            console.log('noteReducer:SAVE_USER_AUTH:', action.payload);
            return {...state, userAuth: action.payload};
        case REMOVE_FROM_LIST:
            indexNoteActive = findIndex(state.notes, (note) => {
                return note._id == action.payload;
            });
            if (indexNoteActive != -1) {
                let newNotes = update(state.notes, {$splice: [[indexNoteActive, 1]]});
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
            if (action.payload.code == 200) {
                indexNoteActive = findIndex(state.notes, (note) => {
                    return note._id == action.payload.data._id;
                });
                
                console.log('UPDATE_ITEM_LIST:', action.payload, indexNoteActive)
                
                if (indexNoteActive != -1) {
                    const oldItem = state.notes[indexNoteActive];
                    const newItem = update(oldItem, {$merge: action.payload.data});
    
                    let newArrNotes = update(state.notes, {$splice: [[indexNoteActive,1]]});
                    newArrNotes = update(newArrNotes, {$unshift: [newItem]});
                    let noteActive = Object.assign({}, state.notes[indexNoteActive]);
                    return {...state, notes: newArrNotes, noteActive: noteActive};
                } else {
                    newArrNotes = update(state.notes, {$unshift: [action.payload.data]})
                    return {...state, notes: newArrNotes, noteActive: action.payload.data};
                }
            }
            break;
        case FILL_NOTE_ACTIVE:
            indexNoteActive = findIndex(state.notes, (note) => {
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
            console.log('reducer:saveStatus:', action.payload);
            if (!action.payload) {
                let shouldSave = update(state.shouldSave, {$push: [1]})
                return {...state, shouldSave: shouldSave};
            } else {
                if (state.shouldSave.length > 0) {
                let shouldSave = update(state.shouldSave, {$splice: [[0, 1]]});
                return {...state, shouldSave: shouldSave};
                }
            }
        default:
            return {...state};
  }
};

export default noteReducer;
