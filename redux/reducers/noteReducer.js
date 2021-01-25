import { handleActions } from 'redux-actions';
import produce from 'immer';

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
    UPDATE_TAGS_SAVED,
    UPDATE_APPENT_NOTES,
} from '../actions/noteAction';
import { findIndex } from 'lodash';
import update from 'immutability-helper';

const noteReducer = handleActions({
    [UPDATE_APPENT_NOTES]: produce((state, { payload }) => {
        state.notes = state.notes.concat(payload.hits);
        state._scroll_id = payload._scroll_id;
    }),
    [UPDATE_ITEM_NOTE_PIN]: (state, action) => {
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
    },
    [UPDATE_TAGS_SAVED]: (state, action) => {
        let indexNoteHasTagSaved = _.findIndex(state.notes, (o) => {
            return o._id == action.payload.noteID;
        });

        let newNotes = update(state.notes, {[indexNoteHasTagSaved]: {_source: {tags: {$set: action.payload.tags}}}})
        let nNoteActive = update(state.noteActive, {_source: {tags: {$set: action.payload.tags}}})

        return {...state, noteActive: nNoteActive, notes: newNotes};
    },
    [SAVE_NOTE_PINNED]: (state, action) => {
        return {...state, notesPinned: action.payload};
    },
    [SAVE_USER_AUTH]: (state, action) => {
        return {...state, userAuth: action.payload};
    },
    [REMOVE_FROM_LIST]: (state, action) => {
        let indexNoteActive = findIndex(state.notes, (note) => {
            return note._id == action.payload;
        });
        if (indexNoteActive != -1) {
            let newNotes = update(state.notes, {$splice: [[indexNoteActive, 1]]});
            return {...state, notes: newNotes};
        }
        return {...state};
    },
    [UNSET_SEARCH]: (state, action) => {
        return {...state, isSearch: false, textSearch: ''};
    },
    [SET_SEARCH]: (state, action) => {
        return {...state, isSearch: true, textSearch: action.payload};
    },
    [UPDATE_LIST_NOTE]: (state, action) => {
        return {...state, notes: action.payload.hits, _scroll_id: action.payload._scroll_id};
    },
    [UPDATE_ITEM_LIST]: (state, action) => {
        if (action.payload.code == 200) {
            let indexNoteActive = findIndex(state.notes, (note) => {
                return note._id == action.payload.data._id;
            });
            console.log('UPDATE_ITEM_LIST:', action.payload, indexNoteActive)
            
            if (indexNoteActive != -1) {
                const oldItem = state.notes[indexNoteActive];
                const newItem = update(oldItem, {$merge: action.payload.data});

                let newArrNotes = update(state.notes, {$splice: [[indexNoteActive,1]]});
                newArrNotes = update(newArrNotes, {$unshift: [newItem]});
                
                return {...state, notes: newArrNotes};
            } else {
                let newArrNotes = update(state.notes, {$unshift: [action.payload.data]})
                return {...state, notes: newArrNotes};
            }
        }
    },
    [FILL_NOTE_ACTIVE]: (state, action) => {
        let indexNoteActive = findIndex(state.notes, (note) => {
            return note._id == action.payload._id;
        });
        if (indexNoteActive != -1) {
            var newArrNotes = update(state.notes, {[indexNoteActive]: {$set: action.payload}})
            var noteActive = Object.assign({}, state.notes[indexNoteActive])
            return {...state, noteActive: noteActive};
        }
        return {...state, noteActive: action.payload};
    },
    [UPDATE_EDITOR_STATE]: (state, action) => {
        return {...state, editorState: action.payload};
    },
    [CHANGE_STATUS_FOR_SAVE]: (state, action) => {
        if (!action.payload) {
            let shouldSave = update(state.shouldSave, {$push: [1]})
            return {...state, shouldSave: shouldSave};
        } else {
            if (state.shouldSave.length > 0) {
                let shouldSave = update(state.shouldSave, {$splice: [[0, 1]]});
                return {...state, shouldSave: shouldSave};
            } else {
                return {...state};
            }
        }
    },
}, {value: 0, notes: [], _scroll_id: null, notesPinned: [], isSearch: true, textSearch: '', noteActive: {},
shouldSave: [1], editorState: '', userAuth: null});

export default noteReducer;
