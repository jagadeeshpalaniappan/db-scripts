require("dotenv").config();
const faunadb = require("faunadb");
const q = faunadb.query;

const { crud } = require("./scripts/1-crud");
const { pagination } = require("./scripts/2-pagination");
const { sort } = require("./scripts/3-sort");
const { search1 } = require("./scripts/4-search-exact-match");
const { searchAndSort } = require("./scripts/5-sort-search-pagination");

const FAUNADB_SECRET = process.env.FAUNADB_SECRET;
var client = new faunadb.Client({ secret: FAUNADB_SECRET });
// console.log({ FAUNADB_SECRET });

// crud(client);
// pagination(client);
// sort(client);
// search1(client);
searchAndSort(client);
