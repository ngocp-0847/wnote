import passport from 'passport'
import cookieSession from 'cookie-session'
import url from 'url';
import redirect from 'micro-redirect'
import { github } from './passport'
export { default as passport } from 'passport'
passport.use(github)
import client from './es';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Github profile is serialized
// and deserialized.
passport.serializeUser((user, done) => {
  console.log('serializeUser:', user)
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
    console.log('querySaveUser:', querySaveUser);
    return client.index({
        index: 'users',
        id: uuidv4(),
        body: valSaved,
    });
}

/**
 * Find user by github.userID
 * @param {*} userID 
 */
async function findOne(userID) {
    let userInfoRes = await client.search({
        index: 'users',
        body: {
            query: {
                match: { userID: userID }
            }
        }
    })
    if (userInfoRes.body.hits.total !=0 ) {
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

    let userInfo = await findOne(serializedUser.id);

    if (userInfo == null) {
        await querySaveUser(serializedUser);
        userInfo = await findOne(serializedUser.id);
        console.log('deserializeUser:userInfo:', userInfo);
        done(null, userInfo);
    } else {
        done(null, userInfo);
    }
})

// export middleware to wrap api/auth handlers
export default fn => (req, res) => {
  if (!res.redirect) {
    // passport.js needs res.redirect:
    // https://github.com/jaredhanson/passport/blob/1c8ede/lib/middleware/authenticate.js#L261
    // Monkey-patch res.redirect to emulate express.js's res.redirect,
    // since it doesn't exist in micro. default redirect status is 302
    // as it is in express. https://expressjs.com/en/api.html#res.redirect
    res.redirect = (location) => redirect(res, 302, location)
  }

  // Initialize Passport and restore authentication state, if any, from the
  // session. This nesting of middleware handlers basically does what app.use(passport.initialize())
  // does in express.
  cookieSession({
    name: 'passportSession',
    signed: false,
    domain: url.parse(req.url).host,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })(req, res, () =>
    passport.initialize()(req, res, () =>
      passport.session()(req, res, () =>
        // call wrapped api route as innermost handler
        fn(req, res)
      )
    )
  )
}
