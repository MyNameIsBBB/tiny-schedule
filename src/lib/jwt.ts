const encoder = new TextEncoder();

function base64urlEncode(str: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...str));
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function signJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["verify"]
    );

    const signature = base64urlDecode(encodedSignature);
    const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature as unknown as ArrayBuffer,
      data as unknown as ArrayBuffer
    );

    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64urlDecode(encodedPayload));
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    if (payload.exp && Date.now() > (payload.exp as number)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}
