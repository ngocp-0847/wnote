import Layout from '../../components/layout.js';
import React, { Component } from 'react';
import { withRouter, useRouter} from 'next/router';
import {loadNoteLatest, loadDefineIdentity} from '../../redux/actions/noteAction';
import {connect} from 'react-redux';

function Login(props) {
  const router = useRouter();
  
  return (
    <div className="area-login">
        <a onClick={() => router.push('/api/auth/github')} id="login-github">Login</a>
    </div>
  )
}

const mapStateToProps = state => {
  return {
  };
};

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(Login)));
