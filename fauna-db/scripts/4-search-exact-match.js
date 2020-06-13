const faunadb = require("faunadb");
const q = faunadb.query;
const { getId, getObject } = require("./utils");

// CREATE: INDEX
async function createIndexSearchByName(client) {
  console.log("createIndexSearchByName: START");
  const fql = q.CreateIndex({
    name: "user_idx_searchby_name",
    source: q.Collection("user_collection"),
    terms: [{ field: ["data", "name"] }], // searchTerms: [user.data.name]
  });
  const resp = await client.query(fql);
  console.log(resp);
  console.log("createIndexSearchByName: END");
  return resp;
}

// QUERY: INDEX
async function getDocsSearchByName(client, name) {
  console.log("getDocsSearchByName: START");
  const fql = q.Map(
    q.Paginate(q.Match(q.Index("user_idx_searchby_name"), name)),
    q.Lambda(["eachRef"], q.Get(q.Var("eachRef")))
  );
  const resp = await client.query(fql);
  console.log("getDocsSearchByName: END");
  return resp;
}

// ----------------------------------

// CREATE: INDEX
async function createIndexSearchByUserName(client) {
  console.log("createIndexSearchByUserName: START");
  const fql = q.CreateIndex({
    name: "user_idx_searchby_username",
    source: q.Collection("user_collection"),
    terms: [{ field: ["data", "username"] }], // searchTerms: [user.data.username]
  });
  const resp = await client.query(fql);
  console.log(resp);
  console.log("createIndexSearchByUserName: END");
  return resp;
}

// QUERY: INDEX
async function getDocsSearchByUserName(client, username) {
  console.log("getDocsSearchByName: START");
  const fql = q.Map(
    q.Paginate(q.Match(q.Index("user_idx_searchby_username"), username)),
    q.Lambda(["eachRef"], q.Get(q.Var("eachRef")))
  );
  const resp = await client.query(fql);
  console.log("getDocsSearchByName: END");
  return resp;
}

// ----------------------------------

async function search1(client) {
  try {
    // # Step1: createIndex -inorder to query multiple records // searchBy: user.name
    // await createIndexSearchByName(client);
    // ----------------------------------
    // const resp = await getDocsSearchByName(client, "Third User");
    // console.log(resp.data.map(getObject));
    // ----------------------------------
    // # Step2: createIndex -inorder to query multiple records // searchBy: user.username
    // await createIndexSearchByUserName(client);
    // ----------------------------------
    // const resp = await getDocsSearchByUserName(client, "three");
    // console.log(resp.data.map(getObject));
    // ----------------------------------
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
}

module.exports = {
  search1,
};
