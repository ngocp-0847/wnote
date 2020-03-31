const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

function sanitizeValue(value) {
  return value
    .replace(/[<>]/g, ``)
    .replace(/([+-=&|><!(){}[\]^"~*?:\\/])/g, '\\$1')
}

export default (req, res) => {
  if (req.method === 'POST') {
    let textSearch = sanitizeValue(req.body.text);
    console.log('server:search:', req.body, req.body.text, textSearch);
    client.search({
      index: 'wnote',
      body: {
        query: {
          bool: {
            must: [
              {
                bool: {
                  should: [
                    {match: {rawTextSearch: textSearch}},
                    {wildcard: {'rawTextSearch.keyword': '*'+textSearch+'*'}}
                  ]
                }
              }
            ],
            filter: [
              {term: {'userID.keyword': req.body.userID}},
            ],
          }
        },
        from: 0,
        size: 20,
      }
    },function(error, response, status) {
        if (error){
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.status(500).json(error)
          console.log("index error: "+error)
        } else {
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.status(200).json(response.body.hits)
        }
    });
  }
}
