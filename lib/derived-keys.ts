/**
 * Derived Key System for E2E Encryption
 *
 * Since wallets don't expose private keys, we use a deterministic signature-based
 * approach where both sender and recipient can derive the same encryption keypair.
 *
 * How it works:
 * 1. Recipient signs a deterministic message: "eshare encryption key v1 for {address}"
 * 2. The signature is hashed to derive a secp256k1 private key
 * 3. The corresponding public key is derived and stored
 * 4. Senders encrypt to this derived public key
 * 5. Recipients sign the same message and derive the same private key to decrypt
 *
 * This is NOT the recipient's actual Ethereum keypair - it's a separate keypair
 * derived from a wallet signature that only the wallet owner can produce.
 */

import * as secp256k1 from "@noble/secp256k1";
import { keccak256 } from "viem";
import { bytesToHex, hexToBytes } from "./ecies";

// The deterministic message used for key derivation
export function getDerivedKeyMessage(address: string): string {
  return `eshare encryption key v1 for ${address.toLowerCase()}`;
}

/**
 * Derive a secp256k1 private key from a signature
 */
export function derivePrivateKey(signature: string): Uint8Array {
  const hash = keccak256(signature as `0x${string}`);
  return hexToBytes(hash);
}

/**
 * Get the public key corresponding to a derived private key
 */
export function getPublicKeyFromPrivate(privateKey: Uint8Array): string {
  const publicKey = secp256k1.getPublicKey(privateKey, false); // uncompressed
  return "0x" + bytesToHex(publicKey);
}

/**
 * Derive both private and public keys from a signature
 */
export function deriveKeyPair(signature: string): {
  privateKey: Uint8Array;
  publicKey: string;
} {
  const privateKey = derivePrivateKey(signature);
  const publicKey = getPublicKeyFromPrivate(privateKey);
  return { privateKey, publicKey };
}
