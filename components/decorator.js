import { EditorState, CompositeDecorator, ContentState, Modifier } from 'draft-js';

function findImageEntities(contentBlock, callback, contentState) {
  // console.log('findImageEntities:', contentState, contentBlock, callback);
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

  if (entityKey) {
    const entity = contentState.getEntity(entityKey);
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
    <span className="entity-img" data-offset-key={props.offsetKey} draggable onDragStart={handleDragStart}>
      {content}
    </span>
  );
};

const decorator = new CompositeDecorator([
  {
    strategy: findImageEntities,
    component: Image,
  },
]);

export function createWithContent(contentState) {
  return EditorState.createWithContent(contentState, decorator);
}

export function appendBlocks(editorState, contentBlocks, entityMap) {
  const selection = editorState.getSelection();
  let currentContentState = editorState.getCurrentContent();
  const currentBlock = currentContentState.getBlockForKey(selection.getEndKey());
  const contentState = ContentState.createFromBlockArray(
    contentBlocks,
    entityMap,
  );
  console.log('appendBlocks:', currentContentState, contentBlocks, contentState.getBlockMap().toJS());
  currentContentState = Modifier.replaceWithFragment(currentContentState, selection, contentState.getBlockMap());
  let newEditorState = EditorState.push(editorState, currentContentState, 'insert-fragment');
  console.log('appendBlocks:newEditorState:', currentContentState.getBlockMap().toJS());
  newEditorState = EditorState.set(newEditorState, {decorator: decorator});
  newEditorState = EditorState.forceSelection(newEditorState, currentContentState.getSelectionAfter());
  return newEditorState;
}
