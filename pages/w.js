import Head from 'next/head';
import Layout from '../components/layout.js';
import React, { Component } from 'react';
import NoSSR from 'react-no-ssr';
import { RichEditor } from '../components/RichEditor';
import {EditorState} from 'draft-js';
import uuidv4 from 'uuid/v4';
import Router, { withRouter} from 'next/router';
import {loadNoteLatest} from '../redux/actions/noteAction';
import {connect} from 'react-redux';

class W extends Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = editorState => this.setState({editorState});
    this.props.loadNoteLatest()
  }
  componentDidMount() {
  }
  render() {
    return (
      <main>
      </main>
    )
  }
}

const mapStateToProps = state => {
  return {
  };
};

const mapDispatchToProps = {
    loadNoteLatest: loadNoteLatest,
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(W)));
