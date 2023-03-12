// Standard Next and CSS imports
import Head from "next/head";
import { Fragment, useState, useEffect } from "react";
import styles from "../styles/mainpage.module.css";
import { useRouter } from "next/router";

// Imports from the constants.js file
import { apiKey, contractAddress } from "@/data/constants";

// Wagmi import for connected wallet info
import { useAccount } from "wagmi";

// Ethers for invoking functions on smart contract
import { ethers } from 'ethers';

// Contract ABI import
import contract from '@/contracts/ThankYouNft.json';

// Extract ABI from the ABI JSON file
const abi = contract.abi;

export default function Home() {

  // Standard Next router definition
  const router = useRouter();

  // Get connected wallet address and connection status
  const { address, isConnected } = useAccount();

  // Donor name
  const [donorName, setDonorName] = useState(null);

  // Tip amount
  const [amount, setAmount] = useState(null);

  // Page mounting info to prevent hydration errors
  const [hasMounted, setHasMounted] = useState(false);

  // Minting state
  const [isMinting, setIsMinting] = useState(false);

  // Flag to check if minting has succeeded
  const [success, setSuccess] = useState(false);

  // Form error message
  const [formError, setFormError] = useState(null);

  // Mounting fix to avoid hydration errors
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Do not render until entire UI is mounted  
  if (!hasMounted) return null;

  // Redirect to Connect page if wallet is not connected
  if (!isConnected) {
    router.replace('/connect');
  }

  // Handlers for form inputs
  const amountHandler = (e) => {
    setAmount(e.target.value);
  }

  const nameHandler = (e) => {
    setDonorName(e.target.value);
  }

  // Mint function invoked when form is submitted
  const mintNft = async (e) => {

    e.preventDefault();
    setFormError(false);

    // Basic check for correctness of data
    if (donorName.length === 0 || parseFloat(amount) < 0.001) {
      console.log("Incorrect form input");
      setFormError(true);
      return;
    }

    try {

      // Get MetaMask Ethereum instance
      const { ethereum } = window;

      if (ethereum) {

        // Reset states
        setIsMinting(true);
        setFormError(false);
        setSuccess(false);

        // Define provider, signer, and an instance of the contract
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(contractAddress, abi, signer);

        // Call the mint function
        console.log("Initialize payment");
        let nftTxn = await nftContract.mintThankYou("Satoshi", { value: ethers.utils.parseEther('0.001') });

        console.log("Mining... please wait");
        await nftTxn.wait();

        console.log(`Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`);

        // Set final states
        setIsMinting(false);
        setSuccess(true);
        setDonorName(null);
        setAmount(null)
      } else {
        console.log("Ethereum object does not exist");
      }

    } catch (err) {

      // Something wrong has happened. Set error and minting states
      setIsMinting(false);
      setFormError(true);
      console.log(err);
    }
  }

  return (
    <Fragment>
      <Head>
        <title>Tip and Mint a Thank You NFT!</title>
      </Head>

      <div className={styles.jumbotron}>

        <h1>Tip and Mint a Thank You NFT!</h1>

        {/* Main Form */}
        <form onSubmit={mintNft} className={styles.mint_form}>
          <input type="text" id="name" name="name" placeholder="Your Name" onChange={nameHandler} value={donorName} />
          <input type="number" id="amount" name="amount" min={0.001} placeholder="Donation Amount in ETH (min 0.001 ETH)" onChange={amountHandler} value={amount} step={0.001} />
          <button type="submit">
            Tip
          </button>
        </form>

        {/* Helpful messages for end user to know what's going on */}
        {isMinting && <p>Your NFT is minting...</p>}
        {success && <p>Thank you for your donation! Check out your NFT on OpenSea!</p>}
        {formError && <p>Something went wrong! Try again.</p>}
      </div>
    </Fragment>
  )
}