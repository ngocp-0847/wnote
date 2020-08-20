import withPassport from '../../../lib/withPassport'

import {responseSuccess} from '../util';

const handler = async (req, res) => {
    req.logout();
    res.writeHead(301, {
        Location: '/w/login'
    });
    res.end();
}

export default withPassport(handler)
