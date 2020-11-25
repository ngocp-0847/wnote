import client from '../../../lib/es';
import {responseError, responseSuccess} from '../util';
import { v4 as uuidv4 } from 'uuid';
import withPassport from '../../../lib/withPassport';
import { isEmpty } from 'lodash';

async function searchPinned(userObj) {
    console.log('searchPinned:', userObj)

    let idsPinned = userObj._source.pinned ? userObj._source.pinned : [];
    console.log('searchPinned:idsPinned', idsPinned)
    if (!isEmpty(idsPinned)) {
        return client.search({
            index: 'wnote',
            body: {
            query: {
                bool: {
                must: [
                    {match: {userID: userObj._source.userGeneId}},
                    {terms: {_id: idsPinned}}
                ],
                must_not: {
                    exists: {
                    field: 'deletedAt'
                    }
                }
                }
            },
            sort: {
                createdAt: {order: 'desc'}
            },
            }
        });
    } else {
        return false;
    }
}

export default withPassport(async (req, res) => {
    if (req.method === 'GET') {
        try {
            let notesPinned = await searchPinned(req.user);
            console.log('notesPinned:', notesPinned)
            responseSuccess(res, {notesPinned: notesPinned});
        } catch (e) {
            responseError(res, 'fail');
        }
    }
});
