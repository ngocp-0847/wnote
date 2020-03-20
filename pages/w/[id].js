import Head from 'next/head';
import Layout from '../../components/layout.js';
import React, { Component } from 'react';
import NoSSR from 'react-no-ssr';
import { RichEditor } from '../../components/RichEditor';
import {EditorState, convertToRaw} from 'draft-js';
import uuidv4 from 'uuid/v4';
import fetch from 'node-fetch';
import Router, { useRouter, withRouter } from 'next/router';
import {stateToHTML} from 'draft-js-export-html';
import {connect} from 'react-redux';
import {updateListNote} from '../../redux/actions/noteAction';

class WID extends Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty(), notes: [], shouldUpdate: true};
    Router.events.on('routeChangeComplete', (url) => {
      this.setState({shouldUpdate: true})
    });

    this.onChange = editorState => {
      if (this.state.shouldUpdate) {
        var shortContent = this.getContentForShortext(editorState)
        console.log('vao 2', shortContent)
        var body = {
            'content': stateToHTML(editorState.getCurrentContent()),
            'userID': localStorage.getItem('userID'),
            'createdAt': new Date().getTime(),
            'updatedAt': new Date().getTime(),
        }
        this.setState({editorState});
        fetch('/api/note/' + this.props.router.query.id, {
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
        });
      }
    };
  }
  getContentForShortext = (editorState) => {
    var contentState = editorState.getCurrentContent();
    var arrBlocks = contentState.getBlocksAsArray();
    var shortText = '';
    var shortImage = null;
    console.log('vao 2', arrBlocks);
    arrBlocks.forEach((block, key) => {
      var text = block.getText();
      if (shortImage == null && block.getType() == 'image') {
        console.log('vao 1', block)
        shortImage = block.src
      }
      if (shortText == '' && text.trim() != '') {
        shortText = text
      }
      if (shortImage != null && shortText != '') {
        return false;
      }
    })

    return {shortText: shortText, shortImage: shortImage}
  }
  onNewNote = () => {
    var noteID = uuidv4()
    Router.push(`/w/[id]`, `/w/${noteID}`, {shallow:true})
    this.setState({shouldUpdate: false})
    this.setState({editorState: EditorState.createEmpty()})
  }
  componentDidMount() {
    var body = {
        userID: localStorage.getItem('userID'),
    }
    fetch('/api/note', {
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
            var data = d.data
            console.log('vao 1', this.props.updateListNote)
            this.props.updateListNote(d.data)
        })
    });
  }
  render() {
    return (
      <main>
        <div className="sidebar-note">
          <div className="inner-list-note">
            <p id="header-ln">notes</p>
            <div className="wr-hei-note">
              <div className="list-note">
                  {
                      this.props.notes.map((note, i) => {
                          return (
                            <div key={i} className="note-c" dangerouslySetInnerHTML={{__html: note._source.content}}>
                            </div>
                          )
                      })
                  }
              </div>
            </div>
          </div>
        </div>
        <div className="main-note">
          <div id="header-editor">
            <h4 id="title-note">Editor</h4>
            <button id="btn-n-note" onClick={this.onNewNote}>New</button>
          </div>
          <NoSSR>
            <div className="editor">
              <RichEditor
                editorState={this.state.editorState}
                onChange={this.onChange}
                ref={element => {
                  this.editor = element
                }}
                />
            </div>
          </NoSSR>
        </div>
      </main>
    )
  }
}

const mapStateToProps = state => {
  return {
    notes: state.note.notes
  };
};

const mapDispatchToProps = {
    updateListNote: updateListNote,
};

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Layout(WID)));

// export default withRouter(Layout(WID))
