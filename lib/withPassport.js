import passport from 'passport';
import session from 'express-session';
var cookieSession = require('cookie-session');

let RedisStore = require('connect-redis')(session);
let redis   = require('redis');
let redisClient = redis.createClient({
  port      : process.env.REDIS_PORT,               // replace with your port
  host      : process.env.REDIS_HOST,
});

let insRedisStore = new RedisStore({ host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  client: redisClient, ttl : 260
})

import redirect from 'micro-redirect'
import { github } from './passport'
export { default as passport } from 'passport'
passport.use(github)
import client from './es';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';


passport.serializeUser((user, done) => {
  console.log('serializeUser:')
  const { id, displayName, username, profileUrl, photos, emails } = user
  done(null, { id, displayName, username, profileUrl, photos, emails })
})

/**
 * Save user if not exists.
 * @param {} body
 */
async function querySaveUser(serializedUser) {
    const userGeneId = uuidv4();
    let valSaved = _.pick(serializedUser, ['displayName', 'username', 'profileUrl', 'photos', 'emails']);
    valSaved.userID = serializedUser.id;
    valSaved.userGeneId = userGeneId;
    valSaved.type = 'github';
    console.log('querySaveUser:', valSaved);

    return client.index({
        index: 'users',
        id: uuidv4(),
        body: valSaved,
    });
}

const findUser = async (id) => {
  let userInfoRes = await client.search({
    index: 'users',
    body: {
        query: {
            match: { userID: id }
        }
    }});
    console.log('findUser:', userInfoRes)
    if (userInfoRes.body.hits.total.value !=0 ) {
      return userInfoRes.body.hits.hits[0];
  } else {
      return null;
  }
}

passport.deserializeUser(async (serializedUser, done) => {
    console.log('deserializeUser:', serializedUser)
    if (!serializedUser) {
        return done(new Error(`User not found: ${serializedUser}`))
    }

    let userInfo = null

    try {
      userInfo = await findUser(serializedUser.id);
    } catch (t) {
      console.log('deserializeUser:t', t)
    }

    console.log('deserializeUser:userInfo:', userInfo)

    if (userInfo == null) {
        await querySaveUser(serializedUser);
        userInfo = await findUser(serializedUser.id);
        console.log('deserializeUser:userInfo:', userInfo);
        done(null, userInfo);
    } else {
        done(null, userInfo);
    }
})

// export middleware to wrap api/auth handlers
export default fn => (req, res) => {
  // passport.js needs res.redirect:
  // https://github.com/jaredhanson/passport/blob/1c8ede/lib/middleware/authenticate.js#L261
  // Monkey-patch res.redirect to emulate express.js's res.redirect,
  // since it doesn't exist in micro. default redirect status is 302
  // as it is in express. https://expressjs.com/en/api.html#res.redirect
  res.redirect = (location) => redirect(res, 302, location)

  // Initialize Passport and restore authentication state, if any, from the
  // session. This nesting of middleware handlers basically does what app.use(passport.initialize())
  // does in express.
  session({
    name: 'passport.sig',
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: {
      path: '/',
      httpOnly: true,
      // secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      signed: false
    },
    store: insRedisStore,
  })(req, res, () => {
      passport.initialize()(req, res, () => {
          passport.session()(req, res, () =>
            // call wrapped api route as innermost handler
            fn(req, res)
          )
        }
      )
    }
  )
}
