const faunadb = require("faunadb");
const q = faunadb.query;

// CREATE: a Collection // (sql: create a table)
async function createCollection(client) {
  const fql = q.CreateCollection({ name: "user_collection" });
  const resp = await client.query(fql);
  console.log(resp);
  return resp;
}

// CREATE: a INDEX (with no config)
async function createDefaultIndex(client) {
  const fql = q.CreateIndex({
    name: "user_idx_all",
    source: q.Collection("user_collection"),
  });
  const resp = await client.query(fql);
  console.log(resp);
  return resp;
}

module.exports = {
  createCollection,
  createDefaultIndex,
};
