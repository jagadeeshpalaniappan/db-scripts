const faunadb = require("faunadb");
const q = faunadb.query;
const { getId, getObject } = require("./utils");

// https://stackoverflow.com/questions/62109035/how-to-get-documents-that-contain-sub-string-in-faunadb
// https://forums.fauna.com/t/support-wildcard-search-capabilities/140

// Option 2: split 'sentence' into 'words' and store it as binding (computedFileds) and search

function SplitIntoWords(string, delimiter = " ") {
  return q.If(
    q.Not(q.IsString(string)),
    q.Abort("SplitString only accept strings"),
    q.Map(
      q.FindStrRegex(string, q.Concat(["[^\\", delimiter, "]+"])),
      q.Lambda("res", q.LowerCase(q.Select(["data"], q.Var("res"))))
    )
  );
}

// CREATE: INDEX
async function createIndexFuzzySearchByNameWords(client) {
  console.log("createIndexFuzzySearchByNameWords: START");
  const fql = q.CreateIndex({
    name: "user_idx_fuzzsearchby_name_words1",
    source: {
      collection: q.Collection("user_collection"),
      fields: {
        // bindings: computedFields
        words: q.Query(
          q.Lambda(
            "user",
            SplitIntoWords(q.Select(["data", "name"], q.Var("user"))) // each word
          )
        ),
      },
    },
    terms: [{ binding: "words" }], // searchTerms: can be used only for exact match // Yes, here we're using 'computedField: words' -for search
    // values: [{ binding: "words" }], // just for debuging
  });
  const resp = await client.query(fql);
  console.log(resp);
  console.log("createIndexFuzzySearchByNameWords: END");
  return resp;
}

// QUERY: INDEX
// tradeoff is we can search only "fullword"
// TODO: fullword is not searchable
async function getDocsFuzzySearchByNameWords(client, name) {
  console.log("getDocsFuzzySearchByNameWords: START");
  const fql = q.Map(
    q.Paginate(
      q.Match(q.Index("user_idx_fuzzsearchby_name_words"), q.LowerCase(name))
    ),
    q.Lambda(["eachRef"], q.Get(q.Var("eachRef")))
  );
  const resp = await client.query(fql);
  console.log("getDocsFuzzySearchByNameWords: END");
  return resp;
}

// ----------------------------------

async function fuzzSearch2(client) {
  try {
    // # Step1: createIndex -inorder to query multiple records // searchBy: user.name
    await createIndexFuzzySearchByNameWords(client);
    // ----------------------------------
    // const resp = await getDocsFuzzySearchByNameWords(client, "third user");
    // console.log(resp.data.map(getObject));
    // ----------------------------------
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
}

module.exports = {
  fuzzSearch2,
};
