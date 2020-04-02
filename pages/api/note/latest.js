const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })
import {responseError, responseSuccess, fnBuildResponse, fnWrapDeletedAt} from '../util';

export default (req, res) => {
  if (req.method === 'POST') {
    const { id } = req.query;
    client.search({
      index: 'wnote',
      body: {
        query: {
          bool: {
            must: [
              {match: {userID: req.body.userID}}
            ],
            must_not: {
              exists: {
                field: 'deletedAt'
              }
            }
          }
        },
        from: 0,
        size: 1,
        sort: {
          createdAt: {order: 'desc'}
        },
      }
    },function(error, response, status) {
        if (error){
          responseError(res, error);
          console.log("index error: "+error)
        } else {
          responseSuccess(res, response.body.hits);
        }
    });
  }
}
