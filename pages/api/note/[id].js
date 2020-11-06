
import {responseError, responseSuccess, fnBuildResponse, fnWrapDeletedAt} from '../util';
import client from '../../../lib/es';
import withPassport from '../../../lib/withPassport'

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

const handler = (req, res) => {
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
    let bodyData = fnWrapDeletedAt(req.body)
    bodyData.views = views
    console.log('req.method:[id]:', id)
    client.index({
      index: 'wnote',
      id: id,
      type: 'note',
      body: bodyData
    },function(error, response, status) {
        if (error){
          responseError(res, error);
          console.log("index error: "+error)
        } else {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          try {
            var body = JSON.parse(response.meta.request.params.body);
          } catch (e) {
            res.status(400).json('fail')
          }

          body = fnBuildResponse(id, body)
          res.status(200).json(body)
        }
    });
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
    },function(error, response, status) {
        if (error){
          responseError(res, error);
          console.log("index error: "+error)
        } else {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.status(200).json(response.body.hits)
        }
    });
  }
}

export default withPassport(handler)

