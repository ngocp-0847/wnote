import AsyncCreatableSelect from 'react-select/async-creatable';

const customStyles = {
    menu: (provided, state) => ({
        ...provided,
        width: state.selectProps.width,
        // borderBottom: '1px dotted pink',
        color: state.selectProps.menuColor,
        // padding: 10,
    }),
    control: (provided) => ({
        ...provided,
        width: 200,
        backgroundColor: '#edf2f7',
        borderTop: 'none',
        borderRight: 'none',
        borderLeft: 'none',
        borderRadius: 'none',
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        backgroundColor: '#64ea86',
    }),
    container: style => ({
        ...style,
    }),
}
  
  
  