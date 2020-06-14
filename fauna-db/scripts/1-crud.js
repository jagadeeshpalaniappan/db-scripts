const faunadb = require("faunadb");
const q = faunadb.query;
const { createCollection, createDefaultIndex } = require("./0-schema");
const { getObject } = require("./utils");

// CREATE: a Document // (sql: insertRow)
// user: { name: "First User", age: 10, username: "one" }
async function createDoc(client, user) {
  console.log("createDoc: START");
  const newDoc = { data: user };
  const fql = q.Create(q.Collection("user_collection"), newDoc);
  const resp = await client.query(fql);
  console.log("createDoc: END");
  return resp;
}

// CREATE: (muliple) Document // (sql: insertRow)
// users: [{ name: "First User", age: 10, username: "one" }, { name: "Second User", age: 20, username: "two" }]
async function createDocs(client, users) {
  console.log("createDocs: START");
  const fql = q.Map(
    users, // Array
    q.Lambda(
      "eachUser",
      q.Create(q.Collection("user_collection"), {
        data: {
          name: q.Select(["name"], q.Var("eachUser")),
          age: q.Select(["age"], q.Var("eachUser")),
          username: q.Select(["username"], q.Var("eachUser")),
        },
      })
    )
  );
  const resp = await client.query(fql);
  console.log("createDocs: END");
  return resp;
}

// UPDATE: a Document // (sql: updateRow)
// user: { name: "First User111" }
async function updateDoc(client, user) {
  console.log("updateDoc: START");
  const { id, ...rest } = user;
  const updatedDoc = { data: rest };
  const fql = q.Update(q.Ref(q.Collection("user_collection"), id), updatedDoc);
  const resp = await client.query(fql);
  console.log("updateDoc: END");
  return resp;
}

// DELETE: a Document // (sql: deleteRow)
// id = "192903209792046592";
async function deleteDoc(client, id) {
  console.log("deleteDoc: START");
  const fql = q.Delete(q.Ref(q.Collection("user_collection"), id));
  const resp = await client.query(fql);
  console.log("deleteDoc: END");
  return resp;
}

// READ: a Document // (sql: selectOneRow)
// id = "192903209792046592";
async function getDoc(client, id) {
  console.log("getDoc: START");
  const fql = q.Get(q.Ref(q.Collection("user_collection"), id));
  const resp = await client.query(fql);
  console.log("getDoc: END");
  return resp;
}

// NOTE:
// In FaunaDB, we cannot directly read list of documents from 'Collection', we can only read from index

// READ: ALL Documents // (sql: selectAllRows)
async function getAllDocs(client) {
  console.log("getAllDocs: START");
  const fql = q.Map(
    q.Paginate(q.Match(q.Index("user_idx_all"))),
    q.Lambda("eachRef", q.Get(q.Var("eachRef")))
  );
  const resp = await client.query(fql);
  console.log("getAllDocs: END");
  return resp;
}

const crud = async (client) => {
  try {
    // # Step1:
    // const resp = await createCollection(client);
    // ----------------------------------
    // # Step2:
    // const user = { name: "Second User", age: 20, username: "two" };
    // const resp = await createDoc(client, user);
    // console.log(resp);
    // ----------------------------------
    // # Step3:
    // const users = [
    //   { name: "Third User", age: 30, username: "three" },
    //   { name: "Third User", age: 33, username: "three2" },
    //   { name: "Forth User", age: 40, username: "four" },
    //   { name: "Fifth User", age: 50, username: "five" },
    //   { name: "Sixth User", age: 60, username: "six" },
    //   { name: "Seventh User", age: 70, username: "seven" },
    //   { name: "Eighth User", age: 80, username: "eighth" },
    //   { name: "Nine User", age: 30, username: "nine" },
    //   { name: "Tenth User", age: 40, username: "ten" },
    //   { name: "Eleventh User", age: 30, username: "eleven" },
    // ];
    // const resp = await createDocs(client, users);
    // console.log(resp);
    // ----------------------------------
    // // # Step4:
    // const user = { id: "268185363659358732", name: "Second User2222" };
    // const resp = await updateDoc(client, user);
    // console.log(resp);
    // ----------------------------------
    // # Step5:
    // const resp = await deleteDoc(client, "268185363659358732");
    // console.log(resp);
    // ----------------------------------
    // # Step6:
    // const resp = await getDoc(client, "268185481796125192");
    // console.log(resp);
    // console.log(getObject(resp));
    // ----------------------------------
    // # Step7: createIndex -inorder to query multiple records
    // const resp = await createDefaultIndex(client);
    // console.log(resp);
    // ----------------------------------
    // # Step8:
    // const resp = await getAllDocs(client);
    // console.log(resp);
    // console.log(resp.data.map(getObject));
    // ----------------------------------
  } catch (e) {
    console.log("##ERROR##");
    console.log(e);
  }
};

module.exports = {
  crud,
};
