// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ChoreAgent.sol";

// ── Minimal ERC-20 mock ────────────────────────────────────────────────────────
contract MockCUSD {
    mapping(address => uint256)                     public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    string public name     = "Celo Dollar";
    string public symbol   = "cUSD";
    uint8  public decimals = 18;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to]         += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount,          "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        balanceOf[from]            -= amount;
        allowance[from][msg.sender] -= amount;
        balanceOf[to]              += amount;
        return true;
    }
}

// ── Tests ──────────────────────────────────────────────────────────────────────
contract ChoreAgentTest is Test {
    ChoreAgent  public choreAgent;
    MockCUSD    public cUSD;

    address public agent   = makeAddr("agent");
    address public owner   = makeAddr("owner");
    address public alice   = makeAddr("alice");
    address public bob     = makeAddr("bob");
    address public carol   = makeAddr("carol");

    uint256 constant CONTRIBUTION = 25e18;   // 25 cUSD
    uint256 constant CYCLE        = 7 days;

    address[] members;

    function setUp() public {
        vm.startPrank(owner);
        choreAgent = new ChoreAgent(agent);
        cUSD       = new MockCUSD();
        vm.stopPrank();

        members = [alice, bob, carol];

        // Fund members
        cUSD.mint(alice, 1000e18);
        cUSD.mint(bob,   1000e18);
        cUSD.mint(carol, 1000e18);

        // Approve contract for many cycles
        vm.prank(alice); cUSD.approve(address(choreAgent), type(uint256).max);
        vm.prank(bob);   cUSD.approve(address(choreAgent), type(uint256).max);
        vm.prank(carol); cUSD.approve(address(choreAgent), type(uint256).max);
    }

    // ─── Group creation ─────────────────────────────────────────────────────

    function test_createGroup_succeeds() public {
        uint256 id = _createGroup();
        (
            string memory name,,,,,, uint8 round,
            ChoreAgent.GroupStatus status,
        ) = choreAgent.getGroup(id);

        assertEq(name, "Test Circle");
        assertEq(round, 0);
        assertEq(uint8(status), uint8(ChoreAgent.GroupStatus.Active));
    }

    function test_createGroup_emitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit ChoreAgent.GroupCreated(0, "Test Circle", address(this), CONTRIBUTION, CYCLE, members);
        choreAgent.createGroup("Test Circle", address(cUSD), CONTRIBUTION, CYCLE, members);
    }

    function test_createGroup_revertsWithOneMembers() public {
        address[] memory single = new address[](1);
        single[0] = alice;
        vm.expectRevert(ChoreAgent.InvalidMembers.selector);
        choreAgent.createGroup("Bad", address(cUSD), CONTRIBUTION, CYCLE, single);
    }

    function test_createGroup_revertsZeroAmount() public {
        vm.expectRevert(ChoreAgent.ZeroAmount.selector);
        choreAgent.createGroup("Bad", address(cUSD), 0, CYCLE, members);
    }

    // ─── Cycle execution ────────────────────────────────────────────────────

    function test_runCycle_roundZero_aliceReceivesPot() public {
        uint256 id = _createGroup();
        uint256 aliceBefore = cUSD.balanceOf(alice);

        vm.warp(block.timestamp + CYCLE + 1);
        vm.prank(agent);
        choreAgent.runCycle(id);

        // alice contributed AND received the pot
        uint256 pot = CONTRIBUTION * 3; // 3 members
        assertEq(cUSD.balanceOf(alice), aliceBefore - CONTRIBUTION + pot);
        assertEq(cUSD.balanceOf(bob),   1000e18 - CONTRIBUTION);
        assertEq(cUSD.balanceOf(carol), 1000e18 - CONTRIBUTION);
    }

    function test_runCycle_advancesRound() public {
        uint256 id = _createGroup();
        vm.warp(block.timestamp + CYCLE + 1);
        vm.prank(agent); choreAgent.runCycle(id);

        (,,,,,, uint8 round,,) = choreAgent.getGroup(id);
        assertEq(round, 1); // bob is next
    }

    function test_runCycle_tooEarlyReverts() public {
        uint256 id = _createGroup();
        vm.prank(agent);
        vm.expectRevert();
        choreAgent.runCycle(id);
    }

    function test_runCycle_onlyAgent() public {
        uint256 id = _createGroup();
        vm.warp(block.timestamp + CYCLE + 1);
        vm.prank(alice);
        vm.expectRevert(ChoreAgent.NotAgent.selector);
        choreAgent.runCycle(id);
    }

    function test_runCycle_emitsCycleRun() public {
        uint256 id = _createGroup();
        vm.warp(block.timestamp + CYCLE + 1);

        vm.expectEmit(true, false, true, false);
        emit ChoreAgent.CycleRun(id, 0, alice, CONTRIBUTION * 3, block.timestamp);

        vm.prank(agent);
        choreAgent.runCycle(id);
    }

    function test_runCycle_fullRotationCompletesGroup() public {
        uint256 id = _createGroup();

        // Run all 3 rounds
        for (uint256 i = 0; i < 3; i++) {
            vm.warp(block.timestamp + CYCLE + 1);
            vm.prank(agent);
            choreAgent.runCycle(id);
        }

        (,,,,,,,ChoreAgent.GroupStatus status,) = choreAgent.getGroup(id);
        assertEq(uint8(status), uint8(ChoreAgent.GroupStatus.Completed));
    }

    function test_runCycle_skipsInsufficientAllowance() public {
        uint256 id = _createGroup();

        // Bob revokes allowance
        vm.prank(bob);
        cUSD.approve(address(choreAgent), 0);

        vm.warp(block.timestamp + CYCLE + 1);
        vm.prank(agent);

        // Should not revert — just emits CollectionFailed for bob
        choreAgent.runCycle(id);

        // Pot = only alice + carol contributions
        (,,,,,, uint8 round,,) = choreAgent.getGroup(id);
        assertEq(round, 1); // still advanced
    }

    // ─── Restart ────────────────────────────────────────────────────────────

    function test_restartGroup_afterCompletion() public {
        uint256 id = _createGroup(); // created by address(this)
        for (uint256 i = 0; i < 3; i++) {
            vm.warp(block.timestamp + CYCLE + 1);
            vm.prank(agent);
            choreAgent.runCycle(id);
        }

        // address(this) is the creator, call directly (no prank needed)
        choreAgent.restartGroup(id);

        (,,,,,, uint8 round, ChoreAgent.GroupStatus status,) = choreAgent.getGroup(id);
        assertEq(round, 0);
        assertEq(uint8(status), uint8(ChoreAgent.GroupStatus.Active));
    }

    // ─── Admin ──────────────────────────────────────────────────────────────

    function test_setAgentAddress() public {
        address newAgent = makeAddr("newAgent");
        vm.prank(owner);
        choreAgent.setAgentAddress(newAgent);
        assertEq(choreAgent.agentAddress(), newAgent);
    }

    function test_setAgentAddress_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(ChoreAgent.NotOwner.selector);
        choreAgent.setAgentAddress(alice);
    }

    function test_pauseAndResume() public {
        uint256 id = _createGroup();
        vm.prank(owner); choreAgent.pauseGroup(id);

        (,,,,,,,ChoreAgent.GroupStatus status,) = choreAgent.getGroup(id);
        assertEq(uint8(status), uint8(ChoreAgent.GroupStatus.Paused));

        vm.warp(block.timestamp + CYCLE + 1);
        vm.prank(agent);
        vm.expectRevert(ChoreAgent.GroupNotActive.selector);
        choreAgent.runCycle(id);

        vm.prank(owner); choreAgent.resumeGroup(id);
        vm.prank(agent); choreAgent.runCycle(id); // should pass now
    }

    // ─── Views ──────────────────────────────────────────────────────────────

    function test_getMembers() public {
        uint256 id = _createGroup();
        address[] memory m = choreAgent.getMembers(id);
        assertEq(m[0], alice);
        assertEq(m[1], bob);
        assertEq(m[2], carol);
    }

    function test_nextCycleAt() public {
        uint256 start = block.timestamp;
        uint256 id    = _createGroup();
        assertEq(choreAgent.nextCycleAt(id), start + CYCLE);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    function _createGroup() internal returns (uint256) {
        return choreAgent.createGroup(
            "Test Circle",
            address(cUSD),
            CONTRIBUTION,
            CYCLE,
            members
        );
    }
}
