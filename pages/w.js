import Head from 'next/head';
import Layout from '../components/layout.js';
import React, { Component } from 'react';
import NoSSR from 'react-no-ssr';
import { RichEditor } from '../components/RichEditor';
import {EditorState} from 'draft-js';
import uuidv4 from 'uuid/v4';
import Router, { useRouter } from 'next/router';

class W extends Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = editorState => this.setState({editorState});

  }
  componentDidMount() {
    var userID = localStorage.getItem('userID');
    var noteID = uuidv4()
    if (userID == null) {
      userID = uuidv4()
      localStorage.setItem('userID', userID)
      Router.push(`/w/[id]`, `/w/${noteID}`, {shallow:true})
    }

    var body = {
      userID: localStorage.getItem('userID'),
    }
    fetch('/api/note/latest', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *client
        body: JSON.stringify(body) // body data type must match "Content-Type" header
    }).then((response) => {
        response.json().then((d) => {
            var hits = d.hits;
            if (hits.length != 0) {
              noteID = hits[0]._id
            }
            console.log('vao 2', noteID)
            Router.push(`/w/[id]`, `/w/${noteID}`, {shallow:true})
        })
    });
  }
  render() {
    return (
      <main>
      </main>
    )
  }
}

export default Layout(W)
