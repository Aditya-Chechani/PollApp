const Checkbox = (props) => {
    return (
        <div className="form-check">
            <input
                type="checkbox"
                className="form-check-input"
                id={props.name}
                name={props.name}
                onChange={props.onChange}
                autoComplete={props.autoComplete}
                value={props.value}
                checked={props.checked}
            />
            <label htmlFor={props.name} className="form-check-label">{props.title}</label>
        </div>
    );
};

export default Checkbox;