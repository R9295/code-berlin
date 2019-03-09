import React from 'react';
import SimpleMDE from "react-simplemde-editor";

const FormField = props => {
  return (
    <div
      className={
        props.field.type == "textarea"
          ? "col-lg-8 col-sm-12 col-md-8"
          : "col-8"
      }
    >
      <div className="form-group form-div">
        <label for={props.field.name} align="left">
          {props.field.name.charAt(0).toUpperCase() + props.field.name.substr(1)}
        </label>
        {props.field.type == "textarea" ? (
          <SimpleMDE
            onChange={val =>
              props.handleFieldChange({
                target: {
                  id: props.field.name,
                  value: val
                }
              })
            }
            id={props.field.name}
            value={props.value}
          />
        ) : (
          <input
            type={props.field.type}
            className="form-control"
            id={props.field.name}
            value={props.value}
            disabled={props.field.disabled}
            onChange={props.handleFieldChange}
            aria-describedby={props.field.name + "Help"}
            placeholder=""
          />
        )}
        <small
          id={props.field.name + "Help"}
          className="form-text text-muted"
        >
          {props.field.help}
        </small>
      </div>
    </div>

  )
}

export default FormField
