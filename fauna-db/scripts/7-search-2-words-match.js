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
    name: "user_idx_searchby_name_username_words",
    source: {
      collection: q.Collection("user_collection"),
      fields: {
        // bindings: computedFields
        words: q.Query(
          q.Lambda(
            "user",
            q.Distinct(
              q.Union(
                // store: { words: [full-name, full-username, 'name-all-words' 'username-all-words'] }
                [q.LowerCase(q.Select(["data", "name"], q.Var("user")))], // full-name
                [q.LowerCase(q.Select(["data", "username"], q.Var("user")))], // full-username
                SplitIntoWords(q.Select(["data", "name"], q.Var("user"))), // name-all-words,
                SplitIntoWords(q.Select(["data", "username"], q.Var("user"))) // username-all-words
              )
            )
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
async function getDocsFuzzySearchByNameWords(client, keyword) {
  console.log("getDocsFuzzySearchByNameWords: START");
  const fql = q.Map(
    q.Paginate(
      q.Match(
        q.Index("user_idx_searchby_name_username_words"),
        q.LowerCase(keyword)
      )
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
    // await createIndexFuzzySearchByNameWords(client);
    // ----------------------------------
    // const keyword = "third";
    // const keyword = "third user";
    // const keyword = "three";
    const resp = await getDocsFuzzySearchByNameWords(client, keyword);
    console.log(resp.data.map(getObject));
    // ----------------------------------
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
}

module.exports = {
  fuzzSearch2,
};
