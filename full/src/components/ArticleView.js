import React from "react";

const ArticleView = props => {
  // If the address of the server changes, the images won't render
  // as the URL is hardcoded in articles. This replaces the image urls
  // with the current address to prevent image rendering from breaking
  let rendered = props.article.rendered_content;
  const images = /(<img src="(?:https?:\/\/.*:\d*)(?:\/ipfs\/\w{46}))"/g.exec(
    rendered
  );
  images
    ? images.forEach(image => {
        rendered = rendered.replace(
          image,
          `<img src="${document.baseURI}${/ipfs\/\w{46}/.exec(image)[0]}"`
        );
      })
    : {};
  return (
    <div>
      <h6 className="article-view-title">{props.article.title}</h6>
      <br />
      <br />
      <div
        dangerouslySetInnerHTML={{
          __html: rendered
        }}
        className="article-view-content justify-content-center"
      />
      <br />
      <br />
    </div>
  );
};

export default ArticleView;
