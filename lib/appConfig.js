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
  clientID: 'Iv1.576c1d16eaedfb65',
  clientSecret: '9d7faa4ed7544850a7c67a5337d51f9f95550da2',
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