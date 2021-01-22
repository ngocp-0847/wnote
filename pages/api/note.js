const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: process.env.ES_HOST })
import {responseError, responseSuccess} from './util';

export default (req, res) => {
  if (req.method === 'POST') {
    const { userID } = req.body;
    console.log('list note:', userID)
    client.search({
      index: 'wnote',
      body: {
        query: {
          bool: {
            must: [
              {match: {userID: userID}},
            ],
            must_not: {
              exists: {
                field: 'deletedAt'
              }
            }
          }
        },
        sort: {
          updatedAt: {order: 'desc'},
        },
        from: 0,
        size: 20,
      }
    },function (error, response, status) {
      console.log('after search:', error, response, status);
        if (error) {
          responseError(res, error);
          console.log("search error: "+error)
        }
        else {
          // console.log("--- Response ---", response.body.hits.hits);
          responseSuccess(res, response.body.hits.hits);
        }
    });

  }
}
