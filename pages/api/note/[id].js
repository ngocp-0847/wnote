const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

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
          res.status(200).json(response.meta.request.params.body)
        }
    });
  }
}
