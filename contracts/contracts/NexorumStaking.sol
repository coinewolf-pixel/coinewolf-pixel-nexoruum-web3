// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NexorumStaking
 * @notice A real staking contract for the NEX token, replacing the
 * previous fake in-memory staking data (where "staking" just incremented
 * numbers in a JS object with no tokens actually moving anywhere).
 *
 * Users approve() this contract, then stake() into one of four pools
 * (mirroring the pools shown in the app's UI). Rewards accrue linearly
 * over time based on each pool's APY and are paid out in NEX from this
 * contract's own token balance — the owner must fund that reward pool
 * separately (see fundRewardPool()), since NexorumToken has a fixed
 * supply and cannot be minted after deployment.
 */
contract NexorumStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable nexToken;

    struct Pool {
        uint256 lockDays; // 0 = flexible, withdrawable anytime
        uint256 apyBasisPoints; // e.g. 1820 = 18.20%
        uint256 minStake;
        bool active;
    }

    struct Stake {
        address owner;
        uint8 poolId;
        uint256 amount;
        uint256 startTime;
        uint256 claimedReward;
        bool withdrawn;
    }

    Pool[] public pools;
    Stake[] public stakes;
    mapping(address => uint256[]) public stakesByUser;

    event PoolAdded(uint8 indexed poolId, uint256 lockDays, uint256 apyBasisPoints, uint256 minStake);
    event Staked(uint256 indexed stakeId, address indexed user, uint8 indexed poolId, uint256 amount);
    event Unstaked(uint256 indexed stakeId, address indexed user, uint256 principal, uint256 reward);
    event RewardClaimed(uint256 indexed stakeId, address indexed user, uint256 reward);
    event RewardPoolFunded(address indexed from, uint256 amount);

    constructor(address tokenAddress) Ownable(msg.sender) {
        nexToken = IERC20(tokenAddress);

        // Seed the same 4 pools shown in the app UI. lockDays=0 means
        // flexible (withdrawable anytime, no lock penalty).
        _addPool(0, 850, 10 ether); // Flexible — 8.5% APY, 10 NEX min
        _addPool(30, 1820, 50 ether); // 30-Day — 18.2% APY, 50 NEX min
        _addPool(90, 3650, 100 ether); // 90-Day — 36.5% APY, 100 NEX min
        _addPool(365, 8500, 500 ether); // 365-Day — 85% APY, 500 NEX min
    }

    function _addPool(uint256 lockDays, uint256 apyBasisPoints, uint256 minStake) internal {
        pools.push(Pool({lockDays: lockDays, apyBasisPoints: apyBasisPoints, minStake: minStake, active: true}));
        emit PoolAdded(uint8(pools.length - 1), lockDays, apyBasisPoints, minStake);
    }

    /// @notice Owner-only: add a new pool without redeploying the contract.
    function addPool(uint256 lockDays, uint256 apyBasisPoints, uint256 minStake) external onlyOwner {
        _addPool(lockDays, apyBasisPoints, minStake);
    }

    /// @notice Owner-only: enable/disable a pool for new stakes (existing stakes unaffected).
    function setPoolActive(uint8 poolId, bool active) external onlyOwner {
        require(poolId < pools.length, "Invalid pool");
        pools[poolId].active = active;
    }

    /// @notice Anyone can top up the reward pool — typically the project owner.
    function fundRewardPool(uint256 amount) external {
        nexToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardPoolFunded(msg.sender, amount);
    }

    /// @notice Stake `amount` of NEX into pool `poolId`. Requires prior approve().
    function stake(uint8 poolId, uint256 amount) external nonReentrant returns (uint256 stakeId) {
        require(poolId < pools.length, "Invalid pool");
        Pool memory pool = pools[poolId];
        require(pool.active, "Pool not active");
        require(amount >= pool.minStake, "Below pool minimum");

        nexToken.safeTransferFrom(msg.sender, address(this), amount);

        stakeId = stakes.length;
        stakes.push(
            Stake({
                owner: msg.sender,
                poolId: poolId,
                amount: amount,
                startTime: block.timestamp,
                claimedReward: 0,
                withdrawn: false
            })
        );
        stakesByUser[msg.sender].push(stakeId);

        emit Staked(stakeId, msg.sender, poolId, amount);
    }

    /// @notice Reward accrued so far for a stake, not yet claimed/withdrawn.
    function pendingReward(uint256 stakeId) public view returns (uint256) {
        Stake memory s = stakes[stakeId];
        if (s.withdrawn) return 0;
        Pool memory pool = pools[s.poolId];
        uint256 elapsed = block.timestamp - s.startTime;
        // linear APY accrual: amount * apyBps/10000 * elapsed/365days
        uint256 totalAccrued = (s.amount * pool.apyBasisPoints * elapsed) / (10000 * 365 days);
        if (totalAccrued <= s.claimedReward) return 0;
        return totalAccrued - s.claimedReward;
    }

    /// @notice Claim accrued rewards without unstaking the principal.
    function claimReward(uint256 stakeId) external nonReentrant {
        Stake storage s = stakes[stakeId];
        require(s.owner == msg.sender, "Not your stake");
        require(!s.withdrawn, "Already withdrawn");

        uint256 reward = pendingReward(stakeId);
        require(reward > 0, "Nothing to claim");
        require(nexToken.balanceOf(address(this)) >= reward, "Reward pool depleted");

        s.claimedReward += reward;
        nexToken.safeTransfer(msg.sender, reward);

        emit RewardClaimed(stakeId, msg.sender, reward);
    }

    /// @notice Withdraw principal + any remaining reward. Reverts if the
    /// pool's lock period hasn't elapsed yet (flexible pool has none).
    function unstake(uint256 stakeId) external nonReentrant {
        Stake storage s = stakes[stakeId];
        require(s.owner == msg.sender, "Not your stake");
        require(!s.withdrawn, "Already withdrawn");

        Pool memory pool = pools[s.poolId];
        if (pool.lockDays > 0) {
            require(block.timestamp >= s.startTime + pool.lockDays * 1 days, "Still locked");
        }

        uint256 reward = pendingReward(stakeId);
        uint256 principal = s.amount;
        s.withdrawn = true;

        uint256 payout = principal;
        if (reward > 0 && nexToken.balanceOf(address(this)) >= principal + reward) {
            payout += reward;
            s.claimedReward += reward;
        }
        // If the reward pool can't cover the accrued reward, principal is
        // still always returned in full — only the reward portion is
        // capped by what's actually funded.

        nexToken.safeTransfer(msg.sender, payout);

        emit Unstaked(stakeId, msg.sender, principal, payout - principal);
    }

    function getUserStakeIds(address user) external view returns (uint256[] memory) {
        return stakesByUser[user];
    }

    function getPool(uint8 poolId) external view returns (Pool memory) {
        return pools[poolId];
    }

    function poolCount() external view returns (uint256) {
        return pools.length;
    }

    function stakeCount() external view returns (uint256) {
        return stakes.length;
    }
}
