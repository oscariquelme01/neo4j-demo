const neo4j = require("neo4j-driver");

const uri = "neo4j://localhost";
const user = "neo4j";
const password = "Biblioteca";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  disableLosslessIntegers: true,
});

async function fetchQueryResult(query, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    const tmp = result.records.map((record) => {
      return record.toObject();
    });
    return tmp;
  } catch (error) {
    console.error("Error fetching data from Neo4j", error);
  } finally {
    await session.close();
  }
}

module.exports = { fetchQueryResult };
