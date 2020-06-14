const faunadb = require("faunadb");
const q = faunadb.query;
const faunadbLib = require("faunadb-fql-lib");
const xq = faunadbLib.query;
const { getId, getObject } = require("./utils");

// https://stackoverflow.com/questions/62109035/how-to-get-documents-that-contain-sub-string-in-faunadb
// https://forums.fauna.com/t/support-wildcard-search-capabilities/140

// Option 2: split 'sentence' into 'words' and store it as binding (computedFileds) and search
// StartsWithSearch

/*
function CustomStrGenerate(str) {
  const myArr = [];
  for (let i = 0; i < str.length; i++) {
    myArr.push(str.substr(0, i + 1));
  }
  return myArr;
}

async function main(client) {
  const fql = q.Let(
    {
      words: ["Jagadeesh", "Palaniappan"],
      results: q.Map(
        q.Var("words"),
        q.Lambda("eachWord", CustomStrGenerate(q.Var("eachWord")))
      ),
    },
    q.Var("results")
  );
  const resp = await client.query(fql);
  console.log(resp);
}

console.log("##", CustomStrGenerate("Jagadeesh"));
console.log("##", CustomStrGenerate("Palaniappan"));
*/

function GenerateKeyword1(inputWord) {
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

// SplitIntoWords
function GenerateKeywords(string, delimiter = " ") {
  return q.If(
    q.Not(q.IsString(string)),
    q.Abort("SplitString only accept strings"),
    q.Map(
      q.FindStrRegex(q.LowerCase(string), q.Concat(["[^\\", delimiter, "]+"])),
      q.Lambda("res", q.Select(["data"], q.Var("res")))
    )
  );
}

function GenerateAllKeywords(user, searchKeys) {
  const keys =
    searchKeys && searchKeys.length
      ? searchKeys
      : xq.ObjectKeys(q.Select(["data"], user));

  const values = q.Map(
    keys,
    q.Lambda("key", q.Select(["data", q.Var("key")], user))
  );
  const valuesStrOnly = q.Filter(
    values,
    q.Lambda("v", q.Or(q.IsString(q.Var("v")), q.IsNumber(q.Var("v"))))
  );
  const keywordsArr = q.Map(
    valuesStrOnly,
    q.Lambda("value", GenerateKeywords(q.ToString(q.Var("value"))))
  );
  return q.Distinct(q.Union(keywordsArr));
}

function getIdxConfig(config) {
  const {
    collectionName,
    searchFields,
    sortField,
    serialized,
    prefix,
  } = config;

  const idxConfig = {
    name: `${prefix}${collectionName}_idx`,
    source: { collection: q.Collection(collectionName) },
    serialized,
  };

  if (searchFields) {
    let canSearch = false;
    if (searchFields.length > 0 && searchFields.constructor === Array) {
      idxConfig.name = idxConfig.name + `_searchBy@${searchFields.join(",")}`;
      canSearch = true;
    } else {
      idxConfig.name = idxConfig.name + "_searchBy@all";
      canSearch = true;
    }

    if (canSearch) {
      idxConfig.terms = [{ binding: "keywords" }]; // searchTerms: keywords
      idxConfig.source.fields = {
        // bindings: generateKeywords
        keywords: q.Query(
          q.Lambda("user", GenerateAllKeywords(q.Var("user"), searchFields))
        ),
      };
    }
  }
  if (sortField && sortField.constructor === Array && sortField.length > 0) {
    const sortFieldPath =
      sortField[0] === "data" ? sortField.slice(1) : sortField;
    idxConfig.name = idxConfig.name + `_sortBy@${sortFieldPath.join(".")}`;
    idxConfig.values = [
      { field: sortField }, // sortBy 'user.name'
      { field: ["ref"] },
    ];
  }

  return idxConfig;
}

function getIdxName(input) {
  const { collectionName, searchKeyword, sortBy, prefix } = input;
  let idxName = `${prefix}${collectionName}_idx`;
  if (searchKeyword && searchKeyword.length > 0) {
    idxName = idxName + "_searchBy@all";
  }
  if (sortBy && sortBy.length > 0) {
    const sortFieldPath = sortBy.split(".");
    idxName = idxName + `_sortBy@${sortFieldPath.join(".")}`;
  }

  return idxName;
}

// CREATE: INDEX
async function createIndexFuzzySearch(client, config) {
  console.log("createIndexFuzzySearch: START");
  const idxConfig = getIdxConfig(config);
  console.log("idxConfig");
  console.log(idxConfig);
  const fql = q.CreateIndex(idxConfig);
  const resp = await client.query(fql);
  console.log(resp);
  console.log("createIndexFuzzySearch: END");
  return resp;
}

// QUERY: INDEX
// tradeoff is we can search only "fullword"
// TODO: fullword is not searchable
async function getDocsFuzzySearch(client, input) {
  console.log("getDocsFuzzySearchByNameWords: START");
  const idxName = getIdxName(input);
  console.log("idxName:: ", idxName);

  let PageResults = q.Paginate(q.Match(q.Index(idxName)));
  let PageResultsMapFn = q.Lambda(["ref"], q.Get(q.Var("ref")));
  if (input.searchKeyword && input.searchKeyword.length > 0) {
    const searchKeyword = input.searchKeyword.toLowerCase();
    PageResults = q.Paginate(q.Match(q.Index(idxName), searchKeyword));
  }
  if (input.sortBy && input.sortBy.length > 0) {
    PageResultsMapFn = q.Lambda(["x", "eachRef"], q.Get(q.Var("eachRef")));
  }

  const fql = q.Map(PageResults, PageResultsMapFn);
  const resp = await client.query(fql);
  console.log("getDocsFuzzySearchByNameWords: END");
  return resp;
}

// ----------------------------------

async function fuzzSearch5(client) {
  const prefix = "1_";
  const config = {
    prefix,
    collectionName: "user_collection",
    serialized: false,
    // searchFields: ["name", "age"],
    searchFields: true, // searchAllFields
    sortField: ["data", "age"], // path
  };

  try {
    // # Step1: createIndex -inorder to query multiple records // searchBy: user.name
    await createIndexFuzzySearch(client, config);
    // ----------------------------------
    const input = {
      prefix,
      collectionName: "user_collection",
      searchKeyword: "30",
      // sortBy: "age",
      // sortBy: "address.city",
    };
    // const resp = await getDocsFuzzySearch(client, input);
    // console.log(resp.data.map(getObject));
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
}

module.exports = {
  fuzzSearch5,
};
