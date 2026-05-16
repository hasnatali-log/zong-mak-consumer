const crypto = require("crypto");

const SECRET_KEY = "xZzVL8Cw?Rr+qN&{fYTZ[NTu@n5b_&";
const SALT = "vU-43F;-=1E#dkq&QG0w%_.8)dwpDi";

if (!SECRET_KEY || !SALT) {
  throw new Error("Missing required encryption keys: SECRET_KEY or SALT.");
}

/**
 * Derives an encryption key using PBKDF2 with SHA-256
 * @param {string} encryptionKey - The encryption key
 * @param {string} salt - The salt value
 * @returns {Buffer} The derived key
 */
const generateKey = (encryptionKey, salt) => {
  try {
    // Use PBKDF2 to generate a key with SHA-256 and 100,000 iterations
    return crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, "sha256");
  } catch (error) {
    throw new Error(`Key generation failed: ${error.message}`);
  }
};

/**
 * Encrypts OTP for Zong in normal flow
 * @param {string} plainText - The OTP text to encrypt
 * @returns {string|null} Encrypted data in format "encryptedHex|ivHex" or null on failure
 */
const encryptZongOtp = (plainText) => {
  try {
    // Validate input
    if (!plainText || typeof plainText !== "string") {
      throw new Error("Invalid plain text input. Must be a non-empty string.");
    }

    // Generate a random IV (16 bytes for AES-CBC)
    const iv = crypto.randomBytes(16);

    // Generate key using PBKDF2
    const key = generateKey(SECRET_KEY, SALT);

    // Encrypt using AES-256-CBC
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return in format "encryptedHex|ivHex"
    return `${encrypted}|${iv.toString("hex")}`;
  } catch (error) {
    return null;
  }
};

module.exports = { encryptZongOtp };
