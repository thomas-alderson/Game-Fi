// We need this file to keep the private keys on the server.
// Otherwise we would have to hardwire them in the client web3modal.js

require("dotenv").config();

const ethers = require("ethers");
const fs = require("fs");

const vault_abi = require("../contracts/Vault.json");
const token_abi = require("../contracts/Floppy.json");

class SmartContractAdaptor {
    constructor() {
        this.token_address = process.env.FLOPPY_ADDRESS;
        this.vault_address = process.env.VAULT_ADDRESS;
        this.withdrawer_private_key = process.env.WITHDRAWER_PRIVATE;
        this.withdrawer_address = process.env.WITHDRAWER_ADDRESS;
        this.deployer_address = process.env.DEPLOYER_ADDRESS;
        this.infura_api_key = process.env.INFURA_API_KEY;
        this.infura_url = process.env.INFURA_URL;
    }

    /*    async getBalance(address) {
        try {
            address = address.toLowerCase();

            var contract = await new this.web3.eth.Contract(
                flapabi,
                this.token_address
            );

            var bl = await contract.methods.balanceOf(address).call();
            console.log(bl);
            var value = bl / 10 ** 18;
            return value;
        } catch (error) {
            console.log(error);
            return null;
        }
    }*/

    // We don't need an equivalent deposit function because that is handled by metamask
    // directly in the browser (the private keys are automatically hidden)
    async withdraw(address, amount) {
        // Convert to wei
        amount = ethers.utils.parseEther(amount);

        // Get provider
        const provider = new ethers.providers.JsonRpcProvider(
            `${this.infura_url}${this.infura_api_key}`
        );

        // Get token contract
        const tokenContract = new ethers.Contract(
            this.token_address,
            token_abi,
            provider
        );

        // Get vault contract
        const vaultContract = new ethers.Contract(
            this.vault_address,
            vault_abi,
            provider
        );

        // Get withdrawer (account with special priv.)
        const withdrawer = new ethers.Wallet(
            this.withdrawer_private_key,
            provider
        );

        // Link withdrawer to vault contract
        const withdrawerVault = vaultContract.connect(withdrawer);

        // Withdraw from vault to specified address
        const result = await withdrawerVault.withdraw(
            amount,
            this.deployer_address
        );
        const receipt = await result.wait();
        if (receipt.status === 1)
            console.log("Token(s) withdrawn from vault and sent to user");

        return receipt.transactionHash;
    }
}

module.exports = SmartContractAdaptor;
