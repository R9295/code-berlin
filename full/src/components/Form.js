import React, { Component } from "react";
import InsertStatic from "../components/InsertStatic";
import FormField from "../components/FormField";
import Popup from "react-popup";

export default class Form extends Component {
  constructor(props) {
    super(props);
    this.state = {
      add_data: {
        description: props.article.description || "",
        edit: props.article._id,
        title: props.article.title || "",
        type: props.article.type || props.edit_type,
        content: props.article.content || "",
        staticFiles: props.article.staticFiles
          ? ["", ...props.article.staticFiles]
          : [""],
        path:
          props.path != "/wiki/"
            ? props.path.substr(0, props.path.length - 1)
            : props.path
      }
    };
    this.form_fields = {
      article: [
        {
          name: "title",
          type: "text",
          help: "Enter the Article's title."
        },
        { name: "type", type: "text", disabled: true },
        {
          name: "description",
          type: "text",
          help: "Small description to add to preview."
        },
        { name: "path", type: "text", disabled: true },
        { name: "content", type: "textarea" }
      ],
      folder: [
        {
          name: "title",
          type: "text",
          help: "Enter the Folder's title, cannot be edited."
        },
        { name: "type", type: "text", disabled: true },
        { name: "path", type: "text", disabled: true }
      ]
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.getIpfsHash = this.getIpfsHash.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }
  handleRemove(path) {
    const removed = this.state.add_data.staticFiles.filter(
      item => item.path !== path
    );
    this.setState({
      add_data: {
        ...this.state.add_data,
        staticFiles: removed
      }
    });
  }
  async getIpfsHash(hex) {
    try {
      const json = await (await fetch("/gethash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: hex
        })
      })).json();
      return json.path;
    } catch (e) {
      throw new Error(`Failed to get static file hash, error: ${e}`);
    }
  }
  async handleSubmit(e) {
    e.preventDefault();
    // sainitize data
    const data = Object.assign({}, this.state.add_data);
    // remove the first one as it is an empty string
    data.staticFiles = data.staticFiles.filter((data, index) => index != 0);
    try {
      const json = await (await fetch(`/${this.state.add_data.type}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })).json();
      console.log(json);
      const isSuccess = json.response == "success";
      console.log(json.message);
      Popup.alert(
        `${
          isSuccess
            ? `Successfully ${
                this.props.article.title ? "edited" : "created"
              } the ${this.state.add_data.type}`
            : `Error : ${json.message}`
        }`
      );
      isSuccess ? this.props.newContent() : {};
    } catch (e) {
      throw new Error(`Error: ${e}`);
    }
  }
  handleFieldChange(e) {
    this.setState({
      add_data: {
        ...this.state.add_data,
        [e.target.id]: e.target.value
      }
    });
  }
  handleUpload(e) {
    e.preventDefault();
    let reader = new FileReader();
    const file = e.target.files[0];
    reader.addEventListener("load", async () => {
      const path = await this.getIpfsHash(reader.result.toString("hex"));
      this.setState({
        add_data: {
          ...this.state.add_data,
          staticFiles: [
            ...this.state.add_data.staticFiles,
            {
              path: path,
              name: file.name
            }
          ]
        }
      });
    });
    reader.readAsDataURL(e.target.files[0]);
  }
  handleDelete(e) {
    e.preventDefault(),
      Popup.create({
        title: "Are you sure?",
        content: `Are you sure you want to delete "${
          this.state.add_data.title
        }" ?`,
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
                try {
                  const json = await (await fetch(`/article/delete`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      _id: this.state.add_data.edit
                    })
                  })).json();
                  const isSuccess = json.response == "success";
                  Popup.close();
                  Popup.alert(
                    `${
                      isSuccess
                        ? `Successfully deleted the article`
                        : `Error deleting the article,
                               are you sure you have the permission?
                               Check the node's logs otherwise`
                    }`
                  );
                  this.props.newContent();
                } catch (e) {
                  console.error(e);
                }
              }
            }
          ]
        }
      });
  }
  render() {
    let form_fields = [];
    this.form_fields[this.state.add_data.type].forEach(field => {
      form_fields.push(
        <FormField
          field={field}
          value={this.state.add_data[field.name]}
          handleFieldChange={this.handleFieldChange}
        />
      );
    });
    const staticFiles = [];
    this.state.add_data.staticFiles.forEach((item, index) => {
      staticFiles.push(
        <InsertStatic
          handleUpload={this.handleUpload}
          handleRemove={this.handleRemove}
          item={item}
          index={index}
        />
      );
    });
    return (
      <div className="card">
        <form className="card-body">
          <br />
          <div className="row justify-content-center">
            {this.state.add_data.type == "article" ? (
              <div className="col-sm-8 col-lg-8 col-md-8">
                <h6>Add static</h6>
                {staticFiles}
              </div>
            ) : (
              ""
            )}

            {form_fields}
            <div className="col-sm-8 col-lg-8 col-md-8" align="center">
              {this.state.add_data.type == "folder" ? <br /> : ""}
              <button
                type="button"
                onClick={this.handleSubmit}
                className="btn btn-primary btn-md"
              >
                Save
              </button>
              {this.state.add_data.type == "folder" ? " " : [<br />, <br />]}
              {this.props.article.title ? (
                <button
                  type="button"
                  onClick={this.handleDelete}
                  className="btn btn-danger btn-md"
                >
                  Delete
                </button>
              ) : (
                ""
              )}
            </div>
          </div>
        </form>
      </div>
    );
  }
}
