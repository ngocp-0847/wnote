import React, { useContext } from 'react'
import nextCookie from 'next-cookies'
import redirect from './redirect'
import NextApp from 'next/app'

const IdentityContext = React.createContext(null)

const loginPage = '/w'

const redirectToLogin = (ctx) => {
  if (
    (ctx && ctx.pathname === loginPage) ||
    (typeof window !== 'undefined' && window.location.pathname === loginPage)
  ) {
    return
  }

  redirect(ctx, loginPage)
}

// any is needed to use as JSX element
const withIdentity = (App) => {
  return class IdentityProvider extends React.Component {
    static displayName = `IdentityProvider(MyApp)`
    static async getInitialProps(ctx) {
      console.log('getInitialProps:', ctx.ctx);
      let appProps
      if (NextApp.getInitialProps) {
        appProps = await NextApp.getInitialProps(ctx)
      } else {
        appProps = { pageProps: {} }
      }
      const { passportSession } = nextCookie(ctx.ctx)
      console.log('withIdentity:passportSession:', passportSession, ctx.ctx)

      let session = null
      if (!passportSession) {
        return {
          ...appProps,
          session,
        }
      }

      const serializedCookie = Buffer.from(passportSession, 'base64').toString()

      const {
        passport: { user },
      } = JSON.parse(serializedCookie)
      // redirect to login if cookie exists but is empty
      if (!user) {
        redirectToLogin(ctx.ctx)
      }

      session = user
      console.log('withIdentity:session:', session);
      return {
        ...appProps,
        session,
      }
    }
    
    render() {
      const {session, ...appProps } = this.props

      return (
        <IdentityContext.Provider value={session}>
          <App {...appProps} />
        </IdentityContext.Provider>
      )
    }
  }
}

export const useIdentity = () => useContext(IdentityContext)

export default withIdentity
