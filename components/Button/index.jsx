import React, {useMemo} from 'react';
import Button from '@material-ui/core/Button';

const TButton = ({name, label, styles, ...rest}) => {
    const defaultStyle = {
        marginRight: '10px',
        height: '36px',
    };

    const mergedStyles = useMemo(
        () => ({
            ...defaultStyle,
            ...styles,
        }),
    );
    return (
        <Button
            name={name}
            style={mergedStyles}
            {...rest}
        >{label}</Button>
    )
};

export default TButton;
