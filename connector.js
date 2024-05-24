const neo4j = require('neo4j-driver');

const uri = 'neo4j://localhost';
const user = 'neo4j'; 
const password = 'Biblioteca';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
console.log("buenas")

async function fetchQueryResult(query, params = {}) {
    console.log("hola")
    const session = driver.session();
    try {
        const result = await session.run(query, params);
        const tmp = result.records.map(record => {
            console.log(record)
            return record.toObject()
        });
        console.log(tmp)
        return tmp
    } catch (error) {
        console.error('Error fetching data from Neo4j', error);
    } finally {
        await session.close();
    }
}

module.exports = { fetchQueryResult };
