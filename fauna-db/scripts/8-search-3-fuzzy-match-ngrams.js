const faunadb = require("faunadb");
const q = faunadb.query;
const { getId, getObject } = require("./utils");

// https://stackoverflow.com/questions/62109035/how-to-get-documents-that-contain-sub-string-in-faunadb
// https://forums.fauna.com/t/support-wildcard-search-capabilities/140
// https://github.com/fauna-brecht/fwitter/blob/master/src/fauna/setup/searching.js // IMPORTANT

// Option 3: Using 'Ngrams' technique
// split 'sentence' into 'Ngrams' and store it as binding (computedFileds) and search
/*
- When it comes to searching it's all a tradeoff of performance and storage 
- and in FaunaDB users can choose their tradeoff. 
- Note that in the previous approach, 
  - we stored each word separately, 
  - with Ngrams we'll split words even further to provide some form of fuzzy matching. 
- The downside is that the index size might become very big if you make the wrong choice 
  (this is equally true for search engines, hence why they let you define different algorithms).
*/

function GenerateWordParts(inputWord) {
  return q.Distinct(
    q.Let(
      {
        indexes: q.Map(
          // Reduce this array if you want less ngrams per word.
          // Setting it to [ 0 ] would only create the word itself, Setting it to [0, 1] would result in the word itself
          // and all ngrams that are one character shorter, etc..
          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          q.Lambda("eachIdx", q.Subtract(q.Length(inputWord), q.Var("eachIdx"))) // for 'smallerText' there might be negative vals generated, will cleanup in step2
        ),
        indexesFiltered: q.Filter(
          q.Var("indexes"),
          q.Lambda("eachIdx", q.GT(q.Var("eachIdx"), 0)) // cleanup: filter out negative indexes
        ),
        ngramsArray: q.Map(
          q.Var("indexesFiltered"),
          q.Lambda(
            "eachIdx",
            q.NGram(q.LowerCase(inputWord), q.Var("eachIdx"), q.Var("eachIdx"))
          )
        ),
      },
      q.Var("ngramsArray")
    )
  );
}

// CREATE: INDEX
async function createIndexFuzzySearchByNameAndUsername(client) {
  console.log("createIndexFuzzySearchByNameAndUsername: START");

  const fql = q.CreateIndex({
    name: "user_idx_fuzzsearchby_name_username_ngrams",
    source: {
      collection: q.Collection("user_collection"),
      fields: {
        // bindings: computedFields
        strLength: q.Query(
          q.Lambda("user", q.Length(q.Select(["data", "name"], q.Var("user")))) // strLength: user.name.length // helps: to sort better
        ),
        wordparts: q.Query(
          q.Lambda(
            "user",
            q.Union(
              // store: both 'name-ngrams' 'username-ngrams'
              q.Union(
                GenerateWordParts(q.Select(["data", "name"], q.Var("user")))
              ),
              q.Union(
                GenerateWordParts(q.Select(["data", "username"], q.Var("user")))
              )
            )
          )
        ),
      },
    },
    terms: [{ binding: "wordparts" }], // searchTerms: can be used only for exact match // Yes, here we're using 'computedField: wordparts' -for search
    values: [
      { binding: "strLength" }, // sortBy 'strLength' -asc // helps to find 'closestMatch' first in 'searchResults'
      { field: ["ref"] },
    ],
    serialized: false, // serialized is not necessary (unless we care about 'consistency' in search)
  });
  const resp = await client.query(fql);
  console.log(resp);
  console.log("createIndexFuzzySearchByNameAndUsername: END");
  return resp;
}

// QUERY: INDEX
// tradeoff is we can search only "fullword"
// TODO: fullword is not searchable
async function getDocsFuzzySearchByNameAndUsername(client, name) {
  console.log("getDocsFuzzySearchByNameAndUsername: START");
  const fql = q.Map(
    q.Paginate(
      q.Match(
        q.Index("user_idx_fuzzsearchby_name_username_ngrams"),
        q.LowerCase(name)
      )
    ),
    q.Lambda(["x", "ref"], q.Get(q.Var("ref")))
  );
  const resp = await client.query(fql);
  console.log("getDocsFuzzySearchByNameAndUsername: END");
  return resp;
}

// ----------------------------------

async function fuzzSearch3(client) {
  try {
    // # Step1: createIndex -inorder to query multiple records // searchBy: user.name
    // await createIndexFuzzySearchByNameAndUsername(client);
    // ----------------------------------
    // const resp = await getDocsFuzzySearchByNameAndUsername(client, "th");
    // console.log(resp.data.map(getObject));
    // ----------------------------------

    const resp = await jagPlayground(client);
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
}

module.exports = {
  fuzzSearch3,
};

// ngram playground
/*
async function jagPlayground(client) {
  const str = "inputWord";
  const min = 2;
  const max = 3;
  const fql1 = q.NGram(q.LowerCase(str), min, max);
  const resp = await client.query(fql1);
  console.log(resp);
  return resp;
}
*/
