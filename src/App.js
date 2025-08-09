import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

const contractAddress = "0x101d3cd9d30f512de106a0ca0c061431556b0d91";
const contractABI = [
  {
    "inputs": [],
    "name": "claimPrize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_minBet",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_maxBet",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Deposited",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "guess",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "betAmount",
        "type": "uint256"
      }
    ],
    "name": "flip",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "guess",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "result",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "won",
        "type": "bool"
      }
    ],
    "name": "Flipped",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "PrizeClaimed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxBet",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minBet",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "pendingPrizes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function App() {
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

  // اتصال به MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        if (parseInt(chainId, 16) !== 8408) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x20D8" }],
          });
        }
        setWalletAddress(accounts[0]);
        setError("");
      } catch (err) {
        console.error("Error connecting to wallet:", err);
        setError("Failed to connect wallet! Ensure MetaMask is on Zenchain Testnet (Chain ID: 8408).");
      }
    } else {
      setError("Please install MetaMask!");
    }
  };

  // گرفتن موجودی بانک جایزه
  const getPoolBalance = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://zenchain-testnet.api.onfinality.io/public");
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const balance = await contract.getBalance();
      setPoolBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error("Error getting pool balance:", err);
      setError("Failed to fetch prize pool. Check contract address or network.");
    }
  };

  // گرفتن حداقل و حداکثر شرط
  const getBetLimits = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://zenchain-testnet.api.onfinality.io/public");
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const min = await contract.minBet();
      const max = await contract.maxBet();
      setMinBet(ethers.formatEther(min));
      setMaxBet(ethers.formatEther(max));
    } catch (err) {
      console.error("Error getting bet limits:", err);
      setError("Failed to fetch bet limits. Check contract deployment.");
    }
  };

  // گرفتن جایزه در انتظار
  const getPendingPrize = async () => {
    if (!walletAddress) return;
    try {
      const provider = new ethers.JsonRpcProvider("https://zenchain-testnet.api.onfinality.io/public");
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const prize = await contract.pendingPrizes(walletAddress);
      setPendingPrize(ethers.formatEther(prize));
    } catch (err) {
      console.error("Error getting pending prize:", err);
      setError("Failed to fetch pending prize.");
    }
  };

  // اجرای بازی
  const flipCoin = async () => {
    if (!walletAddress || !betAmount) {
      setError("Connect wallet and enter a bet amount!");
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

      const event = receipt.logs
        .map((log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((log) => log && log.name === "Flipped");

      if (event) {
        const { won, result } = event.args;
        setResult(won ? `You won! Result: ${result ? "Heads" : "Tails"}` : `You lost! Result: ${result ? "Heads" : "Tails"}`);
        getPendingPrize();
        setError("");
      }
    } catch (err) {
      console.error("Error flipping coin:", err);
      setError("Transaction failed! Check bet amount, prize pool, or network.");
    } finally {
      setIsFlipping(false);
    }
  };

  // برداشت جایزه
  const claimPrize = async () => {
    if (!walletAddress) {
      setError("Connect wallet first!");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.claimPrize();
      await tx.wait();
      setError("");
      alert("Prize claimed successfully!");
      setPendingPrize("0");
      getPoolBalance();
    } catch (err) {
      console.error("Error claiming prize:", err);
      setError("Failed to claim prize! Check if you have a pending prize.");
    }
  };

  // نمایش صفحه برای بازی‌های دیگه
  const handleGameSelect = (game) => {
    setActiveGame(game);
    if (game !== "coinflip") {
      alert(`${game} is coming soon!`);
      setActiveGame("coinflip");
    }
  };

  // به‌روزرسانی اطلاعات
  useEffect(() => {
    getPoolBalance();
    getBetLimits();
    if (walletAddress) getPendingPrize();
  }, [walletAddress]);

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/zenchain-background.jpg')" }}>
      {/* هدر با لوگو، عنوان و دکمه‌ها */}
      <header className="bg-zen-dark-green p-2 flex justify-between items-center fixed w-full top-0 z-10">
        <h2 className="text-3xl font-bold text-zen-yellow ml-4">ZenBet</h2>
        <div className="flex justify-center flex-grow">
          <button onClick={() => handleGameSelect("coinflip")} className="bg-zen-green text-black px-4 py-2 mx-2 rounded hover:bg-zen-light-green">Coinflip</button>
          <button onClick={() => handleGameSelect("dice")} className="bg-zen-green text-black px-4 py-2 mx-2 rounded hover:bg-zen-light-green">Dice Roll (coming soon)</button>
          <button onClick={() => handleGameSelect("newgame")} className="bg-zen-green text-black px-4 py-2 mx-2 rounded hover:bg-zen-light-green">Coming Soon</button>
        </div>
        <img src="/zenchain-logo.png" alt="Zenchain Logo" className="h-16 mr-4" />
      </header>

      {/* محتوای اصلی با فاصله از هدر */}
      <div className="pt-16 flex flex-col items-center justify-center p-4">
        {activeGame === "coinflip" && (
          <div className="bg-zen-light-green p-6 rounded-xl shadow-lg w-full max-w-md mt-4 border-2 border-zen-green">
            <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-lime-500 to-zen-green bg-clip-text text-transparent mb-6">CoinFlip</h1>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <button
              onClick={connectWallet}
              className="w-full bg-zen-green text-white py-3 px-4 rounded-lg hover:bg-zen-yellow mb-6 transition-colors"
            >
              {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...` : "Connect Wallet"}
            </button>
            <div className="text-center mb-6">
              <p className="text-lg">Prize Pool: <span className="font-semibold text-black">{poolBalance} ZTC</span></p>
              <p className="text-lg">Your Pending Prize: <span className="font-semibold text-black">{pendingPrize} ZTC</span></p>
              {parseFloat(pendingPrize) > 0 && (
                <button
                  onClick={claimPrize}
                  className="mt-2 bg-zen-green text-white py-2 px-4 rounded hover:bg-zen-yellow"
                >
                  Claim Prize
                </button>
              )}
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-center bg-gradient-to-r from-lime-500 to-zen-green bg-clip-text text-transparent">Place Your Bet</h3>
              <p className="text-center text-sm text-black">
                Min Bet: {minBet} ZTC | Max Bet: {maxBet} ZTC
              </p>
              <input
                type="number"
                step="0.01"
                placeholder="Bet Amount (ZTC)"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full p-3 border-2 border-zen-green rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-zen-yellow text-black"
              />
              <div className="flex justify-center gap-6 mt-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={guess === true}
                    onChange={() => setGuess(true)}
                    className="mr-2 accent-zen-green"
                  />
                  <span className="text-black">Heads</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={guess === false}
                    onChange={() => setGuess(false)}
                    className="mr-2 accent-zen-green"
                  />
                  <span className="text-black">Tails</span>
                </label>
              </div>
            </div>
            <button
              onClick={flipCoin}
              disabled={isFlipping}
              className={`w-full py-3 px-4 rounded-lg text-white ${isFlipping ? "bg-gray-500 cursor-not-allowed" : "bg-zen-green hover:bg-zen-yellow transition-colors"}`}
            >
              {isFlipping ? "Flipping..." : "Flip Coin!"}
            </button>
            {result && <p className="text-center mt-4 text-lg font-semibold text-black">{result}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;