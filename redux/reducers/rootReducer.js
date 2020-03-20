import noteReducer from './noteReducer';
import {combineReducers} from 'redux';

const rootReducer = combineReducers({
    note: noteReducer
});

export default rootReducer;
