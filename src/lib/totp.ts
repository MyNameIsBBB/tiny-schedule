// TOTP implementation (RFC 6238) using built-in Web Crypto API

// Decodes a base32 string into a Uint8Array
function base32ToBytes(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/=+$/, "");
  const length = cleaned.length;
  const bytes = new Uint8Array(Math.floor((length * 5) / 8));
  
  let val = 0;
  let count = 0;
  let index = 0;
  
  for (let i = 0; i < length; i++) {
    const char = cleaned[i];
    const charVal = alphabet.indexOf(char);
    if (charVal === -1) throw new Error("Invalid base32 character");
    
    val = (val << 5) | charVal;
    count += 5;
    
    if (count >= 8) {
      bytes[index++] = (val >> (count - 8)) & 255;
      count -= 8;
    }
  }
  return bytes;
}

// Generates a base32-encoded random secret key
export function generateBase32Secret(length = 16): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += alphabet[bytes[i] % 32];
  }
  return result;
}

// Generates a TOTP code for a secret and counter offset step
export async function generateTOTP(secret: string, timeOffsetSteps = 0): Promise<string> {
  const keyBytes = base32ToBytes(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30) + timeOffsetSteps;
  
  // Counter must be represented as an 8-byte big-endian integer
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = temp >> 8;
  }
  
  // Import the base32 key for HMAC-SHA1
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as BufferSource,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, counterBytes as unknown as BufferSource);
  const hmac = new Uint8Array(signature);
  
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
    
  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

// Verifies a 6-digit TOTP code with time drift compensation (1 step before/after)
export async function verifyTOTP(token: string, secret: string): Promise<boolean> {
  // Allow code from current, previous, or next 30-second window
  for (let step = -1; step <= 1; step++) {
    const generated = await generateTOTP(secret, step);
    if (generated === token) return true;
  }
  return false;
}
