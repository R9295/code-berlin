import React, { Component } from "react";
import "@babel/polyfill";
import { render } from "react-dom";
import Navbar from "./components/Navbar";
import Article from "./components/Article";
import Folder from "./components/Folder";
import ArticleView from "./components/ArticleView";
import Form from "./components/Form";
const md = require("markdown-it")();
import Popup from "react-popup";
import posed from "react-pose";

render(<Popup />, document.getElementById("pop-up"));

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      path: "/wiki/",
      loading: true,
      edit_type: "article",
      files: {},
      article: {},
      container_type: "browse",
      active_dirs: [],
      toggled: true
    };
    this.browse = this.browse.bind(this);
    this.expandDir = this.expandDir.bind(this);
    this.expandArticle = this.expandArticle.bind(this);
    this.addContent = this.addContent.bind(this);
    this.handleBack = this.handleBack.bind(this);
    this.toggleSideModal = this.toggleSideModal.bind(this);
    this.editArticle = this.editArticle.bind(this);
    this.handleBreadCrumb = this.handleBreadCrumb.bind(this);
    this.renderArticle = this.renderArticle.bind(this);
  }
  handleBreadCrumb(item) {
    this.expandDir(
      this.state.path
        .slice()
        .substr(0, this.state.path.indexOf(item) + item.length + 1)
    );
  }
  editArticle(e, id) {
    e.preventDefault();
    this.setState({
      article: this.renderArticle(id),
      container_type: "edit"
    });
  }
  browse(e) {
    e.preventDefault();
    this.setState({
      container_type: "browse"
    });
  }
  handleBack(e, _path, force) {
    _path = _path || this.state.path;
    let p = _path.split("/");
    p = p.slice(0, p.length - 1);
    let p_length = p.length;
    p.length > 3 ? (p.length = p.length - 1) : {};
    let path = "";
    p.forEach(item => (path += `${item}/`));
    p_length === 3
      ? this.expandDir("/wiki/", force)
      : this.expandDir(path, force);
  }
  renderArticle(id) {
    let article = this.state.files[this.state.path].filter(
      item => item["_id"] === id
    )[0];

    article.rendered_content = md
      .render(article.content)
      .replace("\n", "<br/>");
    return article;
  }
  expandArticle(id) {
    this.setState({
      container_type: "articleview",
      article: this.renderArticle(id)
    });
    this.state.toggled == true ? this.toggleSideModal() : {};
  }
  async expandDir(path, force) {
    // append a slash at the end if it ain't there
    path = path.substr(-1) == "/" ? path : path + "/";
    // query only if forced or if it's not available locally
    // if forced, clear all the stored files.
    if (!this.state.files[path] || force) {
      force
        ? this.setState({
            files: {},
            loading: true
          })
        : {};
      try {
        const json = await (await fetch(path)).json();
        this.setState({
          files: {
            ...this.state.files,
            [path]: json.data
          },
          container_type: "browse",
          loading: false
        });
      } catch (e) {
        console.log(e);
      }
    }
    this.setState({
      path: path,
      container_type: "browse"
    });
  }
  addContent(e, type) {
    e.preventDefault();
    this.setState({
      edit_type: type,
      article: {},
      container_type: "edit"
    });
  }
  componentDidMount() {
    this.expandDir("/wiki/");
  }
  toggleSideModal() {
    $(document.getElementById("wrapper")).toggleClass("toggled");
    this.setState({
      toggled: !this.state.toggled
    });
  }
  render() {
    let articles = [];
    let folders = [];
    if (this.state.files[this.state.path]) {
      this.state.files[this.state.path].forEach(item => {
        item.type == "article"
          ? articles.push(
              <Article
                article={item}
                expandArticle={this.expandArticle}
                editArticle={this.editArticle}
              />
            )
          : folders.push(
              <Folder
                item={item}
                expandDir={this.expandDir}
                handleBack={this.handleBack}
              />
            );
      });
    }
    const Box = posed.div({
      hidden: {
        opacity: 0,
        transition: {
          duration: 3000
        }
      },
      visible: {
        opacity: 1,
        transition: {
          duration: 3000
        }
      }
    });
    let breadcrumbs = [];
    this.state.path
      .slice()
      .split("/")
      .forEach(item => {
        item != ""
          ? breadcrumbs.push(
              <li className="breadcrumb-item">
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    this.handleBreadCrumb(item);
                  }}
                >
                  {(item.charAt(0).toUpperCase() + item.substr(1)).replace(/-/g, " ")}
                </a>
              </li>
            )
          : {};
      });
      const {container_type} = this.state
    return (
      <div className="d-flex styled-text" id="wrapper">
        <div className="bg-light border-right" id="sidebar-wrapper">
          <div className="sidebar-heading">Bluelight Wiki</div>
          <div className="list-group list-group-flush">
            {this.state.path != "/wiki/" ? (
              <li
                className="list-group-item d-flex justify-content-between align-items-center"
                onClick={this.handleBack}
              >
                Back
              </li>
            ) : (
              ""
            )}

            {folders}
          </div>
        </div>

        <div id="page-content-wrapper">
          <Navbar
            addContent={this.addContent}
            toggleSideModal={this.toggleSideModal}
            browse={this.browse}
          />
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">{breadcrumbs}</ol>
          </nav>
          <br />
          <br />
          <div className="container-fluid">
            <div className="container">
              {!this.state.loading ? (
                <div className="col-12">
                  <Box
                    className="box"
                    pose={
                      container_type == "edit" ? "visible" : "hidden"
                    }
                  >
                    {container_type == "edit" ? (
                      <Form
                        edit_type={this.state.edit_type}
                        path={this.state.path}
                        article={this.state.article}
                        newContent={e => {
                          this.expandDir(this.state.path, true);
                        }}
                      />
                    ) : (
                      ""
                    )}
                  </Box>
                  <Box
                    className="box"
                    pose={
                      container_type == "articleview"
                        ? "visible"
                        : "hidden"
                    }
                  >
                    {container_type == "articleview" ? (
                      <ArticleView
                        article={this.state.article}
                        editArticle={this.editArticle}
                      />
                    ) : (
                      <div />
                    )}
                  </Box>
                  <Box
                    className="box align-self-center"
                    pose={
                      container_type == "browse"
                        ? "visible"
                        : "hidden"
                    }
                  >
                    {container_type == "browse" &&
                    articles.length !== 0 ? (
                      <div align="center">{articles}</div>
                    ) : (
                      <h3
                        align="center"
                        style={{
                          color: "grey"
                        }}
                      >
                        No articles here :(
                      </h3>
                    )}
                  </Box>
                </div>
              ) : (
                <div align="center">
                  <img src="/loading.gif" alt="loading" />
                  <h3 align="center" style={{ color: "#007bff" }}>
                    Loading
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

render(<App />, document.getElementById("react"));
