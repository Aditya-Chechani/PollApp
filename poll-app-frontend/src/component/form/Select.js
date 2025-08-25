const Select = (props) => {
    return (
        <div className="mb-3">
            <label htmlFor={props.name} className="form-label">{props.title}</label>
            <select
                className="form-select"
                id={props.name}
                name={props.name}
                onChange={props.onChange}
                value={props.value}
                autoComplete={props.autoComplete}
            >
                {props.options.map((option) => (
                    <option key={option.id} value={option.id}>{option.value}</option>
                ))}
            </select>
            <div className={props.errorDiv}>
                {props.errorMessage}
            </div>
        </div>
    );
};

export default Select;