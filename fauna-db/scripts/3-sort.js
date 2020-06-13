const faunadb = require("faunadb");
const q = faunadb.query;
const { getId, getObject } = require("./utils");

// CREATE: a INDEX (with no config)
async function createIndexSortByName(client) {
  console.log("getDocs: START");
  const fql = q.CreateIndex({
    name: "user_idx_sortby_name",
    source: q.Collection("user_collection"),
    values: [{ field: ["data", "name"] }, { field: ["ref"] }], // sortValues: [user.data.name, ref]
  });
  const resp = await client.query(fql);
  console.log(resp);
  console.log("getDocs: END");
  return resp;
}

// READ: ALL Documents // (sql: selectAllRows)
async function getDocsSortByName(client) {
  console.log("getDocs: START");
  const fql = q.Map(
    q.Paginate(q.Match(q.Index("user_idx_sortby_name"))),
    q.Lambda(["x", "eachRef"], q.Get(q.Var("eachRef")))
  );
  const resp = await client.query(fql);
  console.log("getDocs: END");
  return resp;
}

// ----------------------------------

// CREATE: a INDEX (with no config)
async function createIndexSortByAgeDesc(client) {
  console.log("createIndexSortByAgeDesc: START");
  const fql = q.CreateIndex({
    name: "user_idx_sortby_age_desc",
    source: q.Collection("user_collection"),
    values: [{ field: ["data", "age"], reverse: true }, { field: ["ref"] }], // sortValues: [user.data.age, ref]
  });
  const resp = await client.query(fql);
  console.log(resp);
  console.log("createIndexSortByAgeDesc: END");
  return resp;
}

// READ: ALL Documents // (sql: selectAllRows)
async function getDocsSortByAgeDesc(client) {
  console.log("getDocsSortByAgeDesc: START");
  const fql = q.Map(
    q.Paginate(q.Match(q.Index("user_idx_sortby_age_desc"))),
    q.Lambda(["x", "eachRef"], q.Get(q.Var("eachRef")))
  );
  const resp = await client.query(fql);
  console.log("getDocsSortByAgeDesc: END");
  return resp;
}

// ----------------------------------

async function sort(client) {
  try {
    // # Step1: createIndex -inorder to query multiple records (in sorted order) // sortBy: user.name
    // const resp = await createIndexSortByName(client);
    // console.log(resp);
    // ----------------------------------
    // const resp = await getDocsSortByName(client);
    // console.log(resp);
    // console.log(resp.data.map(getObject));
    // ----------------------------------
    // # Step2: createIndex -inorder to query multiple records (in sorted order) // sortBy: user.age
    // const resp = await createIndexSortByAgeDesc(client);
    // console.log(resp);
    // ----------------------------------
    // const resp = await getDocsSortByAgeDesc(client);
    // console.log(resp);
    // console.log(resp.data.map(getObject));
    // ----------------------------------
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
}

module.exports = {
  sort,
};
