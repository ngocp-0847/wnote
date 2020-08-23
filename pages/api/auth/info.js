import withPassport from '../../../lib/withPassport'

import {responseSuccess} from '../util';

const handler = async (req, res) => {
    console.log('info:user:', req.user);
    if (req.user) {
        responseSuccess(res, req.user);
    } else {
        responseSuccess(res, false);
    }
}

export default withPassport(handler)
