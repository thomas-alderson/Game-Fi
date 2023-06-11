// This file contains the functions ultimately called by api.js.
// These functions run the SQL commands on the database.
// They also run commands on the blockchain in cases where the private key is required (i.e. withdraw).

const FloopyDAO = require("../data/FloopybirdDAO");
const SmartContractAdaptor = require("../data/SmartContractAdaptor");
const { APIReturn } = require("./helper.js");

const sqlite3 = require("sqlite3"); // API for working with SQLite DB
const dbfilepath = "floppyBird.db";
const StoreCommand = require("../data/cStoreCommand");
const cStoreCommand = new StoreCommand.cStoreCommand(); // const myObject = new MyModule.MyClass();

const matchCode = 5;

// ------------------------------------------------------------------------
// Connect to database, run SQL
// ------------------------------------------------------------------------

async function RunCommand(sql, parameters) {
  // Connect to database
  db = new sqlite3.Database(dbfilepath, (err) => {
    if (err) {
      //console.log("Error connecting to database", err);
    } else {
      //console.log("Successfully connected to database");
    }
  });
  // Execute SQL
  return new Promise((resolve, reject) => {
    db.all(sql, parameters, (error, result) => {
      if (error) {
        console.log(error);
        reject(error); // promise failed
      } else {
        console.log(result);
        resolve(result); // promise successfull
      }
    });
  });
}

// ------------------------------------------------------------------------
// Player death: remove a ticket (DB)
// ------------------------------------------------------------------------

async function removeTicket(address) {
  try {
    console.log("*********SQL: Player death, remove ticket********");

    let date = parseInt(new Date().getTime() / 1000);

    // Run SQL to remove ticket(s)
    let result = await RunCommand(cStoreCommand.WithdrawPlayerBalanceCommand, {
      $wallet_id: address,
      $amount: 1,
    });

    // Check for error
    if (result == null || result.length == 0) return null;

    // Return on success
    return { amount: 1 };
  } catch (error) {
    console.log(error);
  }
  return null;
}

// ------------------------------------------------------------------------
// Deposit: increase ticket balance in database (SQL)
// ------------------------------------------------------------------------

async function addTicketBalance(address, amount) {
  try {
    console.log("*********SQL: Deposit ticket(s)********");

    let date = parseInt(new Date().getTime() / 1000);

    let result = await RunCommand(cStoreCommand.AddPlayerBalanceCommand, {
      $wallet_id: address,
      $amount: amount,
    });

    if (result == null || result.length == 0) return null;

    // Return on success
    return result[0].balance;
  } catch (error) {
    console.log(`add ticket balance: ` + error);
    return null;
  }
}

// ------------------------------------------------------------------------
// Withdrawal: decrease ticket balance in database (SQL)
// ------------------------------------------------------------------------

async function subtractTicketBalance(address, amount) {
  try {
    console.log("*********SQL: Withdraw ticket(s)********");

    let date = parseInt(new Date().getTime() / 1000);

    // Run SQL to remove ticket(s)
    let result = await RunCommand(cStoreCommand.WithdrawPlayerBalanceCommand, {
      $wallet_id: address,
      $amount: amount,
    });

    // Check for error
    if (result == null || result.length == 0) return null;

    // Run blockchain commands
    const smartContract = new SmartContractAdaptor();
    const transHash = await smartContract.withdraw(address, amount);

    // Return on success
    return { amount: amount, transHash: transHash };
  } catch (error) {
    console.log(error);
  }
  return null;
}

/*async function getBalance(Address) {
  let dao = new SmartContractDAO();
  return await dao.getBalance(Address);
}*/

/*async function addPlayer(address) {
  try {
    let dao = new FloopyDAO(dbfilepath);
    return await dao.AddPlayerVault(address);
  } catch (error) {
    console.log(error);
    return null;
  }
}
*/

// if player not exist create new
async function getBalanceOfTickets(address) {
  // Add player (check for duplicate wallet address first)
  try {
    let date = parseInt(new Date().getTime() / 1000);

    try {
      console.log("*********SQL: Add player to database*******");
      let response = await RunCommand(cStoreCommand.AddPlayerVaultCommand, {
        $wallet_id: address,
        $created_date: date,
      });
    } catch {}
  } catch (error) {
    console.log("Warning: Duplicate player detected!");
    console.log(error);
    return null;
  }

  // Get player's ticket balance
  try {
    console.log("*********SQL: Get ticket balance*******");
    let result = await RunCommand(cStoreCommand.GetPlayerBalanceCommand, {
      $wallet_id: address,
    });

    // Check for errors
    if (result == null || result.length == 0) return null;

    // Return on success
    return result[0].balance;
  } catch (error) {
    console.log(error);
    return null;
  }
}

/*async function getTopPlayer() {
  let dao = new FloopyDAO(dbfilepath);
  try {
    return await dao.GetTopPlayer();
  } catch (error) {
    console.log(error);
    return null;
  }
}*/

/*async function updateTransaction(id, transid) {
  try {
    let dao = new FloopyDAO(dbfilepath);
    //await dao.AddPlayerVault(address);
    //await dao.AddPlayerBalance(address, amount*2);
    let result = await dao.UpdateTransaction(id, transid);

    return result;
  } catch (error) {
    console.log(error);
  }
  return null;
}*/

/*async function startPlayerMatch(address) {
  try {
    let dao = new FloopyDAO(dbfilepath);
    //await dao.AddPlayerVault(address);
    //await dao.AddPlayerBalance(address, amount*2);
    let code = await dao.WithdrawPlayerBalance(address, matchCode);
    if (code != null) {
      let result = await dao.StartPlayerMatch(address);
      return result;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function endPlayerMatch(address, id, point, matchData) {
  try {
    let dao = new FloopyDAO(dbfilepath);
    //await dao.AddPlayerVault(address);
    //await dao.AddPlayerBalance(address, amount*2);
    let updateId = await dao.EndPlayerMatch(address, id, point, matchData);
    if (updateId != null) {
      let result = await dao.AddPlayerBalance(address, point, null);
      return result;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}*/

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

exports.playerDeath = async function (req, res) {
  try {
    let { address } = req.body;

    // Database call
    let result = await removeTicket(address);
    console.log(result);

    // Check for error
    if (result == null) {
      return res.status(400).json(APIReturn(102, "bad request"));
    }

    // Return success
    return res
      .status(200)
      .json(APIReturn(0, { amount: result.amount }, "success"));
  } catch (error) {
    console.log(error);
    return res.status(500).json(APIReturn(101, "something wrongs"));
  }
};

exports.addPlayer = async function (req, res) {
  try {
    console.log("*********Export: Player added*********");
    var bls = await addPlayer(req.query.address);
    if (bls == null)
      return res.status(401).json(APIReturn(101, "something wrongs"));
    return res.status(200).json(APIReturn(0, { balances: bls }, "Success"));
  } catch (error) {
    return res.status(401).json(APIReturn(101, "something wrongs"));
  }
};

/*exports.getBalance = async function (req, res) {
  try {
    var bls = await getBalance(req.query.address);

    if (bls == null) {
      return res //  is the HTTP response object that will be sent back to the client making a request to this route.
        .status(401) // indicates to the client that the requested resource requires authentication or the user's credentials are invalid.
        .json(APIReturn(101, "something wrong with getBalance")); // serializes the given JavaScript object into JSON format and sends it back as the response body.
    } else {
      return res.status(200).json(APIReturn(0, { balances: bls }, "Success"));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .json(APIReturn(101, "something wrong with getBalance"));
  }
};*/

exports.getTicketBalance = async function (req, res) {
  try {
    var bls = await getBalanceOfTickets(req.query.address);
    if (bls == null)
      return res.status(401).json(APIReturn(101, "something wrongs"));
    return res.status(200).json(APIReturn(0, { balances: bls }, "Success"));
  } catch (error) {
    console.log(error);
    return res.status(401).json(APIReturn(101, "something wrongs"));
  }
};

exports.withdraw = async function withdraw(req, res) {
  try {
    let { address, amount } = req.body;

    // Errors
    if (address === undefined || amount === undefined || amount <= 0) {
      return res.status(400).json(APIReturn(101, "bad request"));
    }

    // Database call
    let result = await subtractTicketBalance(address, amount);
    console.log(result);

    // Check for error
    if (result == null) {
      return res.status(400).json(APIReturn(102, "bad request"));
    }

    // Return success
    return res
      .status(200)
      .json(
        APIReturn(
          0,
          { amount: result.amount, transHash: result.transHash },
          "success"
        )
      );
  } catch (error) {
    console.log(error);
    return res.status(500).json(APIReturn(101, "something wrongs"));
  }
};

exports.deposit = async function deposit(req, res) {
  try {
    let { address, amount } = req.body;
    if (address === undefined || amount === undefined || amount <= 0) {
      return res.status(400).json(APIReturn(101, "bad request"));
    }

    // Datebase call
    let result = await addTicketBalance(address, amount);

    // Check for error
    if (result == null) {
      return res.status(400).json(APIReturn(102, "bad request"));
    }

    // Return success
    return res.status(200).json(APIReturn(0, { result }, "success"));
  } catch (error) {
    console.log(error);
    return res.status(500).json(APIReturn(101, "something wrongs"));
  }
};

/*exports.startMatch = async function (req, res) {
  try {
    var bls = await startPlayerMatch(req.query.address);
    if (bls == null)
      return res.status(401).json(APIReturn(101, "something wrongs"));
    return res.status(200).json(APIReturn(0, { Id: bls }, "Success"));
  } catch (error) {
    return res.status(401).json(APIReturn(101, "something wrongs"));
  }
};

exports.endMatch = async function (req, res) {
  try {
    let { address, id, point, matchData } = req.body;

    var bls = await endPlayerMatch(address, id, point, matchData);
    if (bls == null)
      return res.status(401).json(APIReturn(101, "something wrongs"));
    return res.status(200).json(APIReturn(0, { result: bls }, "Success"));
  } catch (error) {
    return res.status(401).json(APIReturn(101, "something wrongs"));
  }
};

exports.getTop = async function (req, res) {
  try {
    var bls = await getTopPlayer();
    if (bls == null)
      return res.status(401).json(APIReturn(101, "something wrongs"));

    return res.status(200).json(APIReturn(0, { result: bls }, "Success"));
  } catch (error) {
    return res.status(401).json(APIReturn(101, "something wrongs"));
  }
};*/
