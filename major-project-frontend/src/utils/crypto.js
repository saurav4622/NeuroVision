// Lightweight AES-256-CBC encryption using Web Crypto API
// Returns hex-encoded ciphertext, key, and iv to match backend expectations

const toHex = (buf) => Array.from(new Uint8Array(buf))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

export async function encryptPayload(data) {
  const text = JSON.stringify(data);
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(text);

  // 32-byte key (256-bit), 16-byte IV
  const keyBytes = new Uint8Array(32);
  const ivBytes = new Uint8Array(16);
  crypto.getRandomValues(keyBytes);
  crypto.getRandomValues(ivBytes);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: ivBytes },
    cryptoKey,
    plaintext
  );

  return {
    encryptedData: toHex(ciphertext),
    key: toHex(keyBytes),
    iv: toHex(ivBytes)
  };
}
