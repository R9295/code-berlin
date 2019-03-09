import React, { Component } from "react";
import Popup from "react-popup";

class Folder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleDeleteFolder = this.handleDeleteFolder.bind(this);
  }
  handleDeleteFolder(e) {
    e.stopPropagation();
    Popup.create({
      title: "Are you sure?",
      content: `Are you sure you want to delete "${
        this.props.item.title
      }" and it's child articles and folders?`,
      buttons: {
        left: [
          {
            text: "No",
            action: () => Popup.close()
          }
        ],
        right: [
          {
            text: "Yes",
            action: async () => {
              Popup.close();
              try {
                const json = await (await fetch(`/folder/delete`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    _id: this.props.item._id
                  })
                })).json();
                const isSuccess = json.response == "success";
                Popup.close();
                Popup.alert(
                  `${
                    isSuccess
                      ? `Successfully deleted the folder`
                      : `Error ${json.message}`
                  }`
                );
                this.props.handleBack(null, this.props.item._id+"/", true);
              } catch (e) {}
            }
          }
        ]
      }
    });
  }
  render() {
    return (
      <li
        className={`
      list-group-item d-flex justify-content-between align-items-center directory`}
        onClick={e => {
          e.preventDefault();
          this.props.expandDir(this.props.item._id);
        }}
      >
        <h5>
          {this.props.item.title.charAt(0).toUpperCase() +
            this.props.item.title.substr(1)}
        </h5>
        <span
          class="badge badge-danger align-self-left pointer"

          onClick={this.handleDeleteFolder}
        >
          &times;
        </span>
      </li>
    );
  }
}

export default Folder;
