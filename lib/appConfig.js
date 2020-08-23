import { Strategy } from 'passport-github'

const getOAuthUrls = function(
  hostName,
  app
) {
  
  return {
    hostName: hostName,
    app: app,
    callbackURL: `${hostName}/api/auth/callback/${app}`
  }
}

const isDevelopment = process.env.NODE_ENV !== 'production'
const hostingURL = process.env.HOSTING_URL || 'http://localhost:3000'

const githubOptions = {
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  scope: 'user:email',
  ...getOAuthUrls(hostingURL, 'github'),
}

const githubStragety = new Strategy(githubOptions,
  function(accessToken, refreshToken, profile, cb) {
    console.log('authen:verify:OK:', accessToken, refreshToken, profile)
  }
)

export const appConfig = {
  isDevelopment: isDevelopment,
  hostingURL: hostingURL,
  github: githubStragety,
  githubOptions: githubOptions,
}

export default appConfig