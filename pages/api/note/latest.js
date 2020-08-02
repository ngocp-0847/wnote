import client from '../../../lib/es';
import {responseError, responseSuccess, fnBuildResponse, fnWrapDeletedAt} from '../util';
import { v4 as uuidv4 } from 'uuid';
import withPassport from '../../../lib/withPassport';

/**
 * Save user if not exists.
 * @param {} body 
 */
async function querySaveUser(body) {
  const {userID} = body;
  const userGeneId = uuidv4();
  return client.index({
    index: 'users',
    id: uuidv4(),
    body: {userID: userID, userGeneId: userGeneId}
  });
}

async function searchLastest(userObj) {
  return client.search({
    index: 'wnote',
    body: {
      query: {
        bool: {
          must: [
            {match: {userID: userObj._source.userGeneId}}
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
  });
}

export default withPassport(async (req, res) => {
  if (req.method === 'POST') {
    let noteLatest = await searchLastest(req.user);
    responseSuccess(res, {noteLatest: noteLatest, userObj: req.user});
  }
})
