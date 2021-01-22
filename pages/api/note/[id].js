
import {responseError, responseSuccess, fnBuildResponse, fnWrapDeletedAt} from '../util';
import client from '../../../lib/es';
import withPassport from '../../../lib/withPassport'
const request = require('request');
const kue = require('kue')
, queue = kue.createQueue();


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

const findOne = (id) => {
  return new Promise((resolve, reject) => {
    client.get({
      index: 'wnote',
      id: id
    }).then(e => {
      resolve(e.body)
    }).catch(err => {
      reject(err)
    })
  });
}

const handler = async (req, res) => {
  console.log('api:[id]:', req.method);

  if (req.method === 'DELETE') {
    client.update({
      index: 'wnote',
      id: req.body.noteID,
      body: {
        // put the partial document under the `doc` key
        doc: {deletedAt: Date.now()}
      }
    }, function (error, response) {
      if (error){
        responseError(res, error);
        console.log("index error: "+error)
      } else {
        responseSuccess(res, response);
      }
    });

  } else if (req.method === 'POST') {
    const { id } = req.query;
    let views = req.body.views ? req.body.views : 0;
    let tags = req.body.tags ? req.body.tags : [];
    let bodyData = fnWrapDeletedAt(req.body)
    bodyData.views = views
    bodyData.tags = tags

    console.log('req.method:[id]:', id, bodyData)
    if (bodyData.shortContent) {
      const { body } = await client.exists({
        index: 'wnote',
        id: id
      })

      if (!body) {
        client.index({
          index: 'wnote',
          id: id,
          body: bodyData
        }, function(error, response, status) {
            if (error){
              responseError(res, error);
              console.log("index error: "+error)
            } else {
              try {
                var body = JSON.parse(response.meta.request.params.body);
              } catch (e) {
                responseError(res, 'fail')
              }

              body = fnBuildResponse(id, body)
              responseSuccess(res, body)
            }
        });
      } else {
        client.update({
          index: 'wnote',
          id: id,
          body: {
            doc: bodyData
          },
        }, function(error, response, status) {
            if (error) {
              console.log("index error: "+error)
              responseError(res, error);
            } else {
              console.log('findOne:', id, req.user._source.userGeneId)
              findOne(id, req.user._source.userGeneId).then((t) => {
                responseSuccess(res, t)
              })
            }
        });
      }

    } else if (bodyData.tags) {
      // Save tag in indendent index.
      console.log('POST notes/[id]:tags:', bodyData.tags)

      if (tags.length > 0) {
        var job = queue.create('index_vector_tag', {tags: tags, noteID: id}).save(function(error) {
          if (!error)  {
            console.log('job created success:' + job.id)
          } else {
            console.log('job created error' + error)
          };
        });
      }

      bodyData.tags.forEach(async tag => {
        const { body } = await client.exists({
          index: 'tags',
          id: tag
        })

        if (!body) {
          const results = await client.index({
            index: 'tags',
            id: tag,
            body: {key: tag}
          })
        }
      })

      // Save tags in note
      client.update({
        index: 'wnote',
        id: id,
        body: {
          doc: bodyData
        }
      }, function(error, response, status) {
        if (error) {
          console.log("index error: " + error)
          responseError(res, error);
        } else {
          findOne(id).then((t) => {
            responseSuccess(res, t)
          })
        }
      });
    }
  } else if (req.method == 'GET') {
    const { id } = req.query;

    var job = queue.create('update_view', {noteID: id}).save(function(error) {
      if (!error)  {
        console.log('update_view:job created success:' + job.id)
      } else {
        console.log('update_view:job created error' + error)
      };
    });

    console.log('GET notedetail:', id, req.user)
    client.search({
      index: 'wnote',
      body: {
        query: {
          bool: {
            must: [
              {match: {_id: id}},
              {match: {userID: req.user._source.userGeneId}}
            ]
          }
        },
      }
    }, function(error, response, status) {
        if (error){
          console.log("index error: " + error)
          responseError(res, error);
        } else {
          responseSuccess(res, response.body.hits)
        }
    });
  }
}

export default withPassport(handler)

