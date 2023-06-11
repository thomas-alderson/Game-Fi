// This file draws code from APIController.js

// Routes define how the application responds to incoming requests for
// specific URLs (or endpoints) and HTTP methods. A route consists of
// a combination of an HTTP method (such as GET, POST, or DELETE) and
// a URL pattern (such as /api/getBalance).

// Lets make these purely database calls, do the contract calls inside (web3Modal.js no?)

"use strict";
module.exports = function (app) {
  var api = require("../controllers/APIController");

   app.post("/api/playerDeath", api.playerDeath);

  // localhost:3000/api/getTicketBalance?address=0x30F44489ce93c22d75b0f0CE31fCF8D6f09c27e5
  app.get("/api/getTicketBalance", api.getTicketBalance); // also adds new player if none exist
 
  // localhost:3000/api/withdraw (from Vault) - call smart contract
  app.post("/api/withdraw", api.withdraw);
  /*{
    "address" : "0x30F44489ce93c22d75b0f0CE31fCF8D6f09c27e5",
    "amount" : 1
  }*/
 
  // localhost:3000/api/deposit (into Vault)
  app.post("/api/deposit", api.deposit);
  /*{
    "address" : "0x30F44489ce93c22d75b0f0CE31fCF8D6f09c27e5",
    "amount" : 1,
    "transaction_id" : 100
  }*/

  // localhost:3000/api/getBalance?address=0x30F44489ce93c22d75b0f0CE31fCF8D6f09c27e5
  //app.get("/api/getBalance", api.getBalance); // on the blockchain using the contract (pointess! do it directly no?)

  // localhost:3000/api/startMatch?address=0x30F44489ce93c22d75b0f0CE31fCF8D6f09c27e5
  //app.get("/api/startMatch", api.startMatch);

  // localhost:3000/api/endMatch
  // POST, RAW BODY, JSON BODY
  //app.post("/api/endMatch", api.endMatch); // SQL UPDATE
  /*{
    "address" : "0x30F44489ce93c22d75b0f0CE31fCF8D6f09c27e5",
    "id" : 1,
    "point" : 100,
    "matchData" : []
  }*/

  // localhost:3000/api/getTop (leaderboard)
  //app.get("/api/getTop", api.getTop);
};
