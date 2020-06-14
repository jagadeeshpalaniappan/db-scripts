const faunadb = require("faunadb");
const q = faunadb.query;
const { getId, getObject } = require("./utils");

// https://stackoverflow.com/questions/62109035/how-to-get-documents-that-contain-sub-string-in-faunadb
// https://forums.fauna.com/t/support-wildcard-search-capabilities/140
// https://github.com/fauna-brecht/fwitter/blob/master/src/fauna/setup/searching.js // IMPORTANT

// Option 3: Using 'Trigrams' technique (Ngrams of size 3) // [OFTEN-USED]
// split 'sentence' into (Ngrams of size 3) and store it as binding (computedFileds)
// while querying split 'searchKeyword' into (Ngrams of size 3) and search
// LessStorgae // can search any 3-continuous-char-seq

// CREATE: INDEX
async function createIndexFuzzySearchByNameAndUsername(client) {
  console.log("createIndexFuzzySearchByNameAndUsername: START");

  const fql = q.CreateIndex({
    name: "user_idx_fuzzsearchby_name_username_trigrams",
    source: {
      collection: q.Collection("user_collection"),
      fields: {
        // bindings: computedFields
        strLength: q.Query(
          q.Lambda("user", q.Length(q.Select(["data", "name"], q.Var("user")))) // strLength: user.name.length // helps: to sort better
        ),
        wordpartTrigrams: q.Query(
          q.Lambda(
            "user",
            q.Distinct(
              q.Union(
                // store: both 'name-ngrams' 'username-ngrams'
                q.NGram(
                  q.LowerCase(q.Select(["data", "name"], q.Var("user"))),
                  3,
                  3
                ),
                q.NGram(
                  q.LowerCase(q.Select(["data", "username"], q.Var("user"))),
                  3,
                  3
                )
              )
            )
          )
        ),
      },
    },
    terms: [{ binding: "wordpartTrigrams" }], // searchTerms: wordpartTrigrams (wordparts: only Ngrams of size 3)
    values: [
      { binding: "strLength" }, // sortBy 'strLength' -asc // helps to find 'closestMatch' first in 'searchResults'
      // { binding: "wordpartTrigrams" }, // sortBy 'strLength' -asc // helps to find 'closestMatch' first in 'searchResults'
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
async function getDocsFuzzySearchByNameAndUsername(client, keyword) {
  console.log("getDocsFuzzySearchByNameAndUsername: START");

  const fql = q.Map(
    q.Paginate(
      q.Union(
        q.Map(
          q.NGram(keyword, 3, 3), // split 'searchKeyword' into trigrams
          q.Lambda(
            "ngram",
            q.Match(
              q.Index("user_idx_fuzzsearchby_name_username_trigrams"),
              q.Var("ngram")
            )
          )
        )
      )
    ),
    q.Lambda(["x", "ref"], q.Get(q.Var("ref")))
  );
  const resp = await client.query(fql);
  console.log("getDocsFuzzySearchByNameAndUsername: END");
  return resp;
}

// ----------------------------------

async function fuzzSearch4(client) {
  try {
    // # Step1: createIndex -inorder to query multiple records // searchBy: user.name
    // await createIndexFuzzySearchByNameAndUsername(client);
    // ----------------------------------
    // const keyword = "th"; // doesnt work (need minimum 3 chars)
    const keyword = "Tird"; // atleast give '3 correct charSeq'
    const resp = await getDocsFuzzySearchByNameAndUsername(client, keyword);
    console.log(resp.data.map(getObject));
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
}

module.exports = {
  fuzzSearch4,
};
