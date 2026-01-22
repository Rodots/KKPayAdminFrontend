import { XChaCha20Poly1305 } from '@stablelib/xchacha20poly1305'

// 任意字符串 → 32 字节 Uint8Array
function keyBytes(s: string = '') {
  return new TextEncoder().encode(s.padEnd(32, '0').slice(0, 32))
}

export class XCrypto {
  private cipher: XChaCha20Poly1305

  constructor(keyStr: string) {
    this.cipher = new XChaCha20Poly1305(keyBytes(keyStr))
  }

  // 加密 → base64（nonce|ct|tag）
  encrypt(plain: string, aad?: string): string {
    const nonce = crypto.getRandomValues(new Uint8Array(24))
    const ct = this.cipher.seal(
      nonce,
      new TextEncoder().encode(plain),
      aad ? new TextEncoder().encode(aad) : undefined,
    )
    return btoa(
      String.fromCharCode(...nonce, ...ct),
    )
  }

  // 解密
  decrypt(b64: string, aad?: string): string | null {
    const data = new Uint8Array(
      atob(b64)
        .split('')
        .map(c => c.charCodeAt(0)),
    )
    const nonce = data.slice(0, 24)
    const ct = data.slice(24)
    const pt = this.cipher.open(
      nonce,
      ct,
      aad ? new TextEncoder().encode(aad) : undefined,
    )
    return pt && new TextDecoder().decode(pt)
  }
}
