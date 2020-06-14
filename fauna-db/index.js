require("dotenv").config();
const faunadb = require("faunadb");
const q = faunadb.query;

const { crud } = require("./scripts/1-crud");
const { pagination } = require("./scripts/2-pagination");
const { sort } = require("./scripts/3-sort");
const { search1 } = require("./scripts/4-search-exact-match");
const { searchAndSort } = require("./scripts/5-sort-search-pagination");
const { fuzzSearch1 } = require("./scripts/6-search-1-fuzzy-match-contains");
const { fuzzSearch2 } = require("./scripts/7-search-2-words-match");
const { fuzzSearch3 } = require("./scripts/8-search-3-fuzzy-match-ngrams");
const { fuzzSearch4 } = require("./scripts/9-search-4-fuzzy-match-trigrams");
const { fuzzSearch5 } = require("./scripts/10-search-5-jag");

const FAUNADB_SECRET = process.env.FAUNADB_SECRET;
var client = new faunadb.Client({ secret: FAUNADB_SECRET });
// console.log({ FAUNADB_SECRET });

// crud(client);
// pagination(client);
// sort(client);
// search1(client);
// searchAndSort(client);
// fuzzSearch1(client);
// fuzzSearch2(client);
// fuzzSearch3(client);
// fuzzSearch4(client);
fuzzSearch5(client);
