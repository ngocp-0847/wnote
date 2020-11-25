var kue = require('kue')
  , cluster = require('cluster')
  , queue = kue.createQueue();

require('dotenv').config();

const es = require('../lib/es');
const request = require('request');
const client = es.default

const callbackJobTagVector = (job, done) => {
    const tags = job.data.tags
    const noteID = job.data.noteID
    let paramString = encodeURIComponent(tags)
    console.log('callbackJobTagVector:', paramString)
    request('http://127.0.0.1:5000/query?key='+paramString, { json: true }, (err, res, body) => {
        if (err) {
            console.log(err)
            reject(err)
        } else {
            console.log('findSimilarTag:body:', body)
            const bodyData = {
                tag_vector: body,
            }

            client.update({
                index: 'wnote',
                id: noteID,
                body: {
                    doc: bodyData
                },
            }, function(error, response, status) {
                if (error) {
                    console.log("findSimilarTag:index error: " + error)
                    done()
                } else {
                    done()
                }
            });
        }
    });
}

const callbackUpdateView = (job, done) => {
    const id = job.data.noteID

    client.update({
        index: 'wnote',
        id: id,
        body: {
          // put the partial document under the `doc` key
          script: {
            lang: 'painless',
            source: 'ctx._source.views++',
          },
        }
      }, function (error, response) {
        if (error) {
          console.log("updateView:index error: " + error)
          client.update({
            index: 'wnote',
            id: id,
            body: {
              doc: {
                views: 1
              },
            }
          }, function (error, response) {
            if (error){
              console.log("index error: "+error, response)
            }
            console.log("updateView:index created success")
            done()
          });
        } else {
          console.log("Update view OK")
          done()
        }
    });
}


queue.process("index_vector_tag", 1, callbackJobTagVector);
queue.process("update_view", 1, callbackUpdateView);