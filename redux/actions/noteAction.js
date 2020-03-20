//Action Types
export const UPDATE_LIST_NOTE = "UPDATE_LIST_NOTE";


//Action Creator
export const updateListNote = (notes) => {
    console.log('vao 2', notes)
    return {
        type: UPDATE_LIST_NOTE,
        notes: notes,
    }
};
