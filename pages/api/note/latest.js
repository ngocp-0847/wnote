const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

export default (req, res) => {
  if (req.method === 'POST') {
    const { id } = req.query;
    client.search({
      index: 'wnote',
      body: {
        query: {
          match: {userID: req.body.userID}
        },
        from: 0,
        size: 1,
        sort: {
          createdAt: {order: 'desc'}
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
