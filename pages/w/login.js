import Layout from '../../components/layout.js';
import React, { Component } from 'react';
import { withRouter, useRouter} from 'next/router';
import {connect} from 'react-redux';

function Login(props) {
  const router = useRouter();
  
  return (
    <div className="area-login">
      <div className="recomme">
        <h1 className="title">WNote, note for everything super fast</h1>
        <div className="guide-l">
          <img src="/523c759a55e222c472d6036bf139702f.jpg" className="icon-home"/>
          <div className="btn-login">
            <a onClick={() => router.push('/api/auth/github')} id="login-github">Login Github</a>
          </div>
        </div>
      </div>
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
