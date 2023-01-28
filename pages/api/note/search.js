const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: process.env.ES_HOST });
import { resolve } from 'path';
import {responseError, responseSuccess} from '../util';
const request = require('request')

function sanitizeValue(value) {
  return value
    .replace(/[<>]/g, ``)
    .replace(/([+-=&|><!(){}[\]^"~*?:\\/])/g, '\\$1')
}

// Find ember text use AI, current skip.
// function findEmberValue(text) {
//     return new Promise((resolve, reject) => {
//         request('http://127.0.0.1:5000/query?key='+text, { json: true }, (err, res, body) => {
//             if (err) {
//                 console.log(err)
//                 reject(err)
//             } else {
//                 console.log('findSimilarTag:body:', body)
//                 resolve(body)
//             }
//         });
//     })
// }

export default async (req, res) => {
  if (req.method === 'POST') {
    let textSearch = sanitizeValue(req.body.text);

    console.log('server:search:', req.body);
    client.search({
      index: 'wnote',
      body: {
        query: {
          function_score: {
            query: {
              bool: {
                must: [
                  {
                    bool: {
                      should: [
                        {match: {rawTextSearch: textSearch}},
                        {wildcard: {'rawTextSearch.keyword': '*'+textSearch+'*'}},
                        {match: {'tags': textSearch}}
                      ]
                    }
                  }
                ],
                filter: [
                  {term: {'userID.keyword': req.body.userID}},
                ],
              },
            },
            script_score: {
              script: {
                source: "Math.log10(doc['views'].value + 1)",
              },
            },
            score_mode: 'sum',
            boost_mode: 'sum',
          },
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
