import withPassport, { passport } from '../../../../lib/withPassport'

const handler = async (req, res) => {
  const { provider } = req.query
  if (!provider) {
    return { statusCode: 404 }
  }

  passport.authenticate(provider, {
    failureRedirect: '/w',
    successRedirect: '/w',
  })(req, res, (...args) => {
    console.log('auth callback', args)
    return true
  })
}

export default withPassport(handler)
