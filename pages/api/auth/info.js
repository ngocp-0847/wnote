import withPassport from '../../../lib/withPassport'
import client from '../../../lib/es';
import { v4 as uuidv4 } from 'uuid';
import {responseError, responseSuccess, fnBuildResponse, fnWrapDeletedAt} from '../util';

const handler = async (req, res) => {
    console.log('info:user:', req.user);
    if (req.user) {
        responseSuccess(res, req.user);
    } else {
        responseSuccess(res, false);
    }
}

export default withPassport(handler)
