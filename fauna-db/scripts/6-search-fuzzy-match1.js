const faunadb = require("faunadb");
const q = faunadb.query;
const { getId, getObject } = require("./utils");

// CREATE: INDEX
async function createIndexFuzzySearchByName(client) {
  console.log("createIndexFuzzySearchByName: START");
  const fql = q.CreateIndex({
    name: "user_idx_fuzzsearchby_name_1",
    source: q.Collection("user_collection"),
    // terms: [{ field: ["data", "name"] }], // searchTerms: can be used only for exact match
    values: [{ field: ["data", "name"] }, { field: ["ref"] }], // sortValues: [user.data.name, ref]
  });
  const resp = await client.query(fql);
  console.log(resp);
  console.log("createIndexFuzzySearchByName: END");
  return resp;
}

// QUERY: INDEX
// This is easy, but the problem is we cannot Paginate on 'searchResults' :(
async function getDocsFuzzySearchByName(client, name) {
  console.log("getDocsFuzzySearchByName: START");
  const fql = q.Let(
    {
      indexFilteredResults: q.Filter(
        q.Paginate(q.Match(q.Index("user_idx_fuzzsearchby_name_1"))),
        q.Lambda(
          ["name", "ref"],
          q.ContainsStr(q.LowerCase(q.Var("name")), q.LowerCase(name))
        )
      ),
      searchResults: q.Map(
        q.Var("indexFilteredResults"),
        q.Lambda(["name", "ref"], q.Get(q.Var("ref")))
      ),
    },
    q.Var("searchResults")
  );
  const resp = await client.query(fql);
  console.log("getDocsFuzzySearchByName: END");
  return resp;
}

// ----------------------------------

async function search2(client) {
  try {
    // # Step1: createIndex -inorder to query multiple records // searchBy: user.name
    // await createIndexFuzzySearchByName(client);
    // ----------------------------------
    const resp = await getDocsFuzzySearchByName(client, "Third");
    // console.log(resp);
    console.log(resp.data.map(getObject));
    // ----------------------------------
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
}

module.exports = {
  search2,
};
