// This page doesn't define `getInitialProps`.
// Next.js will export the page to HTML at build time with the loading state
// When the page is loaded in the browser SWR will fetch the data
// Using the defined fetcher function
import fetch from 'unfetch'
import useSWR from 'swr'

const API_URL = 'https://api.github.com'
async function fetcher(path) {
  const res = await fetch(API_URL + path)
  const json = await res.json()
  return json
}

function HomePage() {
  const { data, error } = useSWR('/repos/zeit/next.js', fetcher)

  if (error) return <div>failed to load</div>
  if (!data) return <div>loading...</div>
  return <div>Next stars: {data.stargazers_count}</div>
}

export default HomePage