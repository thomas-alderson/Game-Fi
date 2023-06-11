const WITHDRAWER_ADDRESS = "0xE2033E1a7bc210198955249f12eE3fC9fE42d75b";
const DEPLOYER_ADDRESS = "0x30F44489ce93c22d75b0f0CE31fCF8D6f09c27e5";

// Token address
const FLOPPY_ADDRESS = "0xAe12A4FebcA2d0e223caB6BE12c013c5C006B6fc";

// Get Token ABI from file
let FLOPPY_ABI = [];
fetch("../../api/contracts/Floppy.json")
  .then((response) => response.json())
  .then((jsonData) => {
    FLOPPY_ABI = jsonData;
    //console.log(jsonData);
  })
  .catch((error) => {
    console.error("Error fetching JSON:", error);
  });

// Vault address
const VAL_ADDRESS = "0x69F3262Ea0B1549764EcBA6d9C79632ce231549a";

// Get Vault ABI from file
let VAL_ABI = [];
fetch("../../api/contracts/Vault.json")
  .then((response) => response.json())
  .then((jsonData) => {
    VAL_ABI = jsonData;
    //console.log(jsonData);
  })
  .catch((error) => {
    console.error("Error fetching JSON:", error);
  });

// -----------------------------------------------------------------------------------------------
// Initialize variables
// -----------------------------------------------------------------------------------------------

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;

const TESTNET_SCAN = "https://sepolia.etherscan.io/tx/";

let web3Modal;
let provider;
let web3;
let selectedAccount;
let accountInfo = {};
let transHash;
let isDisconnect;
let onConvertTicketFlag;
let connected;

// -----------------------------------------------------------------------------------------------
// Initialize modal i.e. popup wallet menu (use Sepolia testnet)
// -----------------------------------------------------------------------------------------------

function init() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          11155111: "https://rpc2.sepolia.org",
        },
      },
    },
  };
  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
    disableInjectedProvider: false,
  });
}

// -----------------------------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------------------------

// Truncate address for display
function shortAddress(address) {
  const shortAddress = `${String(address).substr(0, 4)}...${String(
    address
  ).substr(address.length - 4, address.length - 1)}`;
  return shortAddress;
}

// We need to remove circular references from the provider object prior to passing it through
// the API call to avoid an error
function stringifyWithoutCircular(obj) {
  const cache = [];

  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.indexOf(value) !== -1) {
        console.log("circular");
        return "[Circular]";
      }
      cache.push(value);
    }
    return value;
  });
}

// -----------------------------------------------------------------------------------------------
// Connect wallet: triggered when connect button clicked
// -----------------------------------------------------------------------------------------------

async function onConnect() {
  connected = true;

  if (typeof window.ethereum !== "undefined") {
    // Get network details
    provider = new ethers.providers.Web3Provider(window.ethereum); // Ethers is imported in the index.html
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    // Get wallet address
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    accountInfo.walletAddress = accounts[0];

    console.log("Network: ", network);
    console.log("Chain id: ", chainId);
    console.log("Provider: ", provider);
    console.log("Account: ", accountInfo.walletAddress);
  }

  // Subscribe to accounts change
  window.ethereum.on("accountsChanged", (accounts) => {
    console.log("Account changed to ", accounts[0]);
    fetchAccountData();
  });

  // Subscribe to chainId change
  window.ethereum.on("chainChanged", (chainId) => {
    console.log("ChainId changed to ", chainId);
    fetchAccountData();
  });

  // Subscribe to networkId change
  window.ethereum.on("networkChanged", (network) => {
    console.log("Network changed to ", network);
    fetchAccountData();
  });

  // Refresh account data
  fetchAccountData();
}

// ----------------------------------------------------------------------------
// Fetch account data and display in menu
// -----------------------------------------------------------------------------------------------

async function fetchAccountData() {
  const accountInfoLocal = {};

  if (!provider) {
    console.log("No provider!");
    return;
  }

  accountInfoLocal.walletAddress = accountInfo.walletAddress;

  // ----------------------------------------------------------------------------
  // Get default token balance in metamask wallet

  const balance = await provider.getBalance(accountInfoLocal.walletAddress);
  accountInfoLocal.balance = ethers.utils.formatEther(balance.toString());

  // ----------------------------------------------------------------------------
  // Get FLOPPY balance (on blockchain)

  // create a new instance of the contract
  const contract = new ethers.Contract(FLOPPY_ADDRESS, FLOPPY_ABI, provider);

  // call the balanceOf function on the contract
  const flpBalance = await contract.balanceOf(accountInfoLocal.walletAddress);
  accountInfoLocal.flpBalance = ethers.utils.formatEther(flpBalance.toString());

  // ----------------------------------------------------------------------------
  // Get VAULT balance (on blockchain)

  const vltBalance = await contract.balanceOf(VAL_ADDRESS);
  accountInfoLocal.vltBalance = ethers.utils.formatEther(vltBalance.toString());

  // ----------------------------------------------------------------------------
  // Ticket balance (in game database call)/create new player if does not exist

  const ticket = await getBalanceOf(accountInfoLocal.walletAddress);
  console.log(ticket)
  accountInfoLocal.ticket = ticket.balances;

  // ----------------------------------------------------------------------------
  // Display data in menu

  // Add inside the id=wallet-info div
  const accountContainer = document.querySelector("#wallet-info-container1");

  // Modify HTML text contents
  accountContainer.innerHTML = `
    <div class='wallet-address'>   
      <table>
        <tr>
          <td>
            <span>Address: </span>
          </td>
          <td>
            <span>${shortAddress(accountInfo.walletAddress)}</span>
          </td>
        </tr>
        <tr>
          <td>
            <span>SepETH: </span>
          </td>
          <td>
            <span>${parseFloat(accountInfoLocal.balance).toFixed(2)}</span>
          </td>
        </tr>
        <tr>
          <td>
            <span>Game Token: </span>
          </td>
          <td>
            <span>${parseFloat(accountInfoLocal.flpBalance).toFixed(2)}</span>
          </td>
        </tr>
        <tr>
          <td>
            <span>Ticket: </span>
          </td>
          <td>
            <span>${accountInfoLocal.ticket}</span>
          </td>
        </tr>
        <tr>
          <td>
            <span>Vault: </span>
          </td>
          <td>
            <span>${parseFloat(accountInfoLocal.vltBalance).toFixed(2)}</span>
          </td>
        </tr>
      </table>
    </div>
    `;

  // <div class='line'>

  // </div>
  // <div class='line'>

  // </div>
  // <div class='line'>

  // </div>
  //     <div class='line'>

  // </div>

  document.querySelector("#wallet-info-container1").style.display = "block";  

  let walletConnect = document.querySelector("#wallet-connect-container1");
  walletConnect.style.display = "none"
  let btnWrapper = document.querySelector("#btn-wrapper1");
  btnWrapper.style.display = "block";

  // Local to global variable access in the game
  accountInfo = accountInfoLocal;
}

// ---------------------------------------------------------------------------------------
// Close menu: triggered on clicking disconnect button
// -----------------------------------------------------------------------------------------------

async function onDisconnect() {
  console.log("disconnect");

  connected = false;

  if (provider) {
    try {
      await web3Modal.clearCachedProvider();
      provider = null;
    } catch (er) {
      console.log(er);
    }
  }
  //selectedAccount = null;
  accountInfo = {};

  // Hide element from view
  document.querySelector("#wallet-connect-container1").style.display = "block";
  document.querySelector("#wallet-info-container1").style.display = "none";
  document.querySelector("#btn-wrapper1").style.display = "none";



  /*  var disconnectButton = document.getElementById("convert-container1");
  disconnectButton.style.display = "none";*/

  /*  // Unfortunately, there is a clash with jQuery symbol $ in the game, so we must define it locally
  jQuery.noConflict();
  (function ($) {
    // You can use the locally-scoped $ in here as an alias to jQuery.
    $(function () {
      // uses the jQuery library to create close dialog box
      const dialog = document.getElementById("dialog");
      dialog.style.display = "none";
    });
  })(jQuery);*/
}

// -----------------------------------------------------------------------------------------------
// Click convert to bring up menu center screen
// -----------------------------------------------------------------------------------------------

function onShowConvertModal() {
  onConvertTicketFlag = !onConvertTicketFlag;
  console.log(onConvertTicketFlag);
  // Unfortunately, there is a clash with jQuery symbol $ in the game, so we must define it locally
  jQuery.noConflict();
  (function ($) {
    // You can use the locally-scoped $ in here as an alias to jQuery.
    $(function () {
      // uses the jQuery library to select the HTML element with the ID deposit-withdraw and toggles its visibility using the fadeToggle() method.
      const modal = $("#deposit-withdraw").fadeToggle();
    });
  })(jQuery);
}

// -----------------------------------------------------------------------------------------------
// Switch ordering of exchange, from (ticket to token) to (token to ticket)
// -----------------------------------------------------------------------------------------------

function onRevert() {
  let from = document.querySelector("#from-ticket");
  let to = document.querySelector("#to-ticket");
  let lblFrom = document.querySelector("#label-from");
  let lblTo = document.querySelector("#label-to");

  const fromVal = from.value;
  const toVal = to.value;

  if (lblFrom.textContent === "Ticket") {
    lblTo.textContent = "Ticket";
    lblFrom.textContent = "Game Token";
    from.value = toVal;
    to.value = fromVal;
  } else {
    lblTo.textContent = "Game Token";
    lblFrom.textContent = "Ticket";
    from.value = toVal;
    to.value = fromVal;
  }
}

// -----------------------------------------------------------------------------------------------
// Convert button found on popup convert menu in center of screen
// -----------------------------------------------------------------------------------------------

async function onConvertTicket() {
  this.disabled = true;
  let processing = document.getElementById("processing");
  processing.style.display = "block"; // equivalent to jQuery's .show()
  let lblFrom = document.getElementById("label-from");
  let from = document.getElementById("from-ticket");
  let to = document.getElementById("to-ticket");

  let amount = from.value;

  let receipt, result;

  // ---------------------------------------------------------------------------------------
  // Withdraw: ticket (database) to token (blockchain)

  // Note: deployer (onlyOwner) must setMaxWithdrawAmount() on Vault contract
  if (lblFrom.textContent === "Ticket") {
    console.log("******Withdrawal initiated******");
    console.log("Withdrawal from (Vault): ", VAL_ADDRESS);
    console.log("Withdrawl to (user): ", accountInfo.walletAddress);
    console.log("Amount (eth units): ", amount);

    // Call the withdraw API:
    // 1. Decrement the number of game tickets (DB)
    // 2. Return token(s) to user from vault (blockchain)
    // We do this on the server using private keys of withdraw account to sign
    // We can't do this here without revealing private keys
    const response = await withdrawApi(accountInfo.walletAddress, amount);
    transHash = response.transHash;
  }

  // ---------------------------------------------------------------------------------------
  // Deposit: token (blockchain) to ticket (database)

  if (lblFrom.textContent !== "Ticket") {
    console.log("******Deposit initiated******");
    console.log("Desposit from (user): ", accountInfo.walletAddress);
    console.log("Desposit to (Vault): ", VAL_ADDRESS);
    console.log("Amount (eth units): ", amount);

    // Call the deposit API:
    // 1. Increment the number of game tickets (DB)
    await depositApi(accountInfo.walletAddress, amount); // Eth units
    console.log("Ticket(s) deposited in database");

    amount = ethers.utils.parseEther(amount); // To wei units
    amount = amount.toString();

    // Get contracts
    const flappyContract = new ethers.Contract(
      FLOPPY_ADDRESS,
      FLOPPY_ABI,
      provider
    );

    // Get contract
    const vaultContract = new ethers.Contract(VAL_ADDRESS, VAL_ABI, provider);

    // Get signers
    const signer = await provider.getSigner(accountInfo.walletAddress); // Can't use address string directly as signer
    const flappyWithSigner = flappyContract.connect(signer);
    const vaultWithSigner = vaultContract.connect(signer);

    // User approves vault to take tokens
    result = await flappyWithSigner.approve(VAL_ADDRESS, amount);
    receipt = await result.wait();
    if (receipt.status === 1)
      console.log("Vault approved to make deposit on behalf of user");

    // Tokens deposited into vault
    result = await vaultWithSigner.deposit(amount); // Wei units
    receipt = await result.wait();
    if (receipt.status === 1)
      console.log("Token(s) successfully deposited into Vault");
    transHash = receipt.transactionHash;
  }

  // Reset menu elements
  from.value = 0;
  to.value = 0;

  // Update menu
  await fetchAccountData();

  // Generate a confirmation with a hash linking to etherscan
  let url = `${TESTNET_SCAN}${transHash}`;
  let aTransaction = document.getElementById("a-transactionHash");
  aTransaction.href = url;
  aTransaction.textContent = shortAddress(transHash);

  // Close menu
  processing.style.display = "none"; // css
  // Allow button to function again
  this.disabled = false;

  // To use jQuery, we must avoid the conflict with $ in the js game (sorry)
  jQuery.noConflict();
  (function ($) {
    // You can use the locally-scoped $ in here as an alias to jQuery.
    $(function () {
      // uses the jQuery library to select the HTML element with the ID deposit-withdraw and toggles its visibility using the fadeToggle() method.
      const modal = $("#deposit-withdraw").fadeToggle();
    });
  })(jQuery);

  // Unfortunately, there is a clash with jQuery symbol $ in the game, so we must define it locally
  jQuery.noConflict();
  (function ($) {
    // You can use the locally-scoped $ in here as an alias to jQuery.
    $(function () {
      // uses the jQuery library to create close dialog box
      const dialog = document.getElementById("dialog");
      dialog.style.display = "flex";
      $("#dialog").dialog();

      $("#dialog").dialog({
        close: function (event, ui) {
          // Dialog box has been closed, perform desired actions
          console.log("Dialog box has been closed");
          onConvertTicketFlag = false;
        },
      });
    });
  })(jQuery);
}

// -----------------------------------------------------------------------------------------------
// Arrows for increasing/descreasing number of Tokens vs. Tickets in popup convert menu
// -----------------------------------------------------------------------------------------------

function onFromTicketChange() {
  let val = this.value;
  document.getElementById("to-ticket").value = val;
}

// -----------------------------------------------------------------------------------------------
// Event listeners
// -----------------------------------------------------------------------------------------------

window.addEventListener("load", async () => {
  init();

  document.querySelector("#wallet-connect-container1").addEventListener("click", onConnect);

  document
    .querySelector("#disconnect-container1")
    .addEventListener("click", onDisconnect);

    document
    .querySelector("#convert-container1")
    .addEventListener("click", onShowConvertModal);

  document.querySelector("#img-convert").addEventListener("click", onRevert);

  document
    .querySelector("#btn-convert")
    .addEventListener("click", onConvertTicket);

  document
    .querySelector("#from-ticket")
    .addEventListener("change", onFromTicketChange);
});
