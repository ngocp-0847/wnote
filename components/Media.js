import {Entity} from 'draft-js';
import Image from './Image';

const Media = (props) => {
    const entity = Entity.get(props.block.getEntityAt(0));
    const {src} = entity.getData();
    const type = entity.getType();
    let media;
    if (type === 'image') {
        media = <Image src={src} {...props} />;
    }

    return media;
};

export default Media;