import { EditorState, AtomicBlockUtils } from 'draft-js';
import axios from 'axios';
import * as EntityType from '../constants/entity';

const imageURLKeyMap = {};

export const addImage = (editorState, url, extraData) => {
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity(
    EntityType.IMAGE,
    'IMMUTABLE',
    { ...extraData, src: url }
  );
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  imageURLKeyMap[url] = entityKey;
  const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
  return newEditorState;
};

export const updateImage = (editorState, toMergeData, localURL) => {
  const contentState = editorState.getCurrentContent();
  const entityKey = imageURLKeyMap[localURL];
  const nextContentState = contentState.mergeEntityData(entityKey, toMergeData);
  delete imageURLKeyMap[localURL];
  return EditorState.push(editorState, nextContentState);
};

export const uploadImage = (url, file, config = {}) => {
  const data = new FormData();
  data.append('file', file);
  return axios
    .post(url, data, config)
    .then(res => {
      return res;
    })
    .catch(console.error);
};

// here is the paste method
export const pasteAndUploadImage = (event, onload) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  for (let item of items) {
    if (item.kind === 'file' && item.type.includes('image/')) {
      const blob = item.getAsFile();
      const reader = new FileReader();
      reader.onload = e => onload(blob, e);
      reader.readAsDataURL(blob);
    }
  }
};