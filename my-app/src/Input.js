import { forwardRef } from "react";

const Input = forwardRef((props, ref) => {
    return (
        <div className="mb-3">
            <label className="form-label" htmlFor={props.name}>{props.title}</label>
            <input 
                type={props.type} 
                className={props.className} 
                id={props.name} 
                name={props.name} 
                autoComplete={props.autoComplete} 
                onChange={props.onChange} 
                ref={ref}
            />
        </div>
    );
});



export default Input;
