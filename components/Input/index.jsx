import React, {useMemo} from 'react';
import Input from '@material-ui/core/Input';

const TInput = ({name, label, styles, ...rest}) => {
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
        <Input
            name={name}
            label={label}
            style={mergedStyles}
            {...rest}
        />
    )
};

export default TInput;
