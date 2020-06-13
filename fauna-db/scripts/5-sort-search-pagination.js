const faunadb = require("faunadb");
const q = faunadb.query;
const { getId, getObject } = require("./utils");

// CREATE: INDEX
async function createIndexSearchByNameSortByAge(client) {
  console.log("createIndexSearchByNameSortByAge: START");
  const fql = q.CreateIndex({
    name: "user_idx_searchby_name_sortby_age",
    source: q.Collection("user_collection"),
    terms: [{ field: ["data", "name"] }], // searchTerms: [user.data.name]
    values: [{ field: ["data", "age"], reverse: true }, { field: ["ref"] }], // sortValues: [user.data.age, ref]
  });
  const resp = await client.query(fql);
  console.log(resp);
  console.log("createIndexSearchByNameSortByAge: END");
  return resp;
}

// QUERY: INDEX
async function getDocsSearchByNameSortByAge(client, name) {
  console.log("getDocsSearchByNameSortByAge: START");
  const fql = q.Map(
    q.Paginate(q.Match(q.Index("user_idx_searchby_name_sortby_age"), name)),
    q.Lambda(["x", "eachRef"], q.Get(q.Var("eachRef")))
  );
  const resp = await client.query(fql);
  console.log("getDocsSearchByNameSortByAge: END");
  return resp;
}

// QUERY: INDEX
async function getDocsSearchByNameSortByAgePagination(
  client,
  name,
  pagination
) {
  console.log("getDocsSearchByNameSortByAgePagination: START");
  const pageConfig = {};
  if (pagination.size) pageConfig.size = pagination.size;
  if (pagination.before) pageConfig.before = pagination.before;
  if (pagination.after) pageConfig.after = pagination.after;
  const fql = q.Map(
    q.Paginate(
      q.Match(q.Index("user_idx_searchby_name_sortby_age"), name),
      pageConfig
    ),
    q.Lambda(["x", "eachRef"], q.Get(q.Var("eachRef")))
  );
  const resp = await client.query(fql);
  console.log("getDocsSearchByNameSortByAgePagination: END");
  return resp;
}

// ----------------------------------

async function searchAndSort(client) {
  try {
    // # Step1: createIndex -inorder to query multiple records // searchBy: user.name & sortBy: user.age
    // await createIndexSearchByNameSortByAge(client);
    // ----------------------------------
    // const resp = await getDocsSearchByNameSortByAge(client, "Third User");
    // console.log(resp.data.map(getObject));
    // ----------------------------------
    // const pagination1 = { size: 1 };
    // const resp1 = await getDocsSearchByNameSortByAgePagination(
    //   client,
    //   "Third User",
    //   pagination1
    // );
    // console.log(resp1.data.map(getObject));
    // // ----------------------------------
    // const pagination2 = { size: 3, after: resp1.after };
    // const resp2 = await getDocsSearchByNameSortByAgePagination(
    //   client,
    //   "Third User",
    //   pagination2
    // );
    // console.log(resp2.data.map(getObject));
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
}

module.exports = {
  searchAndSort,
};
