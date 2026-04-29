export const TWEET_EMBED_SANDBOX = 'allow-scripts allow-popups'

export function getTweetEmbedSrcDoc(sourceUrl: string) {
  const tweetUrl = sourceUrl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }
      body {
        min-height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
      .tweet-shell {
        width: 100%;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div class="tweet-shell">
      <blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><a href="${tweetUrl}"></a></blockquote>
    </div>
    <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
  </body>
</html>`
}
