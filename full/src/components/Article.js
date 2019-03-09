import React from "react";

const Article = props => {
  return (
    <div class="col-12 mt-2 justify-content-left" align="left">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title" style={{ fontStyle: "italic" }}>
            {props.article.title}
          </h5>
          <p class="card-text">{props.article.description}</p>
          <div className="row">
            <div style={{ paddingLeft: "10px" }} />
            <a
              href="#"
              class="btn btn-outline-primary btn-sm pointer"
              onClick={e => {
                e.preventDefault();
                props.expandArticle(props.article._id);
              }}
            >
              Read
            </a>
            <div style={{ paddingLeft: "10px" }} />
            <a
              href="#"
              class="btn btn-outline-warning btn-sm pointer"
              onClick={e => props.editArticle(e, props.article._id)}
            >
              Edit
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Article;
