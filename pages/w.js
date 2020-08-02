import Layout from '../components/layout.js';
import React, { Component } from 'react';
import {EditorState} from 'draft-js';
import { withRouter, useRouter} from 'next/router';
import {loadNoteLatest, loadDefineIdentity} from '../redux/actions/noteAction';
import {connect} from 'react-redux';

function W(props) {
  const router = useRouter();
  props.loadNoteLatest(router);
  return (
    <main>
    </main>
  )
}

const mapStateToProps = state => {
  return {
  };
};

const mapDispatchToProps = {
    loadNoteLatest: loadNoteLatest,
    loadDefineIdentity: loadDefineIdentity,
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(W)));
