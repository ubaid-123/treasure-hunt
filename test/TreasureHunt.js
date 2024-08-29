const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TreasureHunt Contract", function () {
    let TreasureHunt, treasureHunt, player1, player2, player3;

    before(async function () {
        [player1, player2, player3] = await ethers.getSigners();
    });

    describe("Contract Deployment", function(){
        it("Should deploy the treasure hunt contract", async function(){
            TreasureHunt = await ethers.deployContract("TreasureHunt");
            treasureHunt = await TreasureHunt.getAddress();
        });
    });

    describe("Player position", function () {
        it("Should set the correct treasure position", async function () {
            const treasurePosition = await TreasureHunt.treasurePosition();
            expect(treasurePosition).to.be.within(0, 99); // 0 to GRID_SIZE * GRID_SIZE - 1
        });
    });

    describe("Join Game", function () {
        it("Should allow a player to join the game with a positive Ether value", async function () {
            await TreasureHunt.connect(player1).joinGame({ value: ethers.parseEther("0.1") });
            const playerPosition = await TreasureHunt.playerPositions(player1.address);
            expect(playerPosition).to.equal(0);
        });

        it("Should revert if a player tries to join with 0 Ether", async function () {
            await expect(TreasureHunt.connect(player1).joinGame({ value: 0 })).to.be.revertedWith(
                "Minimum amount should be greater than 0 WEI."
            );
        });

        it("Should revert if a non-joined player tries to move", async function () {
            await expect(TreasureHunt.connect(player3).movePlayer(1))
                .to.be.revertedWith("Player should join game before move.");
        });
    });

    describe("Move Player", function () {
        beforeEach(async function () {
            // Ensure player1 joins the game before moving
            await TreasureHunt.connect(player1).joinGame({ value: ethers.parseEther("0.1") });
        });
    
        it("Should allow a valid move", async function () {
            await TreasureHunt.connect(player1).movePlayer(1);
            const playerPosition = await TreasureHunt.playerPositions(player1.address);
            expect(playerPosition).to.equal(10);
        });
    
        it("Should revert on an invalid move", async function () {
            await expect(TreasureHunt.connect(player1).movePlayer(100)).to.be.revertedWith("Invalid position.");
        });
    
        it("Should update treasure position when player moves to a prime number", async function () {
            await TreasureHunt.connect(player1).movePlayer(2);
            const playerPosition = await TreasureHunt.playerPositions(player1.address);
            // player is moving to left but there is nothing on left
            expect(playerPosition).to.equal(10);
    
            const newTreasurePosition = await TreasureHunt.treasurePosition();
            expect(newTreasurePosition).to.not.equal(2);
        });

        it("Should update treasure position when player moves to a position divisible by 5", async function () {
            const divisibleByFivePosition = 5;
            await TreasureHunt.connect(player1).movePlayer(divisibleByFivePosition);
            const playerPosition = await TreasureHunt.playerPositions(player1.address);
            // player is moving to right So it will be now on 11th position
            expect(playerPosition).to.equal(11);

            const newTreasurePosition = await TreasureHunt.treasurePosition();
            expect(newTreasurePosition).to.not.equal(divisibleByFivePosition);
        });

    });

    describe("Edge Cases", function () {
        const GRID_POSITIONS = 100;
        beforeEach(async function () {
            await TreasureHunt.connect(player1).joinGame({ value: ethers.parseEther("0.1") });
        });
    
        it("Should handle the edge case when treasure moves multiple times", async function () {
            const primePosition = 2; // Prime number
            const divisibleByFivePosition = 5; // Divisible by 5
    
            // Move to prime position (expected to move treasure to a random position)
            await TreasureHunt.connect(player1).movePlayer(primePosition);
            let updatedTreasurePosition = await TreasureHunt.treasurePosition();
            
            // After moving to a prime number, the new treasure position should be random
            expect(updatedTreasurePosition).to.be.at.least(0);
            expect(updatedTreasurePosition).to.be.lessThan(GRID_POSITIONS);
    
            // Move to position divisible by 5 (expected to move treasure to an adjacent position)
            await TreasureHunt.connect(player1).movePlayer(divisibleByFivePosition);
            updatedTreasurePosition = await TreasureHunt.treasurePosition();
            expect(updatedTreasurePosition).to.be.lessThan(GRID_POSITIONS);
        });
    
        it("Should revert if player tries to move to an out-of-bounds position", async function () {
            await expect(TreasureHunt.connect(player1).movePlayer(255)).to.be.revertedWith("Invalid position.");
        });
    });

    describe("Receive Ether", function () {
        it("Should receive Ether and update the game balance", async function () {
            const initialcontractBalance = await ethers.provider.getBalance(treasureHunt);
            const amount = 1;

            const tx = await player1.sendTransaction({
                to: treasureHunt,
                value: ethers.parseEther(String(amount)),
            });

            await tx.wait();

            const finalContractBalance = await ethers.provider.getBalance(treasureHunt);
            expect(finalContractBalance).to.equal(initialcontractBalance + ethers.parseEther(String(amount)));
        });
    });
});
