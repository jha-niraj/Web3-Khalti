// keys.ts
import * as bip39 from "bip39";
import { HDKey } from "micro-ed25519-hdkey";
import * as ed from "@noble/ed25519";
import bs58 from "bs58";
import { HDNodeWallet, Mnemonic } from "ethers";

/** ---------- Helpers ---------- */
export const toHex = (u8: Uint8Array) => Buffer.from(u8).toString("hex");
export const toBase64 = (u8: Uint8Array) => Buffer.from(u8).toString("base64");
export const toBase58 = (u8: Uint8Array) => bs58.encode(Buffer.from(u8));

/** Validate mnemonic (throws if invalid) */
export function assertMnemonic(mnemonic: string) {
    if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error("Invalid BIP39 mnemonic");
    }
}

/** ---------- Solana (Ed25519) ---------- */
/** Standard Solana path: m/44'/501'/0'/0' */
const SOLANA_PATH = `m/44'/501'/0'/0'`;

/** Derive Solana keypair (Ed25519) from mnemonic using noble + micro-ed25519-hdkey */
export async function deriveSolanaFromMnemonic(mnemonic: string, customPath?: string) {
    assertMnemonic(mnemonic);
    const seed = bip39.mnemonicToSeedSync(mnemonic); // 64 bytes
    const hd = HDKey.fromMasterSeed(seed);
    const child = hd.derive(customPath || SOLANA_PATH);

    if (!child.privateKey) throw new Error("No private key derived");
    const privKey = child.privateKey;                 // 32-byte seed for ed25519
    const pubKey = await ed.getPublicKeyAsync(privKey);

    // Solana commonly shows public keys in Base58
    return {
        privateKeyHex: toHex(privKey),
        privateKeyBase64: toBase64(privKey),
        publicKeyHex: toHex(pubKey),
        publicKeyBase58: toBase58(pubKey),
        rawPrivateKey: privKey,  // Uint8Array(32)
        rawPublicKey: pubKey     // Uint8Array(32)
    };
}

/** Sign/verify with Solana (Ed25519) */
export async function solanaSign(message: Uint8Array, privateKey: Uint8Array) {
    return ed.signAsync(message, privateKey);
}
export async function solanaVerify(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array
) {
    return ed.verifyAsync(signature, message, publicKey);
}

/** ---------- Ethereum (secp256k1) ---------- */
/** Standard ETH path: m/44'/60'/0'/0/0 */
const ETH_PATH = `m/44'/60'/0'/0/0`;

/** Derive Ethereum wallet (secp256k1) from mnemonic using ethers v6 */
export function deriveEthereumFromMnemonic(mnemonic: string, customPath?: string) {
    assertMnemonic(mnemonic);

    // ethers can create from mnemonic directly, but to mirror flow we go seed -> HD
    const seed = Mnemonic.fromPhrase(mnemonic).computeSeed(); // Uint8Array
    const root = HDNodeWallet.fromSeed(seed);
    const wallet = root.derivePath(customPath || ETH_PATH);

    // wallet.privateKey: 0x-prefixed hex; wallet.publicKey is uncompressed 0x04...
    return {
        address: wallet.address,                // 0x...
        privateKeyHex0x: wallet.privateKey,     // 0x...
        publicKeyHex0x: wallet.publicKey,       // 0x04 + 64-byte xy
        wallet                                    // ethers Wallet (HDNodeWallet)
    };
}

/** Sign/verify with Ethereum (EIP-191 personal_sign style) */
export async function ethereumSignMessage(
    wallet: HDNodeWallet,
    message: string | Uint8Array
) {
    return wallet.signMessage(message);       // returns 0x...
}

/** Recover address from signature */
export async function ethereumRecoverMessage(
    message: string | Uint8Array,
    signatureHex0x: string
) {
    // ethers exposes verifyMessage helper:
    const { verifyMessage } = await import("ethers");
    return verifyMessage(message, signatureHex0x);
}