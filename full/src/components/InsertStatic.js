import React from "react";

const InsertStatic = props => {
  const isIndexZero = props.index == 0;
  return (
    <div className="">
      <label className={`btn btn-${isIndexZero ? "primary" : "danger"}`}>
        {isIndexZero
          ? [
              'Add',
              <input type="file" hidden={true} onChange={props.handleUpload} />
            ]
          : [
              'Remove',
              <input type="file" hidden={true} onClick={(e) => {
                e.preventDefault()
                props.handleRemove(props.item.path)
              }} />
            ]}
      </label>
      <br />
      {props.item.name} <br />
      {props.item.path}
      {isIndexZero ? "":[<br />, <br />]}
    </div>
  );
};

export default InsertStatic;
