import Layout from '../components/layout.js';
import React from 'react';
import { withRouter, useRouter} from 'next/router';
import {loadNoteLatest} from '../redux/actions/noteAction';
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
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(W)));
