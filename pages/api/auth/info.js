import withPassport from '../../../lib/withPassport'

import {responseSuccess} from '../util';

const handler = async (req, res) => {
    req.session.views = (req.session.views || 0) + 1
    console.log('info:user:', req.user, req.session, req.session.views);
    if (req.user) {
        responseSuccess(res, req.user);
    } else {
        responseSuccess(res, false);
    }
}

export default withPassport(handler)
