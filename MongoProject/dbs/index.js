const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost';

function connect()
{
 return MongoClient.connect(url, { useNewUrlParser: true });
}

module.exports = async function()
{
let databases = await Promise.all([connect()])
return{
	production:databases[0]
}
}