import React from "react";

const Article = props => {
  return (
    <div className="col-12 mt-2 justify-content-left" align="left">
      <div className="card">
        <div className="card-body">
          <h5 className="card-title" style={{ fontStyle: "italic" }}>
            {props.article.title}
          </h5>
          <p className="card-text">{props.article.description}</p>
          <div className="row">
          <div style={{paddingLeft: '10px'}} />
          <a
            href="#"
            className="btn btn-outline-primary btn-sm pointer"
            onClick={e => {
              e.preventDefault();
              props.expandArticle(props.article._id);
            }}
          >Read
          </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Article;
