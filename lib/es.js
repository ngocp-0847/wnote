const { Client } = require('@elastic/elasticsearch');
export default new Client({ node: process.env.ES_HOST });