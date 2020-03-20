import {UPDATE_LIST_NOTE} from '../actions/noteAction';

const noteReducer = (state = {value: 0, notes: []}, action) => {
    switch (action.type) {
        case UPDATE_LIST_NOTE:
            return {...state, notes: action.notes};
        // case DECREMENT_COUNTER:
        //     return {...state, value: state.value - 1};
        default:
            return {...state};
    }
};

export default noteReducer;
