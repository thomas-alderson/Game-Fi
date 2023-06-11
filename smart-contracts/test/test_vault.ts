import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { formatEther } from "@ethersproject/units";
import * as chai from "chai";
import { expect } from "chai";
const chaiAsPromised = require("chai-as-promised");
import { ethers } from "hardhat";
import { keccak256 } from "ethers/lib/utils";

chai.use(chaiAsPromised);

function parseEther(amount: Number) {
    return ethers.utils.parseUnits(amount.toString(), 18);
}

function getbyte(strinput: string) {
    var bytes = [];
    for (var i = 0; i < strinput.length; ++i) {
        bytes.push(strinput.charCodeAt(i));
    }
    return bytes;
}

describe("Floppy Contract", () => {
    let owner: SignerWithAddress,
        alice: SignerWithAddress,
        bob: SignerWithAddress,
        carol: SignerWithAddress;

    let vault: Contract;
    let token: Contract;

    beforeEach(async () => {
        await ethers.provider.send("hardhat_reset", []);

        [owner, alice, bob, carol] = await ethers.getSigners();

        const Vault = await ethers.getContractFactory("Vault", owner); // vault is like an exchange basically
        vault = await Vault.deploy();
        const Token = await ethers.getContractFactory("Floppy", owner); // is the token
        token = await Token.deploy();

        vault.setToken(token.address);
    });

    it("Should deposit", async () => {
        await token.transfer(alice.address, parseEther(1 * 10 ** 6)); // deployer gives alice some tokens
        await token
            .connect(alice)
            .approve(vault.address, token.balanceOf(alice.address)); // alice approves vault to take all her tokens
        await vault.connect(alice).deposit(parseEther(500 * 10 ** 3)); // deposit function in vault contract perform alice to vault transfer
        expect(await token.balanceOf(vault.address)).equal(
            parseEther(500 * 10 ** 3) // check balance of vault
        );
    });

    it("Should withdraw", async () => {
        let WITHDRAWER_ROLE = keccak256(
            Buffer.from("WITHDRAWER_ROLE")
        ).toString();

        await vault.grantRole(WITHDRAWER_ROLE, bob.address);

        // Alice gets some tokens
        await token.transfer(alice.address, parseEther(1 * 10 ** 6)); // 1 mill
        // Alice approves vault to take some tokens
        await token
            .connect(alice)
            .approve(vault.address, token.balanceOf(alice.address));

        // Vault takes tokens from Alice
        await vault.connect(alice).deposit(parseEther(5 * 10 ** 5)); // half a mill
        await vault.setWithdrawEnable(true);
        await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

        // Bob withdraws 300,000 from vault to alice
        await vault
            .connect(bob)
            .withdraw(parseEther(300 * 10 ** 3), alice.address);

        // 500,000 - 300,000
        expect(await token.balanceOf(vault.address)).equal(
            parseEther(500000 - 300000)
        );
        expect(await token.balanceOf(alice.address)).equal(
            parseEther(1 * 10 ** 6 - 5 * 10 ** 5 + 3 * 10 ** 5)
        );

        // await expect(
        //     vault
        //         .connect(alice)
        //         .withdraw(parseEther(300 * 10 ** 3), alice.address)
        // ).revertedWith("Caller is not a withdrawer");
    });

    it("Should not deposit - insufficient account balance", async () => {
        // Get some tokens from deployer
        await token.transfer(alice.address, parseEther(1 * 10 ** 6));

        // Aprove all tokens
        await token
            .connect(alice)
            .approve(vault.address, token.balanceOf(alice.address));

        // Deposit more than available
        await expect(
            vault.connect(alice).deposit(parseEther(2 * 10 ** 6))
        ).revertedWith("Insufficient account balance");
    });

     it("Should not withdraw - withdrawal is not enabled", async () => {
        let WITHDRAWER_ROLE = keccak256(
            Buffer.from("WITHDRAWER_ROLE")
        ).toString();

        await vault.grantRole(WITHDRAWER_ROLE, bob.address);

        // Alice gets some tokens
        await token.transfer(alice.address, parseEther(1 * 10 ** 6)); // 1 mill
        // Alice approves vault to take some tokens
        await token
            .connect(alice)
            .approve(vault.address, token.balanceOf(alice.address));

        // Vault takes tokens from Alice
        await vault.connect(alice).deposit(parseEther(5 * 10 ** 5)); // half a mill
      
        await vault.setWithdrawEnable(false);
        await vault.setMaxWithdrawAmount(parseEther(1 * 10 ** 6));

        // Bob withdraws 300,000 from vault to alice
        await vault
            .connect(bob)
            .withdraw(parseEther(300 * 10 ** 3), alice.address);

        // 500,000 - 300,000
        expect(await token.balanceOf(vault.address)).equal(
            parseEther(500000 - 300000)
        );
        expect(await token.balanceOf(alice.address)).equal(
            parseEther(1 * 10 ** 6 - 5 * 10 ** 5 + 3 * 10 ** 5)
        );

    
    });

    // it("Should emergency withdraw", async () => {
    //     await token.transfer(alice.address, parseEther(1 * 10 ** 6));
    //     await token
    //         .connect(alice)
    //         .approve(vault.address, token.balanceOf(alice.address));

    //     await vault.connect(alice).deposit(parseEther(500 * 10 ** 3));
    //     let ownerblanceBefore = await token.balanceOf(owner.address);

    //     await vault.emergencyWithdraw();
    //     expect(await token.balanceOf(vault.address)).equal(parseEther(0));
    //     let ownerblanceAfter = await token.balanceOf(owner.address);

    //     expect(ownerblanceAfter.sub(ownerblanceBefore)).equal(
    //         parseEther(500 * 10 ** 3)
    //     );
    //});
});
