
import {responseError, responseSuccess, fnBuildResponse, fnWrapDeletedAt} from '../util';
import client from '../../../lib/es';
import withPassport from '../../../lib/withPassport'
import { resolve } from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

const updateView = (id) => {
  client.update({
    index: 'wnote',
    type: 'note',
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
        type: 'note',
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
      });
    } else {
      console.log("Update view OK")
    }
  });
}

const findOne = (id, userID) => {
  return new Promise((resolve, reject) => {
    client.search({
      index: 'wnote',
      body: {
        query: {
          bool: {
            must: [
              {match: {_id: id}},
              {match: {userID: userID}}
            ]
          }
        },
      }
    }, function(error, response, status) {
        if (error){
          console.log("index error: " + error)
          reject(error)
        } else {
          resolve(response.body.hits)
        }
    });
  });
}

const handler = async (req, res) => {
  console.log('api:[id]:', req.method);

  if (req.method === 'DELETE') {
    client.update({
      index: 'wnote',
      type: 'note',
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
            if (error){
              responseError(res, error);
              console.log("index error: "+error)
            } else {
              try {
                var body = JSON.parse(response.meta.request.params.body);
              } catch (e) {
                responseError(res, 'fail')
              }

              findOne(id, req.user._source.userGeneId).then((t) => {
                responseSuccess(res, t[0])
              })
              // body = fnBuildResponse(id, body)
              // responseSuccess(res, body)
            }
        });
      }

    } else if (bodyData.tags) {
      // Save tag in indendent index.
      console.log('POST notes/[id]:tags:', bodyData.tags)
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
          findOne(id, req.user._source.userGeneId).then((t) => {
            responseSuccess(res, t[0])
          })
        }
      });
    }
  } else if (req.method == 'GET') {
    const { id } = req.query;
    updateView(id)
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

