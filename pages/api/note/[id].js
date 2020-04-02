const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });
import {responseError, responseSuccess, fnBuildResponse, fnWrapDeletedAt} from '../util';

export default (req, res) => {
  console.log('api:[id]:', req.method, req.body);
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
    client.index({
      index: 'wnote',
      id: id,
      type: 'note',
      body: fnWrapDeletedAt(req.body)
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
    client.search({
      index: 'wnote',
      body: {
        query: {
          match: {_id: id}
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
