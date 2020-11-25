import client from '../../../../lib/es';
import {responseError, responseSuccess} from '../../util';
import { v4 as uuidv4 } from 'uuid';
import withPassport from '../../../../lib/withPassport';

async function savePinned(userObj, noteID) {
    console.log('savePinned:', userObj, noteID)
    return client.update({
        index: 'users',
        type: '_doc',
        id: userObj._id,
        body: {
            script: {
                lang: 'painless',
                source: `
                    if (ctx._source.pinned == null) {
                        ctx._source.pinned = [];
                    }
                    def targets = ctx._source.pinned.findAll(it -> {
                        if (it.id == params.note.id) {
                            return true;
                        }
                        return false;
                    });
                    if (targets.length == 0) {
                        ctx._source.pinned.add(params.note);
                    }
                `,
                params: {
                    note: {
                        id: noteID,
                        order: 1,
                    },
                }
            }
        }
    });
}

async function unSavePinned(userObj, noteID) {
    console.log('unSavePinned:', userObj, noteID)
    return client.update({
        index: 'users',
        type: '_doc',
        id: userObj._id,
        body: {
            script: {
                lang: 'painless',
                source: `
                    def targets = ctx._source.pinned.findAll(it -> {
                        if (it.id != params.note.id) {
                            return true;
                        }
                        return false;
                    });
                    ctx._source.pinned = targets;
                `,
                params: {
                    note: {
                        id: noteID,
                        order: 1,
                    },
                }
            }
        }
    });
}

export default withPassport(async (req, res) => {
    if (req.method === 'POST') {
        try {
            console.log('req.body.action', req.body.action);
            let result = null;
            if (req.body.action) {
                result = await savePinned(req.user, req.query.id);
            } else {
                result = await unSavePinned(req.user, req.query.id);
            }
            console.log('notesPinned:', result)
            responseSuccess(res, result);
        } catch (e) {
            responseError(res, e);
        }
    }
});
