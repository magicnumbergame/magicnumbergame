// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { VRFCoordinatorV2Interface } from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import { VRFConsumerBaseV2 } from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract GuessTheNumber is VRFConsumerBaseV2 {
    uint256 public constant ENTRY_FEE = 0.025 ether;
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public constant MIN_GUESS = 1;
    uint256 public constant MAX_GUESS = 10000;
    uint256 public constant DEV_FEE_PERCENT = 150; // 1.5% (scaled by 10000)

    struct Player {
        address payable playerAddress;
        uint256 guess;
    }

    Player[] public players;
    uint256 public winningNumber;
    bool public gameActive;
    mapping(address => bool) public hasGuessed;
    uint256 public totalPot;
    address public lastWinner;
    uint256 public lastWinningNumber;

    event PlayerJoined(address indexed player, uint256 guess);
    event RandomNumberRequested(uint256 requestId);
    event WinnersDeclared(uint256 winningNumber, address[] winners, uint256 reward);

    constructor(address _vrfCoordinator, uint256 _subscriptionId, bytes32 _keyHash) VRFConsumerBaseV2(_vrfCoordinator) {
        // VRF initialization code...
        gameActive = true;
    }

    function enterGuess(uint256 _guess) external payable {
        require(gameActive, "Game is not active");
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        require(_guess >= MIN_GUESS && _guess <= MAX_GUESS, "Guess out of range");
        require(players.length < MAX_PLAYERS, "Max players reached");
        require(!hasGuessed[msg.sender], "Player has already guessed");

        players.push(Player(payable(msg.sender), _guess));
        hasGuessed[msg.sender] = true;
        totalPot += msg.value;
        emit PlayerJoined(msg.sender, _guess);

        if (players.length == MAX_PLAYERS) {
            requestRandomNumber();
        }
    }

    function requestRandomNumber() internal {
        require(gameActive, "Game is already inactive");
        gameActive = false;
        // VRF request code...
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords) internal override {
        winningNumber = (randomWords[0] % MAX_GUESS) + 1;
        distributeRewards();
    }

    function distributeRewards() internal {
        require(winningNumber > 0, "Winning number not set");

        // Reward distribution logic...

        lastWinningNumber = winningNumber;
        
        // Payout winners...

        emit WinnersDeclared(winningNumber, winners, rewardPool);
        resetGame();
    }

    function resetGame() internal {
        uint256 playersToClear = players.length > 5 ? 5 : players.length; 
        for (uint256 i = 0; i < playersToClear; i++) {
            hasGuessed[players[players.length - 1].playerAddress] = false;
            players.pop();
        }

        if (players.length == 0) {
            delete players;
            winningNumber = 0;
            totalPot = 0;
            gameActive = true;
        }
    }

    function getGameStatus() external view returns (
        bool gameStatus,
        uint256 playerCount,
        uint256 pot,
        address lastWin,
        uint256 lastWinNum
    ) {
        return (gameActive, players.length, totalPot, lastWinner, lastWinningNumber);
    }

    function isPlayerInGame(address player) external view returns (bool) {
        return hasGuessed[player];
    }

    function getPlayerGuess(address player) external view returns (uint256) {
        for (uint256 i = 0; i < players.length; i++) {
            if (players[i].playerAddress == player) {
                return players[i].guess;
            }
        }
        return 0; // Return 0 if the player has not entered
    }
}

