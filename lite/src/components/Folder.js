import React from 'react';

const Folder = props => {
  return (
    <li
      className={`
    list-group-item d-flex justify-content-between align-items-center`}
      onClick={() => props.expandDir(props.item._id)}
    >
      <h5>{props.item.title.charAt(0).toUpperCase() + props.item.title.substr(1)}</h5>
    </li>
    )
}

export default Folder
