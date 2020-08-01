import withPassport from '../../../lib/withPassport'
import client from '../../../lib/es';
import { v4 as uuidv4 } from 'uuid';
import {responseError, responseSuccess, fnBuildResponse, fnWrapDeletedAt} from '../util';

/**
 * Save user if not exists.
 * @param {} body 
 */
async function querySaveUser(githubID) {
    const userGeneId = uuidv4();
    return client.index({
        index: 'users',
        id: uuidv4(),
        body: {userID: githubID, userGeneId: userGeneId, type: 'github'}
    });
}
  
/**
 * Find user by github.userID
 * @param {*} userID 
 */
async function findOne(userID) {
    return client.search({
        index: 'users',
        body: {
            query: {
                match: { userID: userID }
            }
        }
    })
}

const handler = async (req, res) => {
    if (req.user) {
        let githubID = req.user.id;
        let user = await findOne(githubID);
        if (user == undefined || user.body.hits.total == 0) {
            await querySaveUser(githubID);            
            user = await findOne(githubID);
            responseSuccess(res, user.body.hits.hits[0]);
        } else {
            responseSuccess(res, user.body.hits.hits[0]);
        }
    } else {
        responseSuccess(res, false);
    }
}

export default withPassport(handler)
