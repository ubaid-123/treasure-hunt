# Treasure Hunt
![image](https://github.com/user-attachments/assets/02247e77-48e3-46aa-8372-c298e0fbd247)

# Design Choices
1. For storing player positions I declared a mapping.
2. If the player is joined then isPlayerJoined will 'true'.
3. Player will call join game function If user wants to make move.
4. For randomness, I uses blockhash and block number to generate random number.

# Installation
npm install

# Compile
npx hardhat compile

# Test
npx hardhat test
