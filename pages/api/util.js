const fnBuildResponse = (id, body) => {
  var response = {
    _index: 'wnote',
    _id: id,
    _type: 'note',
    _source: body,
  }

  return response
};

const fnWrapDeletedAt = (body) => {
  return Object.assign({}, body, {deletedAt: null});
};

const responseError = (res, error) => {
  let response = {
    code: 400,
    error: error,
  };

  res.status(400).json(response);
};

const responseSuccess = (res, data) => {
  let response = {
    code: 200,
    data: data,
  };

  res.status(200).json(response);
};


export {fnBuildResponse, fnWrapDeletedAt, responseError, responseSuccess}
