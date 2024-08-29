// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TreasureHunt {
    uint8 public constant GRID_SIZE = 10;
    uint8 public treasurePosition;
    uint8 public winningPosition;
    uint256 public constant GRID_POSITIONS = GRID_SIZE * GRID_SIZE;
    uint256 public gameBalance;

    mapping(address => uint8) public playerPositions;
    mapping(address => bool) public isPlayerJoined;
    event PlayerMoved(address indexed player, uint8 newPosition);
    event TreasureMoved(uint8 newTreasurePosition);
    event GameWon(address indexed winner, uint256 prize);

    modifier onlyJoinedPlayer(address player){
        require(isPlayerJoined[player], "Player should join game before move.");
        _;
    }
    constructor() {
        treasurePosition = uint8(uint256(blockhash(block.number - 1)) % (GRID_POSITIONS));
    }

    function joinGame() external payable {
        require(msg.value > 0 wei, "Minimum amount should be greater than 0 WEI.");
        isPlayerJoined[msg.sender] = true;
    }

    function movePlayer(uint8 direction) public onlyJoinedPlayer(msg.sender){
        require(direction < GRID_POSITIONS, "Invalid position.");
        address sender = msg.sender;
        uint8 currentPlayerPosition = playerPositions[sender];
        uint8 newPosition = getNewPosition(currentPlayerPosition, direction);
        playerPositions[sender] = newPosition;
        emit PlayerMoved(sender, newPosition);

        if (newPosition == treasurePosition) {
            uint256 prize = (gameBalance * 90) / 100;
            uint256 remainingBalance = gameBalance - prize;

            gameBalance = remainingBalance;
            payable(sender).transfer(prize);

            emit GameWon(sender, prize);

            // Restart game by placing the treasure at a new position
            treasurePosition = uint8(uint256(blockhash(block.number - 1)) % (GRID_SIZE * GRID_SIZE));
        } else {
            updateTreasurePosition(newPosition);
        }
    }
   
    function updateTreasurePosition(uint8 playerPosition) internal {
        if (playerPosition % 5 == 0) {
            // Move treasure to a random adjacent position
            treasurePosition = getNewPosition(playerPosition, uint8(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)))) % 4);
        } else if (isPrime(playerPosition)) {
            // Jump to a new random position
            treasurePosition = uint8(uint256(blockhash(block.number - 1)) % (GRID_SIZE * GRID_SIZE));
        }

        emit TreasureMoved(treasurePosition);
    }

    function getNewPosition(uint8 currentPosition, uint8 direction) internal pure returns (uint8) {
        if (direction == 0) { // Up
            return currentPosition >= GRID_SIZE ? currentPosition - GRID_SIZE : currentPosition;
        } else if (direction == 1) { // Down
            return currentPosition + GRID_SIZE < GRID_POSITIONS ? currentPosition + GRID_SIZE : currentPosition;
        } else if (direction == 2) { // Left
            return currentPosition % GRID_SIZE != 0 ? currentPosition - 1 : currentPosition;
        } else { // Right
            return (currentPosition + 1) % GRID_SIZE != 0 ? currentPosition + 1 : currentPosition;
        }
    }

    function isPrime(uint8 number) internal pure returns (bool) {
        if (number < 2) return false;
        for (uint8 i = 2; i <= number / 2; i++) {
            if (number % i == 0) return false;
        }
        return true;
    }

    receive() external payable {
        gameBalance += msg.value;
    }

}
