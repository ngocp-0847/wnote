import Head from 'next/head';

const withLayout = (Page) => {
  return (props) => (
      <div className="w-container">
        <Head>
          <title>Note everything</title>
          <link rel="icon" href="/png-clipart-computer-icons-bookmark-favicon-icon-free-bookmark-miscellaneous-angle.png" />
        </Head>
        <Page {...props} />
        <style jsx global>{`
          html,
          body {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
              Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          }

          * {
            box-sizing: border-box;
          }
          .w-container{
            width: 100%;
            height: 100%;
            display: flex;
          }
          #__next{
            width: 100%;
            height: 100%;
          }
          #__next > div {
            width: 100%;
            height: 100%;
          } 
          #__next > div > div {
            width: 100%;
            height: 100%;
          } 
        `}</style>
      </div>
  )
}

export default withLayout;
