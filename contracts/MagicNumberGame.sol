// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IVRFCoordinatorV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GuessTheNumber is VRFConsumerBaseV2Plus, ReentrancyGuard {
    // Events
    event PlayerJoined(address indexed player, uint256 guess);
    event RandomNumberRequested(uint256 requestId);
    event WinnerDeclared(address indexed winner, uint256 winningNumber, uint256 ethReward, uint256 mngReward);
    event MNGRewardDistributed(address indexed player, uint256 amount);
    event VRFFailure(string reason);
    event GameReset();

    // Structs
    struct Player {
        address payable playerAddress;
        uint256 guess;
    }

    struct RequestStatus {
        bool fulfilled;
        bool exists;
        uint256[] randomWords;
    }

    // Constants
    uint256 public constant ENTRY_FEE = 0.025 ether;
    uint256 public constant MAX_PLAYERS = 3;
    uint256 public constant MIN_GUESS = 1;
    uint256 public constant MAX_GUESS = 10000;
    uint256 public constant DEV_FEE_PERCENT = 150; // 1.5%

    // MNG Rewards
    uint256 public constant PLAYER_REWARD = 50 * 10**18; // 50 MNG per player
    uint256 public constant WINNER_REWARD = 500 * 10**18; // 500 MNG per winner

    // State Variables
    address payable public devTeam;
    uint256 public winningNumber;
    bool public gameActive = true;
    bool public vrfRequested = false;

    Player[] public players;
    mapping(address => bool) public hasGuessed;
    mapping(uint256 => RequestStatus) public requests;

    IVRFCoordinatorV2Plus public COORDINATOR;
    IERC20 public MNGToken;

    uint256 public subscriptionId;
    bytes32 public keyHash;
    uint16 public requestConfirmations = 3;
    uint32 public callbackGasLimit = 300000;
    uint32 public numWords = 1;

    uint256[] public requestIds;
    uint256 public lastRequestId;

    // Constructor
    constructor(
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash,
        address payable _devTeam,
        address _MNGToken
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        COORDINATOR = IVRFCoordinatorV2Plus(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        devTeam = _devTeam;
        MNGToken = IERC20(_MNGToken);
    }

    // Fallback Functions
    receive() external payable {}
    fallback() external payable {}

    // Player enters a guess
    function enterGuess(uint256 _guess) external payable nonReentrant {
        require(gameActive, "Game is not active");
        require(msg.value == ENTRY_FEE, "Incorrect entry fee");
        require(_guess >= MIN_GUESS && _guess <= MAX_GUESS, "Guess out of range");
        require(players.length < MAX_PLAYERS, "Max players reached");
        require(!hasGuessed[msg.sender], "Player has already guessed");

        players.push(Player(payable(msg.sender), _guess));
        hasGuessed[msg.sender] = true;
        emit PlayerJoined(msg.sender, _guess);

        if (players.length == MAX_PLAYERS) {
            requestRandomNumber(true);
        }
    }

    // Request a random number from Chainlink VRF
    function requestRandomNumber(bool enableNativePayment) internal {
        require(gameActive, "Game is not active");
        require(!vrfRequested, "VRF already requested");
        gameActive = false;
        vrfRequested = true;

        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: requestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: enableNativePayment})
            )
        });

        uint256 requestId = COORDINATOR.requestRandomWords(req);

        requests[requestId] = RequestStatus({
            exists: true,
            fulfilled: false,
            randomWords: new uint256[](0)
        });

        requestIds.push(requestId);
        lastRequestId = requestId;
        emit RandomNumberRequested(requestId);
    }

    // Fulfill the VRF request and store the random number
    function fulfillRandomWords(uint256 _requestId, uint256[] calldata _randomWords) internal override {
        require(requests[_requestId].exists, "Request not found");
        requests[_requestId].fulfilled = true;
        requests[_requestId].randomWords = _randomWords;

        if (_randomWords.length == 0) {
            emit VRFFailure("VRF returned no random words.");
            vrfRequested = false;
            gameActive = true;
            return;
        }

        winningNumber = (_randomWords[0] % MAX_GUESS) + 1;
        distributeRewards();
    }

    // Distribute ETH and MNG rewards
    function distributeRewards() internal nonReentrant {
        require(winningNumber > 0, "Winning number not set");

        uint256 totalReward = address(this).balance;
        uint256 devFee = (totalReward * DEV_FEE_PERCENT) / 10000;
        uint256 rewardPool = totalReward - devFee;
        uint256 closestDifference = MAX_GUESS;
        address[] memory winners = new address[](MAX_PLAYERS);
        uint256 winnerCount = 0;

        // Find winners
        for (uint256 i = 0; i < players.length; i++) {
            uint256 diff = (winningNumber > players[i].guess)
                ? winningNumber - players[i].guess
                : players[i].guess - winningNumber;

            if (diff < closestDifference) {
                closestDifference = diff;
                winnerCount = 1;
                winners[0] = players[i].playerAddress;
            } else if (diff == closestDifference) {
                winners[winnerCount] = players[i].playerAddress;
                winnerCount++;
            }
        }

        // Distribute ETH rewards to winners
        if (winnerCount > 0) {
            uint256 payout = rewardPool / winnerCount;
            for (uint256 i = 0; i < winnerCount; i++) {
                (bool success, ) = payable(winners[i]).call{value: payout}("");
                if (!success) {
                    emit VRFFailure("ETH transfer to winner failed");
                } else {
                    emit WinnerDeclared(winners[i], winningNumber, payout, WINNER_REWARD);
                }
            }
        }

        // Distribute MNG rewards to winners
        for (uint256 i = 0; i < winnerCount; i++) {
            bool mngWinSuccess = MNGToken.transfer(winners[i], WINNER_REWARD);
            if (!mngWinSuccess) {
                emit VRFFailure("MNG transfer to winner failed");
            } else {
                emit MNGRewardDistributed(winners[i], WINNER_REWARD);
            }
        }

        // Distribute MNG rewards to all players
        for (uint256 i = 0; i < players.length; i++) {
            bool mngPlayerSuccess = MNGToken.transfer(players[i].playerAddress, PLAYER_REWARD);
            if (!mngPlayerSuccess) {
                emit VRFFailure("MNG transfer to player failed");
            } else {
                emit MNGRewardDistributed(players[i].playerAddress, PLAYER_REWARD);
            }
        }

        // Transfer dev fee
        if (devFee > 0) {
            (bool devPaid, ) = devTeam.call{value: devFee}("");
            if (!devPaid) {
                emit VRFFailure("Dev team transfer failed");
            }
        }

        resetGame();
    }

    // Reset the game state
    function resetGame() internal {
        for (uint256 i = 0; i < players.length; i++) {
            hasGuessed[players[i].playerAddress] = false;
        }
        delete players;
        winningNumber = 0;
        gameActive = true;
        vrfRequested = false;
        emit GameReset();
    }
}

