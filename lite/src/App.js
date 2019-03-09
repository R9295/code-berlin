/* eslint-disable no-unused-expressions */
import React, { Component } from "react";
import Navbar from "./components/Navbar";
import Article from "./components/Article";
import Folder from "./components/Folder";
import ArticleView from "./components/ArticleView";
import posed from "react-pose";
import "./App.css";
import Popup from "react-popup";
const md = require("markdown-it")();
const IPFS = require("ipfs");
const OrbitDB = require("orbit-db");
const fileType = require("file-type");

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      path: "/wiki/",
      loading: true,
      edit_type: "article",
      files: {},
      article: {},
      container_type: "browse",
      toggled: true
    };
    this.browse = this.browse.bind(this);
    this.expandDir = this.expandDir.bind(this);
    this.expandArticle = this.expandArticle.bind(this);
    this.handleBack = this.handleBack.bind(this);
    this.toggleSideModal = this.toggleSideModal.bind(this);
    this.handleBreadCrumb = this.handleBreadCrumb.bind(this);
    this.getStatic = this.getStatic.bind(this);
  }
  handleBreadCrumb(item) {
    this.expandDir(
      this.state.path
        .slice()
        .substr(0, this.state.path.indexOf(item) - 1 + item.length + 2)
    );
  }
  browse(e) {
    e.preventDefault();
    this.setState({
      container_type: "browse"
    });
  }
  getStatic(item) {
    return new Promise(async (resolve, reject) => {
      // get the hash from the url
      const hash = /\/ipfs\/\w{46}/g.exec(item);
      const file = await this.ipfs.files.get(hash[0]);
      const buffer_type = fileType(file[0].content);
      resolve({
        result: `data:${buffer_type.mime};base64,${file[0].content.toString(
          "base64"
        )}`,
        path: item
      });
    });
  }
  handleBack() {
    let p = this.state.path.slice().split("/");
    p = p.slice(0, p.length - 1);
    let p_length = p.length;
    p.length > 3 ? (p.length = p.length - 1) : {};
    let path = "";
    p.forEach(item => (path += `${item}/`));
    p_length === 3 ? this.expandDir("/wiki/") : this.expandDir(path);
  }
  expandArticle(id) {
    this.setState({
      loading: true
    });
    let article = this.state.files[this.state.path].filter(
      item => item["_id"] === id
    )[0];
    const rendered_content = md.render(article.content).replace("\n", "<br/>");
    //replace local static content with dataurl
    const staticFiles = /((?:https?:\/\/.*):(?:\d*)(?:\/ipfs\/\w{46}))/g.exec(
      rendered_content
    );
    // fetch all the static files
    let _promises = [];
    if (staticFiles) {
      staticFiles.map(item => {
        _promises.push(this.getStatic(item));
      });
    }
    article.rendered_content = rendered_content;
    Promise.all(_promises).then(data => {
      data.forEach(item => {
        article.rendered_content = rendered_content.replace(
          item.path,
          item.result
        );
      });
      this.setState({
        container_type: "articleview",
        article: article,
        loading: false
      });
      this.state.toggled == true ? this.toggleSideModal() : {};
    });
  }
  expandDir(id) {
    // append a slash at the end if it ain't there
    id = id.substr(-1) == "/" ? id : id + "/";
    // check if it's available locally
    if (!this.state.files[id]) {
      this.setState({
        loading: true
      });
      // make sure the article/folder is not nested and is present in the folder
      // excluding everything forward
      const data = this.db
        .get(id)
        .filter(e => e._id.slice().split("/").length <= id.split("/").length);
      this.setState({
        files: {
          ...this.state.files,
          [id]: data
        },
        loading: false
      });
    }
    this.setState({
      path: id,
      container_type: "browse"
    });
  }
  toggleSideModal() {
    window.$(document.getElementById("wrapper")).toggleClass("toggled");
    this.setState({
      toggled: !this.state.toggled
    });
  }
  componentDidMount() {
    const self = this;
    create();
    function create() {
      console.log("creating/loading IPFS Node");
      // Create the node
      const node = new IPFS({
        EXPERIMENTAL: {
          pubsub: true
        }
        // CANT USE WEBSOCKET STAR as there is a bug:
        // https://github.com/ipfs/js-ipfs/issues/1699
        // It's fixed in ipfs@0.34.0 but there are breaking
        // changes that orbit is not ready for. Orbit runs only on ipfs@0.33.0 or ipfs@0.33.1
        //config: {
        //  Addresses: {
        //    Swarm: [
        //      "/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star"
        //    ]
        //  }
        //}
      });
      node.once("ready", async () => {
        console.log("Node is ready");
        const data = await fetch("/bootstrap");
        const json = await data.json();
        json.bootstrap_peers.forEach(async item => {
          try {
            await node.swarm.connect(item);
          } catch (e) {
            console.log("failed to dial peer", item);
          }
        });
        const orbitdb = new OrbitDB(node);
        const db = await orbitdb.docstore(json.db_address);
        self.db = db;
        self.ipfs = node;
        await self.db.load();
        console.log(`Connected to DB ${self.db.id}`);
        self.db.events.on("replicated", () => {
          console.log("replicated");
          Popup.close();
          Popup.alert(
            "The database has been updated. Please refresh your page for updated content."
          );
        });
        self.expandDir("/wiki/");
      });
    }
  }
  render() {
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
    let articles = [];
    let folders = [];
    if (this.state.files[this.state.path]) {
      this.state.files[this.state.path].forEach(item => {
        item.type == "article"
          ? articles.push(
              <Article article={item} expandArticle={this.expandArticle} />
            )
          : folders.push(<Folder item={item} expandDir={this.expandDir} />);
      });
    }
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
                  key={item}
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
                      this.state.container_type == "edit" ? "visible" : "hidden"
                    }
                  >
                    {this.state.container_type == "edit" ? "" : ""}
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
                      <div className="row">{articles}</div>
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
