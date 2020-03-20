const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

export default (req, res) => {
  if (req.method === 'POST') {
    const { userID } = req.body;
    client.search({  
      index: 'wnote',
      type: 'note',
      body: {
        query: {
          match: {userID: userID},
        },
        sort: {
          updatedAt: {order: 'desc'},
        }
      }
    },function (error, response, status) {
        if (error){
          console.log("search error: "+error)
        }
        else {
          console.log("--- Response ---");
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.status(200).json({ data: response.body.hits.hits })
        }
    });
    
  }
}
