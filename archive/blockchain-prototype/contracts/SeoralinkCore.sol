// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SeoralinkCore
 * @dev Implements the SEORALINK business model.
 */
contract SeoralinkCore is ReentrancyGuard, Pausable, Ownable {
    IERC20 public immutable usdtToken;
    address public protocolReserve;

    uint256 public constant DECIMALS = 1e6;
    
    uint256[13] public tierValues = [
        10 * DECIMALS,    // 0: Junior
        10 * DECIMALS,    // 1: Zen
        20 * DECIMALS,    // 2: Alpha
        40 * DECIMALS,    // 3: Nova
        80 * DECIMALS,    // 4: Valt
        160 * DECIMALS,   // 5: Apex
        320 * DECIMALS,   // 6: Orbit
        640 * DECIMALS,   // 7: Prime
        1280 * DECIMALS,  // 8: Elite
        2560 * DECIMALS,  // 9: Titan
        5120 * DECIMALS,  // 10: Royal
        10240 * DECIMALS, // 11: Legend
        20480 * DECIMALS  // 12: Ultima
    ];

    uint16[13] public requiredDirects = [0, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6];

    uint256 public constant DEDUCTION_RATE = 2000; // 20%
    uint256 public constant ULTIMA_DEDUCTION_RATE = 1000; // 10%
    uint256 public constant DIRECT_COMMISSION_RATE = 500; // 5%
    uint256 public constant OVERRIDE_COMMISSION_RATE = 500; // 5%
    uint256 public constant BASIS_POINT_DENOMINATOR = 10000;

    struct User {
        address sponsor;
        uint8 currentTier;
        uint16 directCount;
        uint256 totalEarnings;
        uint256 joinedAt;
        bool isActive;
    }

    struct QueueEntry {
        address user;
        uint256 timestamp;
    }

    mapping(address => User) public users;
    
    mapping(uint8 => QueueEntry[]) public tierQueues;
    mapping(uint8 => uint256) public queueFrontIndex;

    address public genesisNode;

    event UserRegistered(address indexed user, address indexed sponsor, uint256 timestamp);
    event DirectCommissionPaid(address indexed sponsor, address indexed from, uint256 amount);
    event QueueMatched(address indexed user, uint8 indexed tier, uint256 grossReward, uint256 netPayout);
    event RankUpgrade(address indexed user, uint8 fromTier, uint8 toTier);
    event OverridePaid(address indexed sponsor, address indexed mentee, uint8 tier, uint256 amount);
    event ProtocolReserveUpdated(address indexed oldReserve, address indexed newReserve);

    /**
     * @dev Constructor
     * @param _usdtToken Address of USDT token contract
     * @param _protocolReserve Address for protocol reserve deductions
     * @param _genesisNode Genesis node address to start the network
     */
    constructor(
        address _usdtToken,
        address _protocolReserve,
        address _genesisNode
    ) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid token");
        require(_protocolReserve != address(0), "Invalid reserve");
        require(_genesisNode != address(0), "Invalid genesis");

        usdtToken = IERC20(_usdtToken);
        protocolReserve = _protocolReserve;
        genesisNode = _genesisNode;

        users[_genesisNode] = User({
            sponsor: address(0),
            currentTier: 0,
            directCount: 100, // Sufficient directs for all tiers
            totalEarnings: 0,
            joinedAt: block.timestamp,
            isActive: true
        });
    }

    /**
     * @dev Set protocol reserve address
     * @param _newReserve New reserve address
     */
    function setProtocolReserve(address _newReserve) external onlyOwner {
        require(_newReserve != address(0), "Invalid reserve");
        emit ProtocolReserveUpdated(protocolReserve, _newReserve);
        protocolReserve = _newReserve;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Registers a new user. Requires 10 USDT transfer.
     * @param _sponsor The address of the referring user
     */
    function register(address _sponsor) external nonReentrant whenNotPaused {
        require(msg.sender != _sponsor, "Cannot self-sponsor");
        require(!users[msg.sender].isActive, "Already registered");
        require(users[_sponsor].isActive, "Invalid sponsor");

        uint256 entryFee = tierValues[0];
        
        // Transfer 10 USDT from user
        require(usdtToken.transferFrom(msg.sender, address(this), entryFee), "Transfer failed");

        // Set up user
        users[msg.sender] = User({
            sponsor: _sponsor,
            currentTier: 0,
            directCount: 0,
            totalEarnings: 0,
            joinedAt: block.timestamp,
            isActive: true
        });

        // Increment sponsor directs
        users[_sponsor].directCount += 1;

        // Pay direct commission
        uint256 directComm = (entryFee * DIRECT_COMMISSION_RATE) / BASIS_POINT_DENOMINATOR;
        require(usdtToken.transfer(_sponsor, directComm), "Commission transfer failed");
        users[_sponsor].totalEarnings += directComm;
        
        emit DirectCommissionPaid(_sponsor, msg.sender, directComm);
        emit UserRegistered(msg.sender, _sponsor, block.timestamp);

        // Place in Junior queue
        _addToQueue(msg.sender, 0);
    }

    /**
     * @dev Adds user to tier queue and attempts matching
     */
    function _addToQueue(address _user, uint8 _tier) internal {
        tierQueues[_tier].push(QueueEntry({
            user: _user,
            timestamp: block.timestamp
        }));

        _processQueue(_tier);
    }

    /**
     * @dev Process the FIFO queue for a specific tier using 2:1 matching law.
     * Each member at `front` requires 2 entries arriving after them (indices 2*front+1 and 2*front+2).
     * Therefore, matching occurs whenever queue length >= 2 * front + 3.
     */
    function _processQueue(uint8 _tier) internal {
        while (tierQueues[_tier].length >= 2 * queueFrontIndex[_tier] + 3) {
            uint256 front = queueFrontIndex[_tier];
            address matchedUser = tierQueues[_tier][front].user;
            queueFrontIndex[_tier] = front + 1;

            uint256 grossReward = tierValues[_tier];
            uint256 deductionRate = _tier == 12 ? ULTIMA_DEDUCTION_RATE : DEDUCTION_RATE;
            
            uint256 deduction = (grossReward * deductionRate) / BASIS_POINT_DENOMINATOR;
            uint256 netPayout = grossReward - deduction;

            // Update earnings
            users[matchedUser].totalEarnings += netPayout;

            // Pay net payout to matched user
            require(usdtToken.transfer(matchedUser, netPayout), "Payout failed");

            // Pay protocol reserve
            require(usdtToken.transfer(protocolReserve, deduction), "Reserve transfer failed");
            
            // Pay sponsor override
            address matchedSponsor = users[matchedUser].sponsor;
            if (matchedSponsor != address(0)) {
                uint256 overrideAmount = (grossReward * OVERRIDE_COMMISSION_RATE) / BASIS_POINT_DENOMINATOR;
                require(usdtToken.transfer(matchedSponsor, overrideAmount), "Override failed");
                users[matchedSponsor].totalEarnings += overrideAmount;
                emit OverridePaid(matchedSponsor, matchedUser, _tier, overrideAmount);
            }

            emit QueueMatched(matchedUser, _tier, grossReward, netPayout);

            // Auto-upgrade
            uint8 nextTier = _tier + 1;
            if (nextTier <= 12 && _checkDirectRequirement(matchedUser, nextTier)) {
                users[matchedUser].currentTier = nextTier;
                emit RankUpgrade(matchedUser, _tier, nextTier);
                _addToQueue(matchedUser, nextTier);
            }
        }
    }

    /**
     * @dev Checks if user has enough direct referrals for a tier
     */
    function _checkDirectRequirement(address _user, uint8 _nextTier) internal view returns (bool) {
        return users[_user].directCount >= requiredDirects[_nextTier];
    }

    /**
     * @dev Get active queue length
     */
    function getQueueLength(uint8 _tier) external view returns (uint256) {
        return tierQueues[_tier].length - queueFrontIndex[_tier];
    }

    /**
     * @dev Get user info
     */
    function getUserInfo(address _user) external view returns (User memory) {
        return users[_user];
    }

    /**
     * @dev Get position in queue. 0 means at the front.
     */
    function getQueuePosition(address _user, uint8 _tier) external view returns (uint256 position, bool found) {
        uint256 front = queueFrontIndex[_tier];
        uint256 length = tierQueues[_tier].length;
        
        for (uint256 i = front; i < length; i++) {
            if (tierQueues[_tier][i].user == _user) {
                return (i - front, true);
            }
        }
        return (0, false);
    }
}
