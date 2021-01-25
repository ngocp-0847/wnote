const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: process.env.ES_HOST })
import {responseError, responseSuccess} from './util';

export default async (req, res) => {
  if (req.method === 'POST') {
    const { userID, _scroll_id } = req.body;
    console.log('List note:userID:', userID);
    if (_scroll_id) {
        console.log('List note:scroll_id:', _scroll_id);
        try {
            let response = await client.scroll({
                scrollId: _scroll_id,
                scroll: '30s'
            });
    
            if (response.statusCode == 200) {
                responseSuccess(res, {hits: response.body.hits.hits, _scroll_id: response.body._scroll_id});
            } else {
                responseError(res, 'Server errors');
            }
        } catch (e) {
            responseError(res, 'Server errors');
        }
    } else {
      client.search({
        scroll: '30s',
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
          size: 10,
        }
      },function (error, response, status) {
        console.log('after search:', error, response, status);
          if (error) {
            responseError(res, error);
            console.log("search error: "+error)
          }
          else {
            console.log("--- Response note list: ---", response);
            responseSuccess(res, {hits: response.body.hits.hits, _scroll_id: response.body._scroll_id});
          }
      });
    }
  }
}
