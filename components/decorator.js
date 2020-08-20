import {EditorState, ContentState, CompositeDecorator, Modifier} from '../draft-js/lib/Draft';

const { Record } = require('immutable');

function findImageEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'IMAGE'
      );
    },
    callback
  );
}

export const Image = (props) => {
  let {contentState, block, blockKey, start, end, entityKey} = props;

  console.log('Image:decorator:', props);
  if (block) {
    entityKey = block.getEntityAt(0);
    blockKey = block.getKey();
    if (block.getType() == 'atomic') {
      start = 0;
      end = block.getLength();
    }
  } else {
    entityKey = props.entityKey;
  }

  const handleDragStart = (event) => {
    console.log('Image:handleDragStart:', event.dataTransfer);
    event.dataTransfer.setData('blockKey', blockKey);
    event.dataTransfer.setData('start', start);
    event.dataTransfer.setData('end', end);
    event.dataTransfer.setData('entityKey', entityKey);
  }

  let content = (<img />);
  console.log('Image:entityKey', entityKey)
  if (entityKey) {
    const entity = contentState.getEntity(entityKey);
    console.log('Image:entity', entity, entity.getData())
    let {height, src, width, style} = entity.getData();
    const type = entity.getType();
    if (!style) {
      style = {maxWidth: '100%'};
    } else {
      style = Object.assign(style, {maxWidth: '100%'});
    }
    content = (<img src={src} height={height} width={width} style={style} />);
  }

  return (
    <span data-text={true} className="entity-img" data-offset-key={props.offsetKey} draggable onDragStart={handleDragStart}>
      {content}
    </span>
  );
};

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();

      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'LINK'
      )
    },
    callback
  )
}

const Link = (props) => {
  let {url, style} = props.contentState.getEntity(props.entityKey).getData();
  if (!style) {
    style = {cursor: 'pointer'};
  } else {
    style = Object.assign(style, {cursor: 'pointer'});
  }
  return (
    <a href={url} style={style}>{props.children}</a>
  )
}

const decorator = new CompositeDecorator([
  {
    strategy: findImageEntities,
    component: Image,
  },
  {
    strategy: findLinkEntities,
    component: Link
  }
]);

export function createWithContent(contentState) {
  return EditorState.createWithContent(contentState, decorator);
}

export function appendBlocks(editorState, mixBlocks, entityMap) {
  const selection = editorState.getSelection();
  let currentContentState = editorState.getCurrentContent();

  const contentState = ContentState.createFromBlockArray(
      mixBlocks,
      entityMap,
    );
  console.log('appendBlocks:', contentState.getBlockMap().toJS(), entityMap.all());
  for (let [key, value] of Object.entries(entityMap.all())) {
    currentContentState = currentContentState.addEntity(entityMap.get(key));
  }

  currentContentState = Modifier.replaceWithFragment(currentContentState, selection, contentState.getBlockMap());
  let newEditorState = EditorState.push(editorState, currentContentState, 'insert-fragment');
  console.log('appendBlocks:newEditorState:', currentContentState.getBlockMap().toJS());
  newEditorState = EditorState.set(newEditorState, {decorator: decorator});
  newEditorState = EditorState.forceSelection(newEditorState, currentContentState.getSelectionAfter());
  return newEditorState;
}
