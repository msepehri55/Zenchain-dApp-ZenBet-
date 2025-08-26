/* eslint-env es2021, browser */
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ethers } from "ethers";

/* ===================== Branding ===================== */
const SITE_NAME = "ZenBet";
const LOGO_SRC  = "logo.png";

/* ===================== Addresses ===================== */
const coinflipAddress = "0x666ab08c1d8dca5d53162118a482fb51244d0e92";
const diceAddress     = "0x3b5e669589f792f43aad8eb995842dcd7192f430";
const wheelAddress    = "0x08d8f9b5200e370fd76a1fd184f5dce2e4a86f3b";

/* ===================== ABIs ===================== */
const coinflipABI = [
  { inputs: [], name: "claimPrize", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "deposit", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_minBet", type: "uint256" }, { internalType: "uint256", name: "_maxBet", type: "uint256" }], stateMutability: "payable", type: "constructor" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "from", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "Deposited", type: "event" },
  { inputs: [{ internalType: "bool", name: "guess", type: "bool" }, { internalType: "uint256", name: "betAmount", type: "uint256" }], name: "flip", outputs: [], stateMutability: "payable", type: "function" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "player", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }, { indexed: false, internalType: "bool", name: "guess", type: "bool" }, { indexed: false, internalType: "bool", name: "result", type: "bool" }, { indexed: false, internalType: "bool", name: "won", type: "bool" }], name: "Flipped", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "player", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "PrizeClaimed", type: "event" },
  { inputs: [], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "to", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "Withdrawn", type: "event" },
  { stateMutability: "payable", type: "receive" },
  { inputs: [], name: "getBalance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "maxBet", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "minBet", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "pendingPrizes", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getUserStats", outputs: [{ internalType: "uint256", name: "totalBet", type: "uint256" }, { internalType: "uint256", name: "totalWon", type: "uint256" }, { internalType: "uint256", name: "totalLost", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getGlobalStats", outputs: [{ internalType: "uint256", name: "totalBet", type: "uint256" }], stateMutability: "view", type: "function" }
];

const diceABI = [
  { inputs: [], name: "claimPrize", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "deposit", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_minBet", type: "uint256" }, { internalType: "uint256", name: "_maxBet", type: "uint256" }], stateMutability: "payable", type: "constructor" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "from", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "Deposited", type: "event" },
  { inputs: [{ internalType: "uint8", name: "guess", type: "uint8" }, { internalType: "uint256", name: "betAmount", type: "uint256" }], name: "roll", outputs: [], stateMutability: "payable", type: "function" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "player", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }, { indexed: false, internalType: "uint8", name: "guess", type: "uint8" }, { indexed: false, internalType: "uint8", name: "result", type: "uint8" }, { indexed: false, internalType: "bool", name: "won", type: "bool" }], name: "Rolled", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "player", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "PrizeClaimed", type: "event" },
  { inputs: [], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "to", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "Withdrawn", type: "event" },
  { stateMutability: "payable", type: "receive" },
  { inputs: [], name: "getBalance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "maxBet", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "minBet", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "pendingPrizes", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getUserStats", outputs: [{ internalType: "uint256", name: "totalBet", type: "uint256" }, { internalType: "uint256", name: "totalWon", type: "uint256" }, { internalType: "uint256", name: "totalLost", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getGlobalStats", outputs: [{ internalType: "uint256", name: "totalBet", type: "uint256" }], stateMutability: "view", type: "function" }
];

const wheelABI = [
  { inputs: [], name: "claimPrize", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "deposit", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "_minBet", type: "uint256" }, { internalType: "uint256", name: "_maxBet", type: "uint256" }], stateMutability: "payable", type: "constructor" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "from", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "Deposited", type: "event" },
  { inputs: [{ internalType: "uint256", name: "betAmount", type: "uint256" }], name: "spin", outputs: [], stateMutability: "payable", type: "function" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "player", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }, { indexed: false, internalType: "uint8", name: "outcomeIndex", type: "uint8" }, { indexed: false, internalType: "int256", name: "multiplierX10", type: "int256" }, { indexed: false, internalType: "bool", name: "won", type: "bool" }], name: "Spun", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "player", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "PrizeClaimed", type: "event" },
  { inputs: [], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { anonymous: false, inputs: [{ indexed: false, internalType: "address", name: "to", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "Withdrawn", type: "event" },
  { stateMutability: "payable", type: "receive" },
  { inputs: [], name: "getBalance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "maxBet", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "minBet", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "pendingPrizes", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },

  // Additions for robustness
  { inputs: [], name: "availableBank", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getLastOutcome", outputs: [
      { internalType: "uint8", name: "outcomeIndex", type: "uint8" },
      { internalType: "uint16", name: "multiplierX10", type: "uint16" },
      { internalType: "bool", name: "won", type: "bool" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint64", name: "nonce", type: "uint64" }
    ], stateMutability: "view", type: "function" },

  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getUserStats", outputs: [{ internalType: "uint256", name: "totalBet", type: "uint256" }, { internalType: "uint256", name: "totalWon", type: "uint256" }, { internalType: "uint256", name: "totalLost", type: "uint256" }], stateMutability: "view", type: "function" }
];

/* ===================== Network ===================== */
const ZENCHAIN = {
  chainId: "0x20D8",
  chainName: "Zenchain Testnet",
  nativeCurrency: { name: "ZTC", symbol: "ZTC", decimals: 18 },
  rpcUrls: ["https://zenchain-testnet.api.onfinality.io/public"],
  blockExplorerUrls: []
};

/* Durations */
const COIN_REVEAL_MS  = 3000;
const DICE_REVEAL_MS  = 3000;
const WHEEL_SPIN_MS   = 3800;

/* Helpers */
const shortAddr = (addr = "") => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");
const formatZTC = (v) => {
  try {
    const n = Number(v);
    if (Number.isNaN(n)) return "0";
    if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return n.toString();
  } catch { return v; }
};

/* Wallet detection helpers */
const inferProviderName = (p, fallback = "Injected") => {
  if (!p) return fallback;
  if (p.isRabby) return "Rabby";
  if (p.isMetaMask && !p.isBraveWallet) return "MetaMask";
  if (p.isCoinbaseWallet) return "Coinbase Wallet";
  if (p.isBraveWallet) return "Brave Wallet";
  if (p.isTrust) return "Trust Wallet";
  if (p.isOkxWallet) return "OKX Wallet";
  return fallback;
};

/* ===================== Component ===================== */
function App() {
  const [activePage, setActivePage] = useState("games");
  const [activeGame, setActiveGame] = useState("coinflip");

  /* Wallet */
  const [walletAddress, setWalletAddress] = useState("");
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

  /* CoinFlip */
  const [cfBetAmount, setCfBetAmount] = useState("");
  const [cfGuess, setCfGuess] = useState(true);
  const [cfPool, setCfPool] = useState("0");
  const [cfPending, setCfPending] = useState("0");
  const [cfMin, setCfMin] = useState("0");
  const [cfMax, setCfMax] = useState("0");

  /* Dice */
  const [diceBetAmount, setDiceBetAmount] = useState("");
  const [diceGuess, setDiceGuess] = useState(1);
  const [dicePool, setDicePool] = useState("0");
  const [dicePending, setDicePending] = useState("0");
  const [diceMin, setDiceMin] = useState("0");
  const [diceMax, setDiceMax] = useState("0");

  /* Wheel */
  const [wheelBetAmount, setWheelBetAmount] = useState("");
  const [wheelPool, setWheelPool] = useState("0");
  const [wheelPending, setWheelPending] = useState("0");
  const [wheelMin, setWheelMin] = useState("0");
  const [wheelMax, setWheelMax] = useState("0");
  const WHEEL_SEGMENTS = useMemo(() => ["Lose", "Lose", "1.5x", "2x", "3x", "5x", "10x"], []);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelLabel, setWheelLabel] = useState("");
  const [wheelAnimate, setWheelAnimate] = useState(true);

  /* UX */
  const [error, setError] = useState("");
  const [uiPhase, setUiPhase] = useState("idle"); // idle | waiting | reveal
  const [overlay, setOverlay] = useState(null);
  const [modal, setModal] = useState(null);

  /* Reveal transforms */
  const [coinAngle, setCoinAngle] = useState(0);
  const [diceAngles, setDiceAngles] = useState({ x: 0, y: 0 });

  const [flipRunId, setFlipRunId] = useState(0);
  const [diceRunId, setDiceRunId] = useState(0);
  const [coinTransition, setCoinTransition] = useState(false);
  const [diceTransition, setDiceTransition] = useState(false);
  const coinInnerRef = useRef(null);
  const diceInnerRef = useRef(null);

  /* Stats */
  const [statsOpen, setStatsOpen] = useState(false);
  const [cfStats, setCfStats] = useState({ totalBet: "0", totalWon: "0", totalLost: "0" });
  const [diceStats, setDiceStats] = useState({ totalBet: "0", totalWon: "0", totalLost: "0" });
  const [wheelStats, setWheelStats] = useState({ totalBet: "0", totalWon: "0", totalLost: "0" });
  const [statsRefreshing, setStatsRefreshing] = useState(false);

  /* Profile (local only) */
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  /* Styles once */
  useEffect(() => {
    if (document.getElementById("zenbet-styles")) return;
    const style = document.createElement("style");
    style.id = "zenbet-styles";
    style.innerHTML = `
      :root { --zen-border: rgba(255,255,255,0.14); --wheel-dur: ${WHEEL_SPIN_MS}ms; }
      .header-shell { position: fixed; top:0; left:0; right:0; z-index: 20; padding: 8px 12px; background: transparent; }
      .header { max-width: 1100px; margin: 0 auto; background: linear-gradient(112deg, rgba(16,185,129,0.85), rgba(52,211,153,0.75), rgba(251,191,36,0.45)); border: 1px solid var(--zen-border); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-radius: 18px; padding: 10px 14px; box-shadow: 0 8px 18px rgba(0,0,0,0.25); }
      .brand { font-weight: 900; letter-spacing: .5px; font-size: 28px; background: radial-gradient(circle at 50% 50%, #ffd08a, #f59e0b 40%, #b45309 70%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 2px 12px rgba(245,158,11,.25); }
      .nav-btn { color: #0f172a; background: rgba(255,255,255,0.9); border: 1px solid var(--zen-border); padding: 8px 14px; margin: 0 6px; border-radius: 12px; transition: transform .15s ease, box-shadow .15s ease, background .2s ease; }
      .nav-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 12px rgba(0,0,0,.15); background: #ffffff; }
      .nav-btn.active { outline: 2px solid rgba(245,158,11,.6); background: #fff7ed; }

      .link-btn { margin-right: 8px; color:#0f172a; background:#fff; border:1px solid var(--zen-border); border-radius:10px; padding:8px 12px; font-weight:700; }
      .link-btn.active { outline:2px solid rgba(99,102,241,.45); background:#eef2ff; }

      .wallet-btn { color: #0f172a; background: linear-gradient(135deg, #34d399, #22c55e); border-radius: 12px; padding: 10px 14px; font-weight: 700; border: 1px solid var(--zen-border); position: relative; }
      .wallet-btn:hover { filter: brightness(1.05); }
      .wallet-menu { position: absolute; right: 0; top: calc(100% + 8px); background: #ffffff; border: 1px solid rgba(0,0,0,.08); border-radius: 12px; box-shadow: 0 10px 24px rgba(0,0,0,.18); min-width: 220px; padding: 8px; z-index: 50; }
      .wallet-menu button { width: 100%; text-align: left; padding: 10px 12px; border-radius: 10px; font-weight: 700; color: #0f172a; }
      .wallet-menu button:hover { background: #f1f5f9; }
      .wallet-menu .danger { color: #991b1b; background: #fff1f2; border: 1px solid #fecaca; }
      .wallet-menu .danger:hover { background: #ffe4e6; }

      .card { background: rgba(255,255,255,0.9); border: 1px solid var(--zen-border); border-radius: 18px; box-shadow: 0 12px 24px rgba(0,0,0,.2); }
      .title-gradient { background: linear-gradient(135deg, #a3e635, #22c55e); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .label { color: #0f172a; font-weight: 600; }
      .value { color: #0f172a; font-weight: 800; }
      .input { border-radius: 12px; border: 2px solid #86efac; padding: 12px; width: 100%; color: #0f172a; background: rgba(255,255,255,.98); }
      .input::placeholder { color: #9ca3af; }
      .btn-green { background: linear-gradient(135deg,#34d399,#22c55e); color: #0f172a; font-weight: 800; border-radius: 12px; padding: 12px 16px; width: 100%; border: 1px solid var(--zen-border); transition: transform .15s ease, filter .2s ease; }
      .btn-green:hover { transform: translateY(-1px); filter: brightness(1.05); }
      .btn-disabled { background: #cbd5e1 !important; color: #475569 !important; cursor: not-allowed !important; }

      /* Waiting overlay */
      .overlay { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,.55); z-index: 40; }
      .wait-box { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; }
      .spinner { width: 58px; height: 58px; border: 6px solid #e5e7eb; border-top-color: #22c55e; border-radius: 50%; animation: spin .9s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Modal */
      .result-modal { background:#fff; border:1px solid rgba(0,0,0,.08); border-radius:16px; padding:16px 18px; min-width:260px; text-align:center; box-shadow: 0 18px 32px rgba(0,0,0,.28); }
      .result-modal.win { background: linear-gradient(135deg,#bbf7d0,#ecfccb); }
      .result-modal.lose { background: linear-gradient(135deg,#fecaca,#ffe4e6); }
      .modal-title { font-weight:900; font-size:20px; color:#0f172a; }
      .modal-msg { margin-top:6px; color:#0f172a; font-weight:700; }
      .modal-btn { margin-top:12px; background:#fff; border:1px solid rgba(0,0,0,.08); padding:8px 12px; border-radius:10px; font-weight:800; color:#0f172a; }

      /* 3D Coin */
      .coin3d { width: 160px; height: 160px; perspective: 1000px; }
      .coin3d-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; will-change: transform; }
      .coin-face { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; border-radius:50%; backface-visibility: hidden; border: 2px solid #f59e0b; font-weight:900; color:#0f172a; font-size: 20px; }
      .coin-heads { background: radial-gradient(circle at 30% 30%, #fff7ed, #f59e0b 55%, #b45309); transform: rotateY(0deg) translateZ(2px); }
      .coin-tails { background: radial-gradient(circle at 70% 70%, #e0f2fe, #93c5fd 55%, #1d4ed8); transform: rotateY(180deg) translateZ(2px); }

      /* Dice cube */
      .dice-scene { width: 160px; height: 160px; perspective: 900px; }
      .dice-cube { width: 160px; height: 160px; position: relative; transform-style: preserve-3d; will-change: transform; }
      .dice-face { position: absolute; width: 160px; height: 160px; background: #fff; border: 2px solid #0ea5e9; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 46px; color: #0f172a; }
      .dice-face.one   { transform: rotateY(  0deg) translateZ(80px); }
      .dice-face.six   { transform: rotateY(180deg) translateZ(80px); }
      .dice-face.two   { transform: rotateY( 90deg) translateZ(80px); }
      .dice-face.five  { transform: rotateY(-90deg) translateZ(80px); }
      .dice-face.three { transform: rotateX( 90deg) translateZ(80px); }
      .dice-face.four  { transform: rotateX(-90deg) translateZ(80px); }

      /* Left handles */
      .handle { position: fixed; left: 0; z-index: 26; background: linear-gradient(135deg,#ffd08a,#f59e0b,#b45309); color: #0f172a; border-radius: 0 12px 12px 0; padding: 10px 12px; box-shadow: 0 8px 18px rgba(0,0,0,.25); border: 1px solid var(--zen-border); cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 900; transform: translate(-6px,-50%); transition: transform .15s ease; }
      .handle:hover { transform: translate(0,-50%); }
      .stats-handle { top: 45%; }
      .leaderboard-handle { top: 58%; background: linear-gradient(135deg,#c4b5fd,#a78bfa,#7c3aed); color: #0f172a; }

      /* Stats card */
      .stats-float { position: fixed; left: 0; top: 58%; transform: translate(-105%, -50%); width: 300px; max-width: 92vw; border-radius: 0 16px 16px 0; background: radial-gradient(120% 140% at 0% 0%, rgba(255,255,255,0.98), rgba(255,255,255,0.92)); border: 1px solid rgba(0,0,0,0.06); box-shadow: 12px 10px 30px rgba(0,0,0,0.28); z-index: 30; transition: transform .25s ease; overflow: hidden; }
      .stats-float.open { transform: translate(0, -50%); }
      .stats-head { display:flex; align-items:center; justify-content:space-between; padding: 10px 12px; background: linear-gradient(135deg, rgba(163,230,53,0.25), rgba(34,197,94,0.25)); border-bottom: 1px solid rgba(0,0,0,0.06); }
      .stats-title { font-weight:900; font-size:18px; background: linear-gradient(135deg,#a3e635,#22c55e); -webkit-background-clip:text; background-clip:text; color:transparent; }
      .close-chip { background:#fff; border:1px solid rgba(0,0,0,.08); border-radius:10px; padding:6px 10px; font-weight:700; color:#0f172a; }
      .section { padding: 12px; }
      .section-title { font-weight:800; font-size:14px; color:#0f172a; opacity:0.8; margin-bottom:8px; }
      .stat-row { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed rgba(15,23,42,.12); }
      .stat-row:last-child { border-bottom:none; }
      .pill { display:inline-flex; align-items:center; gap:6px; background:#f1f5f9; color:#0f172a; border:1px solid rgba(0,0,0,.06); padding:6px 10px; border-radius:999px; font-weight:800; }

      /* Wheel visuals */
      .wheel-layout { display:flex; gap:16px; align-items:center; justify-content:center; flex-wrap:wrap; }
      .wheel { position: relative; width: 360px; height: 360px; }
      .wheel-ring { position:absolute; inset:0; border-radius:50%; border: 10px solid #0f172a; box-shadow: inset 0 0 40px rgba(0,0,0,.25), 0 18px 36px rgba(0,0,0,.25); }
      .wheel-rotor { position:absolute; inset:0; border-radius:50%; transition: transform var(--wheel-dur) cubic-bezier(.17,.67,.16,1.02); }
      .wheel-rotor.no-transition { transition: none !important; }
      .wheel-face { position:absolute; inset:0; border-radius:50%; }
      .wheel-center { position:absolute; left:50%; top:50%; transform: translate(-50%,-50%); width: 32px; height: 32px; border-radius:50%; background:#fff; border:2px solid #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,.25); z-index:3; }
      .pointer { position:absolute; top:-12px; left:50%; transform: translateX(-50%); width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 20px solid #ef4444; filter: drop-shadow(0 4px 4px rgba(0,0,0,.3)); z-index:4; }
      .wheel-label { position:absolute; left:50%; top:50%; transform: translate(-50%,-50%); background:#ffffffee; border-radius:12px; padding:8px 12px; font-weight:900; color:#0f172a; border:1px solid rgba(0,0,0,.08); z-index:5; }
      .seg-label { position:absolute; left:50%; top:50%; font-weight:900; color:#0f172a; pointer-events:none; transform-origin: center; }

      /* Wallet chooser modal */
      .wc-overlay { position: fixed; inset:0; z-index:50; background: rgba(0,0,0,.55); display:grid; place-items:center; }
      .wc-modal { background:#fff; border:1px solid rgba(0,0,0,.08); border-radius:16px; width: 340px; max-width: 92vw; box-shadow: 0 18px 36px rgba(0,0,0,.28); padding: 14px; }
      .wc-title { font-weight:900; font-size:18px; color:#0f172a; margin-bottom:10px; }
      .wc-item { width:100%; text-align:left; border:1px solid rgba(0,0,0,.08); background:#f8fafc; color:#0f172a; border-radius:10px; padding:10px 12px; font-weight:800; margin:6px 0; }
      .wc-item:hover { background:#eef2ff; }
      .wc-empty { font-size:14px; color:#334155; background:#fff; border:1px dashed rgba(0,0,0,.1); border-radius:10px; padding:10px; }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => { document.title = SITE_NAME; }, []);

  const providerRPC = useMemo(() => new ethers.JsonRpcProvider("https://zenchain-testnet.api.onfinality.io/public"), []);

  /* Provider discovery (EIP-6963 + legacy) */
  useEffect(() => {
    const map = new Map();
    const pushProvider = (provider, info = {}) => {
      if (!provider) return;
      const name = info.name || inferProviderName(provider);
      const key = info.rdns || name + (provider.isMetaMask ? "-mm" : "") + (provider.isRabby ? "-rabby" : "") + (provider.isCoinbaseWallet ? "-cbw" : "");
      if (!map.has(key)) map.set(key, { provider, name, rdns: info.rdns || "" });
    };
    const onAnnounce = (e) => {
      try {
        const { provider, info } = e.detail || {};
        pushProvider(provider, info || {});
        setProviders(Array.from(map.values()));
      } catch {}
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch {}
    const legacy = window.ethereum?.providers?.length ? window.ethereum.providers : (window.ethereum ? [window.ethereum] : []);
    legacy.forEach((p) => pushProvider(p));
    setProviders(Array.from(map.values()));
    return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
  }, []);

  /* Connect helpers */
  const ensureZenchain = async (prov) => {
    const chainId = await prov.request({ method: "eth_chainId" });
    if (chainId !== ZENCHAIN.chainId) {
      try {
        await prov.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ZENCHAIN.chainId }] });
      } catch (e) {
        if (e.code === 4902) {
          await prov.request({ method: "wallet_addEthereumChain", params: [ZENCHAIN] });
        } else { throw e; }
      }
    }
  };

  const connectWallet = async () => {
    if (walletAddress) { setWalletMenuOpen((v) => !v); return; }
    setWalletModalOpen(true);
  };

  const selectProviderAndConnect = async (entry) => {
    try {
      const prov = entry?.provider;
      if (!prov) throw new Error("Provider not found.");
      await ensureZenchain(prov);
      const accounts = await prov.request({ method: "eth_requestAccounts" });
      setSelectedProvider(prov);
      setWalletAddress(accounts?.[0] || "");
      setWalletModalOpen(false);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err?.shortMessage || err?.message || "Failed to connect wallet.");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setSelectedProvider(null);
    setWalletMenuOpen(false);
    setError("");
  };

  useEffect(() => {
    if (!selectedProvider || !selectedProvider.on) return;
    const onAccountsChanged = (accs) => setWalletAddress(accs?.[0] || "");
    const onChainChanged = () => window.location.reload();
    selectedProvider.on("accountsChanged", onAccountsChanged);
    selectedProvider.on("chainChanged", onChainChanged);
    return () => {
      if (selectedProvider.removeListener) {
        selectedProvider.removeListener("accountsChanged", onAccountsChanged);
        selectedProvider.removeListener("chainChanged", onChainChanged);
      }
    };
  }, [selectedProvider]);

  /* Meta + pending */
  const cfRO = useMemo(() => new ethers.Contract(coinflipAddress, coinflipABI, providerRPC), [providerRPC]);
  const diceRO = useMemo(() => new ethers.Contract(diceAddress, diceABI, providerRPC), [providerRPC]);
  const wheelRO = useMemo(() => new ethers.Contract(wheelAddress, wheelABI, providerRPC), [providerRPC]);

  const loadCFMeta = useCallback(async () => { try { const [b,mn,mx] = await Promise.all([cfRO.getBalance(), cfRO.minBet(), cfRO.maxBet()]); setCfPool(ethers.formatEther(b)); setCfMin(ethers.formatEther(mn)); setCfMax(ethers.formatEther(mx)); } catch {} }, [cfRO]);
  const loadDiceMeta = useCallback(async () => { try { const [b,mn,mx] = await Promise.all([diceRO.getBalance(), diceRO.minBet(), diceRO.maxBet()]); setDicePool(ethers.formatEther(b)); setDiceMin(ethers.formatEther(mn)); setDiceMax(ethers.formatEther(mx)); } catch {} }, [diceRO]);
  const loadWheelMeta= useCallback(async () => { try { const [b,mn,mx] = await Promise.all([wheelRO.getBalance(), wheelRO.minBet(), wheelRO.maxBet()]); setWheelPool(ethers.formatEther(b)); setWheelMin(ethers.formatEther(mn)); setWheelMax(ethers.formatEther(mx)); } catch {} }, [wheelRO]);

  const loadCFPending   = useCallback(async () => { if (!walletAddress) return; try { setCfPending(ethers.formatEther(await cfRO.pendingPrizes(walletAddress))); } catch {} }, [cfRO, walletAddress]);
  const loadDicePending = useCallback(async () => { if (!walletAddress) return; try { setDicePending(ethers.formatEther(await diceRO.pendingPrizes(walletAddress))); } catch {} }, [diceRO, walletAddress]);
  const loadWheelPending= useCallback(async () => { if (!walletAddress) return; try { setWheelPending(ethers.formatEther(await wheelRO.pendingPrizes(walletAddress))); } catch {} }, [wheelRO, walletAddress]);

  /* Stats */
  const refreshStats = useCallback(async () => {
    setStatsRefreshing(true);
    try {
      if (walletAddress) {
        try { const s = await cfRO.getUserStats(walletAddress);    setCfStats({ totalBet: ethers.formatEther(s[0]), totalWon: ethers.formatEther(s[1]), totalLost: ethers.formatEther(s[2]) }); } catch {}
        try { const s = await diceRO.getUserStats(walletAddress);  setDiceStats({ totalBet: ethers.formatEther(s[0]), totalWon: ethers.formatEther(s[1]), totalLost: ethers.formatEther(s[2]) }); } catch {}
        try { const s = await wheelRO.getUserStats(walletAddress); setWheelStats({ totalBet: ethers.formatEther(s[0]), totalWon: ethers.formatEther(s[1]), totalLost: ethers.formatEther(s[2]) }); } catch {}
      } else {
        setCfStats({ totalBet: "0", totalWon: "0", totalLost: "0" });
        setDiceStats({ totalBet: "0", totalWon: "0", totalLost: "0" });
        setWheelStats({ totalBet: "0", totalWon: "0", totalLost: "0" });
      }
    } finally { setStatsRefreshing(false); }
  }, [cfRO, diceRO, wheelRO, walletAddress]);

  /* Reveal helpers */
  const startWaiting = (game) => { setUiPhase("waiting"); setOverlay({ game }); };
  const showModal = (status, message) => setModal({ status, message });

  /* Coin Flip */
  const flipCoin = async () => {
    if (!walletAddress) return setError("Connect wallet first!");
    if (!selectedProvider) return setError("Select a wallet provider first.");
    const valid = cfBetAmount && Number(cfBetAmount) > 0 && /^\d+(\.\d{1,18})?$/.test(cfBetAmount);
    if (!valid) return setError("Enter a valid bet amount.");
    try {
      const browserProv = new ethers.BrowserProvider(selectedProvider);
      const signer   = await browserProv.getSigner();
      const cf       = new ethers.Contract(coinflipAddress, coinflipABI, signer);
      const betValue = ethers.parseEther(cfBetAmount);
      if (betValue < ethers.parseEther(cfMin) || betValue > ethers.parseEther(cfMax)) return setError(`Bet must be between ${cfMin} and ${cfMax} ZTC`);
      startWaiting("coinflip");
      const tx = await cf.flip(cfGuess, betValue, { value: betValue });
      const receipt = await tx.wait();

      const iface = new ethers.Interface(coinflipABI);
      let side = "Heads", won = false;
      for (const log of receipt.logs) {
        if ((log.address || "").toLowerCase() !== coinflipAddress.toLowerCase()) continue;
        try { const p = iface.parseLog(log); if (p?.name === "Flipped") { won = Boolean(p.args.won); side = Boolean(p.args.result) ? "Heads" : "Tails"; break; } } catch {}
      }

      setFlipRunId((v) => v + 1);
      setUiPhase("reveal"); setOverlay({ game: "coinflip" });
      setCoinTransition(false);
      setCoinAngle(0);
      requestAnimationFrame(() => {
        if (coinInnerRef.current) { void coinInnerRef.current.getBoundingClientRect(); }
        requestAnimationFrame(() => {
          const spins = 4 * 360;
          const offset = side === "Heads" ? 0 : 180;
          setCoinTransition(true);
          setCoinAngle(spins + offset);
        });
      });

      setTimeout(() => { setUiPhase("idle"); setOverlay(null); showModal(won ? "win" : "lose", won ? `You won! ${side}` : `You lost! ${side}`); }, COIN_REVEAL_MS + 150);
      await Promise.all([loadCFPending(), loadCFMeta(), refreshStats()]);
      setError("");
    } catch (err) {
      console.error(err);
      setUiPhase("idle"); setOverlay(null);
      const msg = (err?.shortMessage || err?.message || "Transaction failed!");
      setError(msg.includes("InsufficientBank") ? "Bank liquidity too low for this bet. Try a smaller amount." : msg);
    }
  };

  /* Dice */
  const faceOffsets = (f) => { switch (f) { case 1: return { x: 0, y: 0 }; case 2: return { x: 0, y: -90 }; case 3: return { x: -90, y: 0 }; case 4: return { x: 90, y: 0 }; case 5: return { x: 0, y: 90 }; case 6: return { x: 0, y: 180 }; default: return { x: 0, y: 0 }; } };
  const rollDice = async () => {
    if (!walletAddress) return setError("Connect wallet first!");
    if (!selectedProvider) return setError("Select a wallet provider first.");
    const valid = diceBetAmount && Number(diceBetAmount) > 0 && /^\d+(\.\d{1,18})?$/.test(diceBetAmount);
    if (!valid) return setError("Enter a valid bet amount.");
    try {
      const browserProv = new ethers.BrowserProvider(selectedProvider);
      const signer   = await browserProv.getSigner();
      const dr       = new ethers.Contract(diceAddress, diceABI, signer);
      const betValue = ethers.parseEther(diceBetAmount);
      if (betValue < ethers.parseEther(diceMin) || betValue > ethers.parseEther(diceMax)) return setError(`Bet must be between ${diceMin} and ${diceMax} ZTC`);
      startWaiting("dice");
      const tx = await dr.roll(diceGuess, betValue, { value: betValue });
      const receipt = await tx.wait();
      const iface = new ethers.Interface(diceABI);
      let rolled = 1, won = false;
      for (const log of receipt.logs) {
        if ((log.address || "").toLowerCase() !== diceAddress.toLowerCase()) continue;
        try { const p = iface.parseLog(log); if (p?.name === "Rolled") { won = Boolean(p.args.won); rolled = Number(p.args.result); break; } } catch {}
      }
      setDiceRunId((v) => v + 1);
      setUiPhase("reveal"); setOverlay({ game: "dice" });
      setDiceTransition(false);
      setDiceAngles({ x: 0, y: 0 });
      requestAnimationFrame(() => {
        if (diceInnerRef.current) { void diceInnerRef.current.getBoundingClientRect(); }
        requestAnimationFrame(() => {
          const spins = 4 * 360;
          const o = faceOffsets(rolled);
          setDiceTransition(true);
          setDiceAngles({ x: spins + o.x, y: spins + o.y });
        });
      });
      setTimeout(() => { setUiPhase("idle"); setOverlay(null); showModal(won ? "win" : "lose", won ? `You won! Rolled ${rolled}` : `You lost! Rolled ${rolled}`); }, DICE_REVEAL_MS + 150);
      await Promise.all([loadDicePending(), loadDiceMeta(), refreshStats()]);
      setError("");
    } catch (err) {
      console.error(err);
      setUiPhase("idle"); setOverlay(null);
      const msg = (err?.shortMessage || err?.message || "Transaction failed!");
      setError(msg.includes("InsufficientBank") ? "Bank liquidity too low for this bet. Try a smaller amount." : msg);
    }
  };

  /* Wheel */
  const wheelGradient = useMemo(() => {
    const colors = ["#fecaca","#fee2e2","#fde68a","#bbf7d0","#86efac","#67e8f9","#a5b4fc"];
    const n = WHEEL_SEGMENTS.length, step = 100 / n;
    return `conic-gradient(${Array.from({length:n}).map((_,i)=>`${colors[i%colors.length]} ${i*step}% ${(i+1)*step}%`).join(",")})`;
  }, [WHEEL_SEGMENTS.length]);
  const labelTransform = (i) => {
    const n = WHEEL_SEGMENTS.length, base = 360 / n, angle = (i + 0.5) * base;
    return `translate(-50%,-50%) rotate(${angle}deg) translate(0, -130px) rotate(${-angle}deg)`;
  };
  const spinToIndex = (idx) => {
    const n = WHEEL_SEGMENTS.length;
    const base = 360 / n;
    const stopAt = 360 - (idx + 0.5) * base;
    const target = 4 * 360 + stopAt;
    setWheelAnimate(false);
    setWheelRotation((prev) => (prev % 360));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setWheelAnimate(true);
        setWheelRotation(target);
      });
    });
  };

  // Robust outcome read: receipt -> queryFilter -> getLastOutcome
  const readWheelOutcome = async (receipt, wh) => {
    let idx = null, multX10 = null, won = null;
    try {
      const iface = new ethers.Interface(wheelABI);
      for (const log of receipt.logs) {
        if ((log.address || "").toLowerCase() !== wheelAddress.toLowerCase()) continue;
        try {
          const p = iface.parseLog(log);
          if (p?.name === "Spun") {
            idx = Number(p.args.outcomeIndex);
            multX10 = Number(p.args.multiplierX10);
            won = Boolean(p.args.won);
            break;
          }
        } catch {}
      }
    } catch {}
    if (idx === null) {
      try {
        const events = await wh.queryFilter(wh.filters.Spun(), receipt.blockNumber, receipt.blockNumber);
        const mine = events.find((e) => e.transactionHash === receipt.hash);
        if (mine) {
          idx = Number(mine.args.outcomeIndex);
          multX10 = Number(mine.args.multiplierX10);
          won = Boolean(mine.args.won);
        }
      } catch {}
    }
    if (idx === null) {
      try {
        const lo = await wh.getLastOutcome(walletAddress);
        idx = Number(lo[0]);
        multX10 = Number(lo[1]);
        won = Boolean(lo[2]);
      } catch {}
    }
    if (idx === null) {
      // ultimate fallback: assume lose (should never happen now)
      idx = 0; multX10 = 0; won = false;
    }
    // Normalize: compute won off multiplier to be safe
    won = multX10 > 0;
    return { idx, multX10, won };
  };

  const spinWheel = async () => {
    if (!walletAddress) return setError("Connect wallet first!");
    if (!selectedProvider) return setError("Select a wallet provider first.");
    const valid = wheelBetAmount && Number(wheelBetAmount) > 0 && /^\d+(\.\d{1,18})?$/.test(wheelBetAmount);
    if (!valid) return setError("Enter a valid bet amount.");
    try {
      const browserProv = new ethers.BrowserProvider(selectedProvider);
      const signer = await browserProv.getSigner();
      const wh = new ethers.Contract(wheelAddress, wheelABI, signer);

      const betValue = ethers.parseEther(wheelBetAmount);
      // Fetch on-chain limits + available bank to avoid reverts
      const [mn, mx, avail] = await Promise.all([
        wheelRO.minBet().catch(() => null),
        wheelRO.maxBet().catch(() => null),
        wheelRO.availableBank().catch(() => null)
      ]);
      if (mn !== null && betValue < mn) return setError(`Bet must be ≥ ${ethers.formatEther(mn)} ZTC`);
      if (mx !== null && betValue > mx) return setError(`Bet must be ≤ ${ethers.formatEther(mx)} ZTC`);
      if (avail !== null && avail < (betValue * 10n)) return setError("Bank liquidity too low for this bet. Try a smaller amount.");

      startWaiting("wheel");
      const tx = await wh.spin(betValue, { value: betValue });
      const receipt = await tx.wait();

      const { idx, multX10, won } = await readWheelOutcome(receipt, wh);

      setUiPhase("reveal"); setOverlay(null);
      setWheelLabel("Spinning…");
      spinToIndex(idx);
      setTimeout(() => {
        const label = multX10 > 0 ? `${multX10/10}x` : "Lose";
        setWheelLabel(won ? `You won ${label}!` : `You lost (${label})`);
        showModal(won ? "win" : "lose", won ? `You won ${label}!` : `You lost (${label}).`);
        setUiPhase("idle");
      }, WHEEL_SPIN_MS + 150);

      await Promise.all([loadWheelPending(), loadWheelMeta(), refreshStats()]);
      setError("");
    } catch (err) {
      console.error(err);
      setUiPhase("idle"); setOverlay(null);
      const msg = (err?.shortMessage || err?.message || "Transaction failed!");
      if (/InsufficientBank/i.test(msg)) return setError("Bank liquidity too low for this bet. Try a smaller amount.");
      if (/InvalidBet/i.test(msg)) return setError("Invalid bet. Check min/max and value sent.");
      setError(msg);
    }
  };

  /* Claim / withdraw-all */
  const claimPrizeCF    = async () => { if (!walletAddress) return setError("Connect wallet first!"); try { const p=new ethers.BrowserProvider(selectedProvider || window.ethereum); const s=await p.getSigner(); const cf=new ethers.Contract(coinflipAddress,coinflipABI,s); const tx=await cf.claimPrize(); await tx.wait(); await Promise.all([loadCFPending(),loadCFMeta(),refreshStats()]); } catch(e){ setError(e?.shortMessage||e?.message||"Failed to claim (CoinFlip)."); } };
  const claimPrizeDice  = async () => { if (!walletAddress) return; try { const p=new ethers.BrowserProvider(selectedProvider || window.ethereum); const s=await p.getSigner(); const dr=new ethers.Contract(diceAddress,diceABI,s); const tx=await dr.claimPrize(); await tx.wait(); await Promise.all([loadDicePending(),loadDiceMeta(),refreshStats()]); } catch(e){ setError(e?.shortMessage||e?.message||"Failed to claim (Dice)."); } };
  const claimPrizeWheel = async () => { if (!walletAddress) return; try { const p=new ethers.BrowserProvider(selectedProvider || window.ethereum); const s=await p.getSigner(); const wh=new ethers.Contract(wheelAddress,wheelABI,s); const tx=await wh.claimPrize(); await tx.wait(); await Promise.all([loadWheelPending(),loadWheelMeta(),refreshStats()]); } catch(e){ setError(e?.shortMessage||e?.message||"Failed to claim (Wheel)."); } };
  const withdrawAll = async () => {
    if (!walletAddress) return setError("Connect wallet first!");
    try {
      const p=new ethers.BrowserProvider(selectedProvider || window.ethereum); const s=await p.getSigner();
      let did=false;
      if (parseFloat(cfPending)>0){ try{ const cf=new ethers.Contract(coinflipAddress,coinflipABI,s); const tx=await cf.claimPrize(); await tx.wait(); did=true; }catch{} }
      if (parseFloat(dicePending)>0){ try{ const dr=new ethers.Contract(diceAddress,diceABI,s); const tx=await dr.claimPrize(); await tx.wait(); did=true; }catch{} }
      if (parseFloat(wheelPending)>0){ try{ const wh=new ethers.Contract(wheelAddress,wheelABI,s); const tx=await wh.claimPrize(); await tx.wait(); did=true; }catch{} }
      if (!did) setError("No unclaimed rewards.");
      await Promise.all([loadCFPending(),loadDicePending(),loadWheelPending(),loadCFMeta(),loadDiceMeta(),loadWheelMeta(),refreshStats()]);
    } catch(e){ setError(e?.shortMessage||e?.message||"Withdraw all failed."); }
  };

  /* Init & events */
  useEffect(() => { loadCFMeta(); loadDiceMeta(); loadWheelMeta(); }, [loadCFMeta, loadDiceMeta, loadWheelMeta]);
  useEffect(() => {
    if (walletAddress) { loadCFPending(); loadDicePending(); loadWheelPending(); }
    else { setCfPending("0"); setDicePending("0"); setWheelPending("0"); }
    refreshStats();
  }, [walletAddress, loadCFPending, loadDicePending, loadWheelPending, refreshStats]);

  /* Outside click closers */
  const walletMenuRef = useRef(null);
  useEffect(() => {
    const onDown = (e) => { if (walletMenuRef.current && !walletMenuRef.current.contains(e.target)) setWalletMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  const statsRef = useRef(null);
  useEffect(() => {
    if (!statsOpen) return;
    const onDown = (e) => { if (statsRef.current && !statsRef.current.contains(e.target)) setStatsOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [statsOpen]);

  /* Profile local load/save */
  useEffect(() => {
    if (activePage !== "profile") return;
    const key = `zenbet_profile_${walletAddress || "anon"}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const d = JSON.parse(saved);
      setProfileName(d.name || ""); setProfileEmail(d.email || "");
    } else { setProfileName(""); setProfileEmail(""); }
  }, [activePage, walletAddress]);
  const saveProfile = () => {
    const key = `zenbet_profile_${walletAddress || "anon"}`;
    localStorage.setItem(key, JSON.stringify({ name: profileName, email: profileEmail }));
    alert("Saved!");
  };

  /* Totals including pending */
  const totalWonCoinFlip = (Number(cfStats.totalWon)||0) + (Number(cfPending)||0);
  const totalWonDice     = (Number(diceStats.totalWon)||0) + (Number(dicePending)||0);
  const totalWonWheel    = (Number(wheelStats.totalWon)||0) + (Number(wheelPending)||0);

  // Assets with PUBLIC_URL for subpath hosting
  const [logoSrc, setLogoSrc] = useState(LOGO_SRC);
  const baseUrl = (typeof process !== "undefined" && process.env && process.env.PUBLIC_URL) ? process.env.PUBLIC_URL : "";
  const bgImage = activePage !== "games" ? `${baseUrl}/zenchain-background.jpg` :
    activeGame === "dice" ? `${baseUrl}/dice-background.jpg` :
    activeGame === "wheel" ? `${baseUrl}/wheel-background.jpg` :
    `${baseUrl}/zenchain-background.jpg`;

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: `url('${bgImage}')` }}>
      {/* Header */}
      <div className="header-shell">
        <div className="header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt={`${SITE_NAME} Logo`}
              className="h-10 w-10 rounded-lg"
              onError={() => setLogoSrc(`${baseUrl}/zenchain-logo.png`)}
            />
            <h2 className="brand">{SITE_NAME}</h2>
          </div>

          <div className="flex justify-center flex-grow">
            <button onClick={() => setActiveGame("coinflip")} className={`nav-btn ${activeGame === "coinflip" ? "active" : ""}`}>Coinflip</button>
            <button onClick={() => setActiveGame("dice")} className={`nav-btn ${activeGame === "dice" ? "active" : ""}`}>Dice Roll</button>
            <button onClick={() => setActiveGame("wheel")} className={`nav-btn ${activeGame === "wheel" ? "active" : ""}`}>Wheel</button>
            <button onClick={() => setActiveGame("coming")} className={`nav-btn ${activeGame === "coming" ? "active" : ""}`}>Coming Soon</button>
          </div>

          <div className="flex items-center" ref={walletMenuRef}>
            <button className="link-btn" onClick={() => setActivePage("profile")}>Profile</button>
            <button className="wallet-btn" onClick={connectWallet}>
              {walletAddress ? shortAddr(walletAddress) : "Connect Wallet"}
            </button>
            {walletAddress && walletMenuOpen && (
              <div className="wallet-menu">
                <div className="label" style={{ padding: "8px 10px", opacity: 0.8 }}>Connected: {shortAddr(walletAddress)}</div>
                <button className="danger" onClick={disconnectWallet}>Disconnect Wallet</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Left handles */}
      {activePage === "games" && !statsOpen && (
        <>
          <button className="handle stats-handle" onClick={() => setStatsOpen(true)} aria-label="Open stats">📊 Stats</button>
          <button className="handle leaderboard-handle" onClick={() => alert("Leaderboard coming soon")} aria-label="Open leaderboard">🏆 Leaderboard</button>
        </>
      )}

      {/* Wallet chooser modal */}
      {walletModalOpen && (
        <div className="wc-overlay" onClick={() => setWalletModalOpen(false)}>
          <div className="wc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wc-title">Choose a wallet</div>
            {providers.length === 0 ? (
              <div className="wc-empty">No injected wallets detected. Please install MetaMask, Rabby, Coinbase, or another browser wallet.</div>
            ) : (
              providers.map((p, idx) => (
                <button key={(p.rdns || p.name || "wallet") + String(idx)} className="wc-item" onClick={() => selectProviderAndConnect(p)}>
                  {p.name}
                </button>
              ))
            )}
            <button className="link-btn" style={{ width: "100%", marginTop: 8 }} onClick={() => setWalletModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="pt-28 flex flex-col items-center justify-center p-4">
        {activePage === "games" && (
          <>
            {/* CoinFlip */}
            {activeGame === "coinflip" && (
              <div className="card p-6 w-full max-w-md mt-2 border-2 border-white/10">
                <h1 className="text-4xl font-extrabold text-center title-gradient mb-6">CoinFlip</h1>
                <button onClick={connectWallet} className="wallet-btn w-full mb-6">
                  {walletAddress ? `Connected: ${shortAddr(walletAddress)}` : "Connect Wallet"}
                </button>
                <div className="text-center mb-6">
                  <p className="text-lg label">Prize Pool: <span className="value">{formatZTC(cfPool)} ZTC</span></p>
                  <p className="text-lg label">Your Pending Prize: <span className="value">{formatZTC(cfPending)} ZTC</span></p>
                  {parseFloat(cfPending) > 0 && <button onClick={claimPrizeCF} className="wallet-btn mt-3">Claim Prize</button>}
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-extrabold text-center title-gradient">Place Your Bet</h3>
                  <p className="text-center text-sm label">Min Bet: {cfMin} ZTC | Max Bet: {cfMax} ZTC</p>
                  <input type="number" step="0.000000000000000001" placeholder="Bet Amount (ZTC)" value={cfBetAmount} onChange={(e) => setCfBetAmount(e.target.value)} className="input mt-2" />
                  <div className="flex justify-center gap-8 mt-4">
                    <label className="flex items-center gap-2"><input type="radio" checked={cfGuess} onChange={() => setCfGuess(true)} className="accent-emerald-500" />Heads</label>
                    <label className="flex items-center gap-2"><input type="radio" checked={!cfGuess} onChange={() => setCfGuess(false)} className="accent-emerald-500" />Tails</label>
                  </div>
                </div>
                <button onClick={flipCoin} className={`btn-green ${uiPhase !== "idle" ? "btn-disabled" : ""}`} disabled={uiPhase !== "idle"}>Flip Coin!</button>
              </div>
            )}

            {/* Dice */}
            {activeGame === "dice" && (
              <div className="card p-6 w-full max-w-md mt-2 border-2 border-white/10">
                <h1 className="text-4xl font-extrabold text-center" style={{ background: "linear-gradient(135deg,#60a5fa,#0ea5e9)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Dice</h1>
                <button onClick={connectWallet} className="wallet-btn w-full mb-6">
                  {walletAddress ? `Connected: ${shortAddr(walletAddress)}` : "Connect Wallet"}
                </button>
                <div className="text-center mb-6">
                  <p className="text-lg label">Prize Pool: <span className="value">{formatZTC(dicePool)} ZTC</span></p>
                  <p className="text-lg label">Your Pending Prize: <span className="value">{formatZTC(dicePending)} ZTC</span></p>
                  {parseFloat(dicePending) > 0 && <button onClick={claimPrizeDice} className="wallet-btn mt-3">Claim Prize</button>}
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-extrabold text-center" style={{ background: "linear-gradient(135deg,#60a5fa,#0ea5e9)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Pick Your Number</h3>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
                    {[1,2,3,4,5,6].map((n) => (
                      <div key={n} onClick={() => setDiceGuess(n)} style={{
                        width: 48, height: 48, borderRadius: 10, border: `2px solid ${diceGuess === n ? "#2563eb" : "#60a5fa"}`,
                        background: diceGuess === n ? "#dbeafe" : "#fff", color: "#0f172a",
                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, cursor: "pointer"
                      }}>{n}</div>
                    ))}
                  </div>
                  <h3 className="text-xl font-extrabold text-center" style={{ background: "linear-gradient(135deg,#60a5fa,#0ea5e9)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", marginTop: 12 }}>Place Your Bet</h3>
                  <p className="text-center text-sm label">Min Bet: {diceMin} ZTC | Max Bet: {diceMax} ZTC</p>
                  <input type="number" step="0.000000000000000001" placeholder="Bet Amount (ZTC)" value={diceBetAmount} onChange={(e) => setDiceBetAmount(e.target.value)} className="input mt-2" />
                </div>
                <button onClick={rollDice} className={`btn-green ${uiPhase !== "idle" ? "btn-disabled" : ""}`} disabled={uiPhase !== "idle"}>Roll Dice!</button>
              </div>
            )}

            {/* Wheel */}
            {activeGame === "wheel" && (
              <div className="wheel-layout w-full mt-2">
                <div className="card p-6 w-full max-w-md border-2 border-white/10">
                  <h1 className="text-4xl font-extrabold text-center" style={{ background: "linear-gradient(135deg,#facc15,#f97316)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Wheel</h1>
                  <button onClick={connectWallet} className="wallet-btn w-full mb-6">
                    {walletAddress ? `Connected: ${shortAddr(walletAddress)}` : "Connect Wallet"}
                  </button>
                  <div className="text-center mb-6">
                    <p className="text-lg label">Prize Pool: <span className="value">{formatZTC(wheelPool)} ZTC</span></p>
                    <p className="text-lg label">Your Pending Prize: <span className="value">{formatZTC(wheelPending)} ZTC</span></p>
                    {parseFloat(wheelPending) > 0 && <button onClick={claimPrizeWheel} className="wallet-btn mt-3">Claim Prize</button>}
                  </div>
                  <div className="mb-6">
                    <h3 className="text-xl font-extrabold text-center" style={{ background: "linear-gradient(135deg,#facc15,#f97316)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Place Your Bet</h3>
                    <p className="text-center text-sm label">Min Bet: {wheelMin} ZTC | Max Bet: {wheelMax} ZTC</p>
                    <input type="number" step="0.000000000000000001" placeholder="Bet Amount (ZTC)" value={wheelBetAmount} onChange={(e) => setWheelBetAmount(e.target.value)} className="input mt-2" />
                  </div>
                  <button onClick={spinWheel} className={`btn-green ${uiPhase !== "idle" ? "btn-disabled" : ""}`} disabled={uiPhase !== "idle"}>Spin the Wheel!</button>
                </div>

                <div className="relative">
                  <div className="wheel">
                    <div className="wheel-ring" />
                    <div className="pointer" />
                    <div className={`wheel-rotor ${wheelAnimate ? "" : "no-transition"}`} style={{ transform: `rotate(${wheelRotation}deg)` }}>
                      <div className="wheel-face" style={{ background: wheelGradient }} />
                      {WHEEL_SEGMENTS.map((lbl, i) => (
                        <div key={i} className="seg-label" style={{ transform: labelTransform(i) }}>{lbl}</div>
                      ))}
                    </div>
                    <div className="wheel-center" />
                    <div className="wheel-label">{wheelLabel || " "}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Coming Soon */}
            {activeGame === "coming" && (
              <div className="card p-6 w-full max-w-md mt-2 border-2 border-white/10" style={{ textAlign: "center" }}>
                <h1 className="text-4xl font-extrabold" style={{ background: "linear-gradient(135deg,#a78bfa,#22c55e)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Coming Soon</h1>
                <p className="label" style={{ marginTop: 12 }}>A new game is on the way. Stay tuned!</p>
              </div>
            )}
          </>
        )}

        {/* Profile page */}
        {activePage === "profile" && (
          <div className="card p-6 w-full max-w-md mt-2">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-extrabold title-gradient">Profile</h1>
              <button className="link-btn" onClick={() => setActivePage("games")}>Back</button>
            </div>

            {!walletAddress ? (
              <div className="label" style={{ marginTop: 12, textAlign: "center" }}>Connect your wallet to edit your profile.</div>
            ) : (
              <>
                <div className="label" style={{ marginTop: 12, wordBreak: "break-all" }}>Address: {walletAddress}</div>

                <div className="label" style={{ marginTop: 12 }}>Display name</div>
                <input className="input" value={profileName} onChange={(e)=>setProfileName(e.target.value)} placeholder="Your name" />

                <div className="label" style={{ marginTop: 12 }}>Email</div>
                <input className="input" value={profileEmail} onChange={(e)=>setProfileEmail(e.target.value)} placeholder="name@example.com" />

                <div className="label" style={{ marginTop: 16, opacity: 0.8 }}>Totals (all games)</div>
                <div className="stat-row">
                  <span className="label">Total bets</span>
                  <span className="pill">
                    {formatZTC(
                      (Number(cfStats.totalBet)||0) + (Number(diceStats.totalBet)||0) + (Number(wheelStats.totalBet)||0)
                    )} ZTC
                  </span>
                </div>
                <div className="stat-row">
                  <span className="label">Total won</span>
                  <span className="pill">
                    {formatZTC(
                      (Number(cfStats.totalWon)||0) + (Number(diceStats.totalWon)||0) + (Number(wheelStats.totalWon)||0)
                      + (Number(cfPending)||0) + (Number(dicePending)||0) + (Number(wheelPending)||0)
                    )} ZTC
                  </span>
                </div>
                <div className="stat-row">
                  <span className="label">Total lost</span>
                  <span className="pill">
                    {formatZTC(
                      (Number(cfStats.totalLost)||0) + (Number(diceStats.totalLost)||0) + (Number(wheelStats.totalLost)||0)
                    )} ZTC
                  </span>
                </div>

                <button className="btn-green" style={{ marginTop: 14 }} onClick={saveProfile}>Save</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Waiting overlay */}
      {uiPhase === "waiting" && (
        <div className="overlay">
          <div className="wait-box">
            <div className="spinner" />
            <div style={{ color: "#fff", fontWeight: 800 }}>Processing transaction…</div>
          </div>
        </div>
      )}

      {/* Reveal overlays */}
      {uiPhase === "reveal" && overlay && (
        <div className="overlay">
          {overlay.game === "coinflip" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div className="coin3d">
                <div
                  key={flipRunId}
                  ref={coinInnerRef}
                  className="coin3d-inner"
                  style={{
                    transform: `rotateY(${coinAngle}deg)`,
                    transition: coinTransition ? `transform ${COIN_REVEAL_MS}ms cubic-bezier(0.15,0.8,0.2,1)` : "none"
                  }}
                >
                  <div className="coin-face coin-heads">Heads</div>
                  <div className="coin-face coin-tails">Tails</div>
                </div>
              </div>
            </div>
          )}
          {overlay.game === "dice" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div className="dice-scene">
                <div
                  key={diceRunId}
                  ref={diceInnerRef}
                  className="dice-cube"
                  style={{
                    transform: `rotateX(${diceAngles.x}deg) rotateY(${diceAngles.y}deg)`,
                    transition: diceTransition ? `transform ${DICE_REVEAL_MS}ms cubic-bezier(0.15,0.8,0.2,1)` : "none"
                  }}
                >
                  <div className="dice-face one">1</div>
                  <div className="dice-face six">6</div>
                  <div className="dice-face two">2</div>
                  <div className="dice-face five">5</div>
                  <div className="dice-face three">3</div>
                  <div className="dice-face four">4</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error modal */}
      {!!error && (
        <div className="overlay" onClick={() => setError("")}>
          <div className="result-modal" style={{ maxWidth: 320 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Notice</div>
            <div className="modal-msg" style={{ marginTop: 8 }}>{error}</div>
            <button className="modal-btn" onClick={() => setError("")}>Close</button>
          </div>
        </div>
      )}

      {/* Win/Lose modal */}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className={`result-modal ${modal.status}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{modal.status === "win" ? "You Won!" : "You Lost"}</div>
            <div className="modal-msg">{modal.message}</div>
            <button className="modal-btn" onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Stats drawer */}
      <div ref={statsRef} className={`stats-float ${statsOpen ? "open" : ""}`} role="dialog" aria-label="Player stats">
        <div className="stats-head">
          <div className="stats-title">Your Stats</div>
          <button className="close-chip" onClick={() => setStatsOpen(false)}>{statsRefreshing ? "Refreshing…" : "Close"}</button>
        </div>
        <div className="section">
          <div className="section-title">{activeGame === "coinflip" ? "CoinFlip" : activeGame === "dice" ? "Dice" : "Wheel"}</div>

          {activeGame === "coinflip" && (
            <>
              <div className="stat-row"><span className="label">Total bets</span><span className="pill">{formatZTC(cfStats.totalBet)} ZTC</span></div>
              <div className="stat-row"><span className="label">Total won</span><span className="pill">{formatZTC(totalWonCoinFlip)} ZTC</span></div>
              <div className="stat-row"><span className="label">Total lost</span><span className="pill">{formatZTC(cfStats.totalLost)} ZTC</span></div>
            </>
          )}
          {activeGame === "dice" && (
            <>
              <div className="stat-row"><span className="label">Total bets</span><span className="pill">{formatZTC(diceStats.totalBet)} ZTC</span></div>
              <div className="stat-row"><span className="label">Total won</span><span className="pill">{formatZTC(totalWonDice)} ZTC</span></div>
              <div className="stat-row"><span className="label">Total lost</span><span className="pill">{formatZTC(diceStats.totalLost)} ZTC</span></div>
            </>
          )}
          {activeGame === "wheel" && (
            <>
              <div className="stat-row"><span className="label">Total bets</span><span className="pill">{formatZTC(wheelStats.totalBet)} ZTC</span></div>
              <div className="stat-row"><span className="label">Total won</span><span className="pill">{formatZTC(totalWonWheel)} ZTC</span></div>
              <div className="stat-row"><span className="label">Total lost</span><span className="pill">{formatZTC(wheelStats.totalLost)} ZTC</span></div>
            </>
          )}

          <div className="stat-row" style={{ marginTop: 6 }}>
            <span className="label">Unclaimed rewards (all)</span>
            <span className="pill">💰 {formatZTC(
              (Number(cfPending)||0)+(Number(dicePending)||0)+(Number(wheelPending)||0)
            )} ZTC</span>
          </div>
          <button className="btn-green" onClick={withdrawAll} disabled={!walletAddress || (parseFloat(cfPending)+parseFloat(dicePending)+parseFloat(wheelPending)) <= 0} style={{ width: "100%", marginTop: 10 }}>
            Withdraw All
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;