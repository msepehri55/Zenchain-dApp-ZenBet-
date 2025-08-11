import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

/* ===================== Contract ===================== */
const contractAddress = "0x101d3cd9d30f512de106a0ca0c061431556b0d91";
const contractABI = [
  {
    inputs: [],
    name: "claimPrize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "deposit", outputs: [], stateMutability: "payable", type: "function" },
  {
    inputs: [
      { internalType: "uint256", name: "_minBet", type: "uint256" },
      { internalType: "uint256", name: "_maxBet", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "from", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Deposited",
    type: "event",
  },
  {
    inputs: [
      { internalType: "bool", name: "guess", type: "bool" },
      { internalType: "uint256", name: "betAmount", type: "uint256" },
    ],
    name: "flip",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "bool", name: "guess", type: "bool" },
      { indexed: false, internalType: "bool", name: "result", type: "bool" },
      { indexed: false, internalType: "bool", name: "won", type: "bool" },
    ],
    name: "Flipped",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "PrizeClaimed",
    type: "event",
  },
  { inputs: [], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Withdrawn",
    type: "event",
  },
  { stateMutability: "payable", type: "receive" },
  {
    inputs: [],
    name: "getBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxBet",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minBet",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "pendingPrizes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

/* ===================== Network Config ===================== */
const ZENCHAIN = {
  chainId: "0x20D8", // 8408
  chainName: "Zenchain Testnet",
  nativeCurrency: { name: "ZTC", symbol: "ZTC", decimals: 18 },
  rpcUrls: ["https://zenchain-testnet.api.onfinality.io/public"],
  blockExplorerUrls: [],
};

/* ===================== Helpers ===================== */
const shortAddr = (addr = "") => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");
const formatZTC = (v) => {
  try {
    const n = Number(v);
    if (Number.isNaN(n)) return "0";
    if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return n.toString();
  } catch {
    return v;
  }
};

/* ===================== Component ===================== */
function App() {
  // Wallet / contract state
  const [walletAddress, setWalletAddress] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [guess, setGuess] = useState(true); // true = Heads, false = Tails
  const [result, setResult] = useState("");
  const [poolBalance, setPoolBalance] = useState("0");
  const [pendingPrize, setPendingPrize] = useState("0");
  const [minBet, setMinBet] = useState("0");
  const [maxBet, setMaxBet] = useState("0");
  const [error, setError] = useState("");
  const [isFlipping, setIsFlipping] = useState(false);
  const [activeGame, setActiveGame] = useState("coinflip");
  const [resultInfo, setResultInfo] = useState(null); // { status: 'win'|'lose', side: 'Heads'|'Tails' }

  // Inject component-scoped CSS (animations, header, etc.)
  useEffect(() => {
    if (document.getElementById("zenbet-styles")) return;
    const style = document.createElement("style");
    style.id = "zenbet-styles";
    style.innerHTML = `
      :root {
        --zen-border: rgba(255,255,255,0.14);
      }
      .header-shell { position: fixed; top:0; left:0; right:0; z-index: 20; padding: 8px 12px; background: transparent; }
      .header {
        max-width: 1100px; margin: 0 auto;
        background: linear-gradient(112deg, rgba(16,185,129,0.85), rgba(52,211,153,0.75), rgba(251,191,36,0.45));
        border: 1px solid var(--zen-border);
        -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
        border-radius: 18px; padding: 10px 14px; box-shadow: 0 8px 18px rgba(0,0,0,0.25);
      }
      .brand {
        font-weight: 900; letter-spacing: .5px; font-size: 28px;
        background: radial-gradient(circle at 50% 50%, #ffd08a, #f59e0b 40%, #b45309 70%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
        text-shadow: 0 2px 12px rgba(245,158,11,.25);
      }
      .nav-btn {
        color: #0f172a; background: rgba(255,255,255,0.9);
        border: 1px solid var(--zen-border);
        padding: 8px 14px; margin: 0 6px; border-radius: 12px;
        transition: transform .15s ease, box-shadow .15s ease, background .2s ease;
      }
      .nav-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 12px rgba(0,0,0,.15); background: #ffffff; }
      .nav-btn.active { outline: 2px solid rgba(245,158,11,.6); background: #fff7ed; }
      .wallet-btn {
        color: #0f172a; background: linear-gradient(135deg, #34d399, #22c55e);
        border-radius: 12px; padding: 10px 14px; font-weight: 700;
        border: 1px solid var(--zen-border);
      }
      .wallet-btn:hover { filter: brightness(1.05); }
      .disconnect-btn {
        color: #991b1b; background: rgba(255,255,255,.98);
        border: 1px solid #fecaca; border-radius: 10px; padding: 8px 12px; margin-left: 8px; font-weight: 600;
      }
      .card {
        background: rgba(255,255,255,0.9);
        border: 1px solid var(--zen-border);
        border-radius: 18px;
        box-shadow: 0 12px 24px rgba(0,0,0,.2);
      }
      .title-gradient {
        background: linear-gradient(135deg, #a3e635, #22c55e);
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .label { color: #0f172a; font-weight: 600; }
      .value { color: #0f172a; font-weight: 800; }
      .input {
        border-radius: 12px; border: 2px solid #86efac; padding: 12px; width: 100%; color: #0f172a;
        background: rgba(255,255,255,.98);
      }
      .input::placeholder { color: #9ca3af; }
      .radio label { color: #0f172a; }
      .flip-btn {
        background: linear-gradient(135deg,#34d399,#22c55e); color: #0f172a; font-weight: 800;
        border-radius: 12px; padding: 12px 16px; width: 100%;
        border: 1px solid var(--zen-border); transition: transform .15s ease, filter .2s ease;
      }
      .flip-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }
      .flip-btn[disabled] { background: #cbd5e1; color: #475569; cursor: not-allowed; }
      .coin {
        width: 84px; height: 84px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #fff7ed, #f59e0b 55%, #b45309);
        border: 2px solid #f59e0b;
        box-shadow: inset 0 2px 4px rgba(255,255,255,.6), inset 0 -2px 4px rgba(0,0,0,.4), 0 10px 18px rgba(0,0,0,.25);
      }
      @keyframes coinFlip {
        0% { transform: rotateY(0deg) rotateX(0deg) translateY(0); }
        50% { transform: rotateY(720deg) rotateX(20deg) translateY(-6px); }
        100% { transform: rotateY(1440deg) rotateX(0deg) translateY(0); }
      }
      .flip-anim { animation: coinFlip 1.2s cubic-bezier(0.2,0.6,0.2,1) infinite; }
      .result-overlay {
        position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.5); z-index: 30;
      }
      .result-badge {
        padding: 18px 28px; border-radius: 16px; font-size: 26px; font-weight: 900;
        color: #0f172a; text-align: center;
        box-shadow: 0 10px 24px rgba(0,0,0,.25);
      }
      .result-badge.win { background: linear-gradient(135deg,#bbf7d0,#86efac); border: 1px solid #4ade80; }
      .result-badge.lose { background: linear-gradient(135deg,#fecaca,#fda4af); border: 1px solid #f87171; }
      .toast {
        position: fixed; bottom: 20px; right: 20px; background: rgba(17,24,39,.95);
        color: #ffffff; padding: 12px 16px; border-radius: 12px; z-index: 40;
        box-shadow: 0 8px 18px rgba(0,0,0,.25); max-width: 90vw;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const providerRPC = useMemo(
    () => new ethers.JsonRpcProvider("https://zenchain-testnet.api.onfinality.io/public"),
    []
  );

  const ensureZenchain = async () => {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== ZENCHAIN.chainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ZENCHAIN.chainId }],
        });
      } catch (e) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [ZENCHAIN],
          });
        } else {
          throw e;
        }
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) return setError("Please install MetaMask!");
    try {
      await ensureZenchain();
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts?.[0] || "");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to connect wallet or switch network.");
    }
  };

  const disconnectWallet = () => {
    // Can't force MetaMask to disconnect, but we clear app state
    setWalletAddress("");
    setPendingPrize("0");
    setResult("");
    setError("");
  };

  const getContractRO = useMemo(() => {
    return new ethers.Contract(contractAddress, contractABI, providerRPC);
  }, [providerRPC]);

  const getPoolBalance = async () => {
    try {
      const balance = await getContractRO.getBalance();
      setPoolBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error("Error getting pool balance:", err);
      setError("Failed to fetch prize pool. Check contract address or network.");
    }
  };

  const getBetLimits = async () => {
    try {
      const min = await getContractRO.minBet();
      const max = await getContractRO.maxBet();
      setMinBet(ethers.formatEther(min));
      setMaxBet(ethers.formatEther(max));
    } catch (err) {
      console.error("Error getting bet limits:", err);
      setError("Failed to fetch bet limits. Check contract deployment.");
    }
  };

  const getPendingPrize = async () => {
    if (!walletAddress) return;
    try {
      const prize = await getContractRO.pendingPrizes(walletAddress);
      setPendingPrize(ethers.formatEther(prize));
    } catch (err) {
      console.error("Error getting pending prize:", err);
      setError("Failed to fetch pending prize.");
    }
  };

  const flipCoin = async () => {
    if (!walletAddress) return setError("Connect wallet first!");
    const validBet =
      betAmount &&
      Number(betAmount) > 0 &&
      /^\d+(\.\d{1,18})?$/.test(betAmount.toString().trim());
    if (!validBet) {
      setError("Enter a valid bet amount (up to 18 decimals).");
      return;
    }

    try {
      setIsFlipping(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const betValue = ethers.parseEther(betAmount);
      if (betValue < ethers.parseEther(minBet) || betValue > ethers.parseEther(maxBet)) {
        setError(`Bet amount must be between ${minBet} and ${maxBet} ZTC`);
        setIsFlipping(false);
        return;
      }

      const tx = await contract.flip(guess, betValue, { value: betValue });
      const receipt = await tx.wait();

      // Safer event parsing (filter by address)
      const iface = new ethers.Interface(contractABI);
      let displayText = "";
      let info = null;
      for (const log of receipt.logs) {
        if ((log.address || "").toLowerCase() !== contractAddress.toLowerCase()) continue;
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "Flipped") {
            const { won, result: flipResult } = parsed.args;
            const side = flipResult ? "Heads" : "Tails";
            displayText = won ? `You won! Result: ${side}` : `You lost! Result: ${side}`;
            info = { status: won ? "win" : "lose", side };
            break;
          }
        } catch {
          // ignore non-matching logs
        }
      }

      if (displayText) {
        setResult(displayText);
        setResultInfo(info);
        setTimeout(() => setResultInfo(null), 1800);
        await Promise.all([getPendingPrize(), getPoolBalance()]);
        setError("");
      } else {
        setResult("Flip confirmed, but could not parse event.");
      }
    } catch (err) {
      console.error("Error flipping coin:", err);
      const msg = err?.shortMessage || err?.info?.error?.message || err?.message || "Transaction failed!";
      setError(msg);
    } finally {
      setIsFlipping(false);
    }
  };

  const claimPrize = async () => {
    if (!walletAddress) return setError("Connect wallet first!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.claimPrize();
      await tx.wait();
      setError("");
      setPendingPrize("0");
      await getPoolBalance();
      setResult("Prize claimed successfully!");
    } catch (err) {
      console.error("Error claiming prize:", err);
      const msg = err?.shortMessage || err?.info?.error?.message || err?.message || "Failed to claim prize!";
      setError(msg);
    }
  };

  const handleGameSelect = (game) => {
    setActiveGame(game);
    if (game !== "coinflip") {
      alert(`${game} is coming soon!`);
      setActiveGame("coinflip");
    }
  };

  // Load static data
  useEffect(() => {
    getPoolBalance();
    getBetLimits();
  }, []);

  // Load pending prize when wallet changes
  useEffect(() => {
    if (walletAddress) getPendingPrize();
  }, [walletAddress]);

  // Wallet events: account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = (accs) => setWalletAddress(accs?.[0] || "");
    const onChainChanged = () => window.location.reload();
    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, []);

  // Listen to PrizeClaimed to refresh
  useEffect(() => {
    if (!window.ethereum || !walletAddress) return;
    (async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const c = new ethers.Contract(contractAddress, contractABI, signer);
      const onPrizeClaimed = (player) => {
        if ((player || "").toLowerCase() === walletAddress.toLowerCase()) {
          getPendingPrize();
          getPoolBalance();
        }
      };
      c.on("PrizeClaimed", onPrizeClaimed);
      return () => c.removeAllListeners("PrizeClaimed");
    })();
  }, [walletAddress]);

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/zenchain-background.jpg')" }}
    >
      {/* Header (rounded, colorful, readable) */}
      <div className="header-shell">
        <div className="header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/zenchain-logo.png" alt="Zenchain Logo" className="h-10 w-10 rounded-lg" />
            <h2 className="brand">ZenBet</h2>
          </div>
          <div className="flex justify-center flex-grow">
            <button
              onClick={() => handleGameSelect("coinflip")}
              className={`nav-btn ${activeGame === "coinflip" ? "active" : ""}`}
            >
              Coinflip
            </button>
            <button onClick={() => handleGameSelect("dice")} className="nav-btn">
              Dice Roll (coming soon)
            </button>
            <button onClick={() => handleGameSelect("newgame")} className="nav-btn">
              Coming Soon
            </button>
          </div>
          <div className="flex items-center">
            {!walletAddress ? (
              <button onClick={connectWallet} className="wallet-btn">
                Connect Wallet
              </button>
            ) : (
              <>
                <button className="wallet-btn" onClick={connectWallet} title="Re-connect / switch account">
                  {shortAddr(walletAddress)}
                </button>
                <button className="disconnect-btn" onClick={disconnectWallet}>
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-28 flex flex-col items-center justify-center p-4">
        {activeGame === "coinflip" && (
          <div className="card p-6 w-full max-w-md mt-2 border-2 border-white/10">
            <h1 className="text-4xl font-extrabold text-center title-gradient mb-6">CoinFlip</h1>

            {/* Wallet button inside card for mobile too */}
            <button onClick={connectWallet} className="wallet-btn w-full mb-6">
              {walletAddress ? `Connected: ${shortAddr(walletAddress)}` : "Connect Wallet"}
            </button>

            <div className="text-center mb-6">
              <p className="text-lg label">
                Prize Pool: <span className="value">{formatZTC(poolBalance)} ZTC</span>
              </p>
              <p className="text-lg label">
                Your Pending Prize: <span className="value">{formatZTC(pendingPrize)} ZTC</span>
              </p>
              {parseFloat(pendingPrize) > 0 && (
                <button onClick={claimPrize} className="wallet-btn mt-3">
                  Claim Prize
                </button>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-extrabold text-center title-gradient">Place Your Bet</h3>
              <p className="text-center text-sm label">
                Min Bet: {minBet} ZTC | Max Bet: {maxBet} ZTC
              </p>
              <input
                type="number"
                step="0.000000000000000001"
                placeholder="Bet Amount (ZTC)"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="input mt-2"
              />

              <div className="flex justify-center gap-8 mt-4 radio">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={guess === true}
                    onChange={() => setGuess(true)}
                    className="accent-emerald-500"
                  />
                  Heads
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={guess === false}
                    onChange={() => setGuess(false)}
                    className="accent-emerald-500"
                  />
                  Tails
                </label>
              </div>
            </div>

            <button onClick={flipCoin} disabled={isFlipping} className="flip-btn">
              {isFlipping ? "Flipping..." : "Flip Coin!"}
            </button>

            {result && <p className="text-center mt-4 text-lg font-bold label">{result}</p>}
          </div>
        )}
      </div>

      {/* Flipping animation overlay */}
      {isFlipping && (
        <div className="result-overlay">
          <div className="coin flip-anim" aria-label="Coin flipping animation" />
        </div>
      )}

      {/* Win/Lose overlay */}
      {resultInfo && (
        <div className="result-overlay">
          <div className={`result-badge ${resultInfo.status === "win" ? "win" : "lose"}`}>
            {resultInfo.status === "win" ? "You Won! " : "You Lost! "}
            <div style={{ fontSize: 16, fontWeight: 700, opacity: 0.8, marginTop: 6 }}>
              Result: {resultInfo.side}
            </div>
          </div>
        </div>
      )}

      {/* Toast for errors */}
      {!!error && <div className="toast">{error}</div>}
    </div>
  );
}

export default App;