const faunadb = require("faunadb");
const q = faunadb.query;
const { getObject } = require("./utils");

// CURSOR-BASED: pagination
// READ: ALL Documents (with Pagination)
async function getDocsWithPagination(client, pagination) {
  console.log("getDocsWithPagination: START");
  const pageConfig = {};
  if (pagination.size) pageConfig.size = pagination.size;
  if (pagination.before) pageConfig.before = pagination.before;
  if (pagination.after) pageConfig.after = pagination.after;

  const fql = q.Map(
    q.Paginate(q.Match(q.Index("user_idx_all")), pageConfig),
    q.Lambda("eachRef", q.Get(q.Var("eachRef")))
  );
  const resp = await client.query(fql);
  console.log("getDocsWithPagination: END");
  return resp;
}

// ----------------------------------

async function pagination(client) {
  try {
    // firstPage: (3 records)
    const pagination1 = { size: 3 };
    const resp1 = await getDocsWithPagination(client, pagination1);
    // console.log(resp1);
    console.log(resp1.data.map(getObject));

    // nextPage: (3 records)
    const pagination2 = { size: 3, after: resp1.after };
    const resp2 = await getDocsWithPagination(client, pagination2);
    // console.log(resp2);
    console.log(resp2.data.map(getObject));

    // prevPage: (3 records)
    const pagination3 = { size: 3, before: resp2.before };
    const resp3 = await getDocsWithPagination(client, pagination3);
    // console.log(resp3);
    console.log(resp3.data.map(getObject));
    // ----------------------------------
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
}

module.exports = {
  pagination,
};
