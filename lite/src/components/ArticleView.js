import React from "react";

const ArticleView = props => {
  return (
    <div>
      <h6 className="article-view-title">{props.article.title}</h6>
      <br />
      <br />
      <div
        dangerouslySetInnerHTML={{
          __html: props.article.rendered_content
        }}
        className="article-view-content justify-content-center"
      />
      <br />
    </div>
  );
};

export default ArticleView;
