import Layout from '../components/layout.js';
import React, { Component } from 'react';
import {EditorState} from 'draft-js';
import Router, { withRouter} from 'next/router';
import {loadNoteLatest} from '../redux/actions/noteAction';
import {connect} from 'react-redux';
import {useIdentity} from '../lib/withIdentity';

function W(props) {
  props.loadNoteLatest(useIdentity())
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
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(W)));
