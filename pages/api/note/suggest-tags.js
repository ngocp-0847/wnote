import client from '../../../lib/es';
import {responseError, responseSuccess} from '../util';
import withPassport from '../../../lib/withPassport';

async function suggestTags(user, tags) {
  console.log('suggestTags:user:tag', tags)
  return client.search({
    index: 'tags',
    body: {
      query: {
        bool: {
          should: [
            {match: {_id: tags}},
            {regexp: 
              {key: {
                value: '.*'+tags+'.*',
                flags: 'ALL'
              }}
            }
          ]
        }
      },
      from: 0,
      size: 5,
    }
  });
}

export default withPassport(async (req, res) => {
  if (req.method === 'GET') {
    try {
      let tags = await suggestTags(req.user, req.query.search);
      responseSuccess(res, {tags: tags});
    } catch (e) {
      console.log('suggest-tags:errors:', e)
      responseError(res, e);
    }
  }
})
