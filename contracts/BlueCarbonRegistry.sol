// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * ============================================================================
 *  CarbonCreditToken
 * ----------------------------------------------------------------------------
 *  A minimal, self-contained ERC20-style token representing issued blue
 *  carbon credits (1 token = 1 tCO2e). Written from scratch (no OpenZeppelin
 *  dependency) so it compiles with zero external packages -- swap in
 *  openzeppelin Contracts' ERC20 + AccessControl for a production build.
 *
 *  - mint()   is restricted to the BlueCarbonRegistry contract and is called
 *             only after a project passes MRV + verifier approval.
 *  - burn()   is the "retirement" operation: a holder permanently destroys
 *             credits to claim the environmental benefit. Retired supply can
 *             never be reissued or re-transferred, which is the core
 *             anti-double-counting guarantee of the whole system.
 * ============================================================================
 */
contract CarbonCreditToken {
    string public constant name = "Blue Carbon Credit";
    string public constant symbol = "BCC";
    uint8  public constant decimals = 0; // 1 token = 1 whole tCO2e

    address public admin;   // deployer / regulator multisig in production
    address public minter;  // set to the BlueCarbonRegistry contract address

    uint256 public totalSupply;
    uint256 public totalRetired;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event CreditsMinted(address indexed to, uint256 amount, uint256 indexed projectId);
    event CreditsRetired(address indexed holder, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "CarbonCreditToken: caller is not admin");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "CarbonCreditToken: caller is not the registry/minter");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice One-time (or admin-controlled) wiring of the registry contract as the sole minter.
    function setMinter(address registryAddress) external onlyAdmin {
        require(registryAddress != address(0), "CarbonCreditToken: zero address");
        minter = registryAddress;
    }

    /// @notice Called by BlueCarbonRegistry.issueCredits() after MRV + verifier approval.
    function mint(address to, uint256 amount, uint256 projectId) external onlyMinter {
        require(to != address(0), "CarbonCreditToken: mint to zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
        emit CreditsMinted(to, amount, projectId);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "CarbonCreditToken: allowance exceeded");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    /// @notice Permanently retires (burns) credits from the caller's own balance.
    function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "CarbonCreditToken: insufficient balance to retire");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        totalRetired += amount;
        emit Transfer(msg.sender, address(0), amount);
        emit CreditsRetired(msg.sender, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "CarbonCreditToken: transfer to zero address");
        require(balanceOf[from] >= amount, "CarbonCreditToken: insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}

/**
 * ============================================================================
 *  BlueCarbonRegistry
 * ----------------------------------------------------------------------------
 *  Implements the three modules described in the synopsis:
 *    1) Blue Carbon Registry        -> registerProject()
 *    2) Automated MRV                -> submitMrvResult() (called by an
 *                                        off-chain oracle / backend service
 *                                        that has run the automated checks
 *                                        against satellite + environmental
 *                                        data) and verifierDecision() (human
 *                                        sign-off by an authorised verifier)
 *    3) Smart-contract credit mgmt   -> issueCredits() / CarbonCreditToken
 * ============================================================================
 */
contract BlueCarbonRegistry {
    enum Ecosystem { Mangrove, Seagrass, SaltMarsh }
    enum Status { Pending, AutoVerified, Flagged, Approved, Rejected }

    // Sequestration rates in tCO2e / hectare / year, scaled by 10 (one decimal place)
    // Mangrove 6.2, Seagrass 3.7, Salt Marsh 2.9 -- adjust to match your literature review.
    uint256 constant RATE_MANGROVE = 62;
    uint256 constant RATE_SEAGRASS = 37;
    uint256 constant RATE_SALTMARSH = 29;

    struct Project {
        uint256 id;
        string name;
        Ecosystem ecosystem;
        string location;
        uint256 areaHaScaled;   // hectares * 100 (2 decimal places), e.g. 45.50 ha -> 4550
        address owner;
        string docHash;         // IPFS CID of supporting documents
        Status status;
        string mrvReportHash;   // IPFS CID of the automated MRV report JSON
        string verifierNote;
        bool creditsIssued;
        uint256 creditsAmount;
        uint256 registeredAt;
    }

    address public owner;                              // regulator authority (deployer)
    CarbonCreditToken public creditToken;

    mapping(address => bool) public verifiers;          // authorised human verifiers
    mapping(address => bool) public oracles;             // backend services allowed to submit MRV results
    mapping(uint256 => Project) public projects;
    uint256 public projectCount;

    event ProjectRegistered(uint256 indexed id, address indexed owner, string name, Ecosystem ecosystem, uint256 areaHaScaled);
    event MrvResultSubmitted(uint256 indexed id, Status status, string reportHash);
    event VerifierDecisionMade(uint256 indexed id, address indexed verifier, Status status, string note);
    event CreditsIssued(uint256 indexed id, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Registry: caller is not the regulator/owner");
        _;
    }
    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Registry: caller is not an authorised verifier");
        _;
    }
    modifier onlyOracle() {
        require(oracles[msg.sender] || msg.sender == owner, "Registry: caller is not an authorised MRV oracle");
        _;
    }

    constructor(address creditTokenAddress) {
        owner = msg.sender;
        creditToken = CarbonCreditToken(creditTokenAddress);
    }

    // ---------------------------------------------------------------- admin
    function addVerifier(address account) external onlyOwner {
        verifiers[account] = true;
    }

    function removeVerifier(address account) external onlyOwner {
        verifiers[account] = false;
    }

    function addOracle(address account) external onlyOwner {
        oracles[account] = true;
    }

    // ---------------------------------------------------------- module 1: registry
    function registerProject(
        string calldata name_,
        Ecosystem ecosystem_,
        string calldata location_,
        uint256 areaHaScaled_,
        string calldata docHash_,
        address projectOwner_
    ) external onlyOracle returns (uint256) {
        require(bytes(name_).length > 0, "Registry: name required");
        require(areaHaScaled_ > 0, "Registry: area must be > 0");
        require(projectOwner_ != address(0), "Registry: project owner required");

        projectCount += 1;
        uint256 id = projectCount;

        projects[id] = Project({
            id: id,
            name: name_,
            ecosystem: ecosystem_,
            location: location_,
            areaHaScaled: areaHaScaled_,
            owner: projectOwner_,
            docHash: docHash_,
            status: Status.Pending,
            mrvReportHash: "",
            verifierNote: "",
            creditsIssued: false,
            creditsAmount: 0,
            registeredAt: block.timestamp
        });

        emit ProjectRegistered(id, projectOwner_, name_, ecosystem_, areaHaScaled_);
        return id;
    }

    // ------------------------------------------------------- module 2: automated MRV
    /// @param passed  result computed off-chain by the backend MRV engine against
    ///                satellite imagery / environmental datasets / validation rules.
    function submitMrvResult(uint256 projectId, bool passed, string calldata reportHash) external onlyOracle {
        Project storage p = _mustExist(projectId);
        require(p.status == Status.Pending, "Registry: MRV already submitted");

        p.status = passed ? Status.AutoVerified : Status.Flagged;
        p.mrvReportHash = reportHash;

        emit MrvResultSubmitted(projectId, p.status, reportHash);
    }

    /// @notice Human verifier reviews the automated result and approves or rejects.
    function verifierDecision(uint256 projectId, bool approve, string calldata note) external onlyVerifier {
        Project storage p = _mustExist(projectId);
        require(
            p.status == Status.AutoVerified || p.status == Status.Flagged,
            "Registry: project not awaiting verifier decision"
        );

        // Security rule: an automated MRV failure cannot be overridden by a
        // human verifier. A flagged project must be corrected and submitted
        // through the MRV process again before it can ever become Approved.
        if (approve) {
            require(p.status == Status.AutoVerified, "Registry: flagged project cannot be approved");
        }

        p.status = approve ? Status.Approved : Status.Rejected;
        p.verifierNote = note;

        emit VerifierDecisionMade(projectId, msg.sender, p.status, note);
    }

    // ------------------------------------------------ module 3: credit management
    function issueCredits(uint256 projectId) external onlyOwner {
        Project storage p = _mustExist(projectId);
        require(p.status == Status.Approved, "Registry: project not verifier-approved");
        require(!p.creditsIssued, "Registry: credits already issued for this project");

        uint256 rate = _rateFor(p.ecosystem);
        // areaHaScaled(*100) * rate(*10) / 1000 = area * rate, in whole tCO2e
        uint256 amount = (p.areaHaScaled * rate) / 1000;
        require(amount > 0, "Registry: computed credit amount is zero");

        p.creditsIssued = true;
        p.creditsAmount = amount;

        creditToken.mint(p.owner, amount, projectId);

        emit CreditsIssued(projectId, p.owner, amount);
    }

    // ------------------------------------------------------------------ views
    function getProject(uint256 projectId) external view returns (Project memory) {
        return _mustExist(projectId);
    }

    function _mustExist(uint256 projectId) internal view returns (Project storage) {
        require(projectId > 0 && projectId <= projectCount, "Registry: project does not exist");
        return projects[projectId];
    }

    function _rateFor(Ecosystem eco) internal pure returns (uint256) {
        if (eco == Ecosystem.Mangrove) return RATE_MANGROVE;
        if (eco == Ecosystem.Seagrass) return RATE_SEAGRASS;
        return RATE_SALTMARSH;
    }
}
