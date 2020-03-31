import Image from './Image';

const Atomic = (props) => {
    const {contentState} = props;
    const entityKey = props.block.getEntityAt(0);
    let media = <Image src='' {...props} />;

    if (entityKey) {
        const entity = contentState.getEntity(entityKey);
        const {src} = entity.getData();
        const type = entity.getType();

        if (type === 'image') {
            media = <Image src={src} {...props} />;
        }
    }

    return media;
};

export default Atomic;
