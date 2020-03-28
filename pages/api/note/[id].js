const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

const fnBuildResponse = (id, body) => {
  var response = {
    _index: 'wnote',
    _id: id,
    _type: 'note',
    _source: body,
  }

  return response
}

export default (req, res) => {
  if (req.method === 'POST') {
    const { id } = req.query;
    client.index({
      index: 'wnote',
      id: id,
      type: 'note',
      body: req.body
    },function(error, response, status) {
        if (error){
          console.log("index error: "+error)
        } else {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          try {
            var body = JSON.parse(response.meta.request.params.body);
          } catch (e) {
            res.status(400).json('fail')
          }

          body = fnBuildResponse(id, body)
          res.status(200).json(body)
        }
    });
  } else if (req.method == 'GET') {
    const { id } = req.query;
    client.search({
      index: 'wnote',
      body: {
        query: {
          match: {_id: id}
        },
      }
    },function(error, response, status) {
        if (error){
          console.log("index error: "+error)
        } else {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.status(200).json(response.body.hits)
        }
    });
  }
}
