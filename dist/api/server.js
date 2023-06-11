// This file is used to start the database on the webserver (node server.js)

// 1. Create server (this file server.js)
// 2. Register routes (APIRoutes.js) the server listens for (get requests)
// 3. APIRoutes.js uses APIController.js. APIController defines and exports all the functions
// 4. ***Start server*** (command: node server.js)
// 5. Server receives a get request from POSTMAN testing software or from client accessing web server
// localhost:3000/api/getBalance?address=0x30F44489ce93c22d75b0f0CE31fCF8D6f09c27e5
// 6. Executes respectives APIRoute (defined routes) -> APIController (defined functions) -> SmartContractADAPTOR (interacts with contract)
// 7. SmartContractADAPTOR starts FLOPPY contract, calls method on the contract, returns result to get requester
// SmartContractADAPTOR -> APIController -> APIRoute

// Entry point to express.js framework
// "start": "node server.js"

require("dotenv").config();

var cors = require("cors");
var bodyParser = require("body-parser");
var express = require("express");

// sets up the basic configuration for a Node.js application using
// the express framework and the body-parser middleware. The
// application can now listen on the specified port and process
// incoming requests with JSON payloads.
var app = express(); // The app variable in Node.js typically represents an instance of the express application.
var port = process.env.PORT || 3000;

// enables CORS for the express application, allowing requests
// from any origin and with specific HTTP methods.
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  })
);

// Increase payload size limit (e.g., 10MB)
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// adds middleware to the express application that allows it to
// parse incoming request bodies that contain URL-encoded data.
// This allows the application to handle requests that contain
// data encoded in the URL-encoded format.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// adds middleware to the express application that handles requests
// that have timed out by setting a timeout on incoming requests
// and sending an error response if the request takes longer than
// the specified timeout.
app.use(function (req, res, next) {
  req.setTimeout(1000 * 45, function () {
    res.status(200).json(helper.APIReturn(1, "timeout"));
  });
  next();
});

var routes = require("./routes/APIRoutes"); //importing route
routes(app); //register the routes with the express application
app.listen(port);

console.log("Floppy Bird api started on: " + port);
