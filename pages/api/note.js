const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: process.env.ES_HOST })
import {responseError, responseSuccess, fnBuildResponse, fnWrapDeletedAt} from './util';

export default (req, res) => {
  if (req.method === 'POST') {
    const { userID } = req.body;
    client.search({
      index: 'wnote',
      type: 'note',
      body: {
        query: {
          bool: {
            must: [
              {match: {userID: userID}}
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
        if (error){
          responseError(res, error);
          console.log("search error: "+error)
        }
        else {
          console.log("--- Response ---");
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.status(200).json({ data: response.body.hits.hits })
        }
    });

  }
}
