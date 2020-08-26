const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: process.env.ES_HOST });
import {responseError, responseSuccess} from '../util';

function sanitizeValue(value) {
  return value
    .replace(/[<>]/g, ``)
    .replace(/([+-=&|><!(){}[\]^"~*?:\\/])/g, '\\$1')
}

export default (req, res) => {
  if (req.method === 'POST') {
    let textSearch = sanitizeValue(req.body.text);
    console.log('server:search:', req.body, req.body.text, textSearch);
    client.search({
      index: 'wnote',
      body: {
        query: {
          bool: {
            must: [
              {
                bool: {
                  should: [
                    {match: {rawTextSearch: textSearch}},
                    {wildcard: {'rawTextSearch.keyword': '*'+textSearch+'*'}}
                  ]
                }
              }
            ],
            filter: [
              {term: {'userID.keyword': req.body.userID}},
            ],
          }
        },
        from: 0,
        size: 20,
      }
    },function(error, response, status) {
        if (error){
          responseError(res, error);
          console.log("index error: ", error);
        } else {
          responseSuccess(res, response.body.hits);
        }
    });
  }
}
