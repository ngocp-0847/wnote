import Image from './Image';

const Atomic = (props) => {
    const {contentState} = props;
    const entity = contentState.getEntity(props.block.getEntityAt(0));
    const {src} = entity.getData();
    const type = entity.getType();
    let media = <Image src='' {...props} />;
    if (type === 'image') {
        media = <Image src={src} {...props} />;
    }

    return media;
};

export default Atomic;
