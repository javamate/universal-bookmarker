// @ts-ignore
import CryptoJS from 'crypto-js';
import type { Bookmark } from '../types';

export interface EncryptionResult {
  encrypted: boolean;
  encryptedData?: string;
  encryptionKey?: string;
  originalData?: any;
}

export class EncryptionService {
  /**
   * Generate a random encryption key
   */
  generateKey(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  /**
   * Encrypt bookmark data
   */
  encryptBookmark(bookmark: Partial<Bookmark>, key: string): EncryptionResult {
    if (!key || key.trim().length === 0) {
      return {
        encrypted: false,
        originalData: bookmark
      };
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(bookmark),
        key
      ).toString();

      return {
        encrypted: true,
        encryptedData: encrypted,
        encryptionKey: key
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      return {
        encrypted: false,
        originalData: bookmark
      };
    }
  }

  /**
   * Decrypt bookmark data
   */
  decryptBookmark<T>(encryptedData: string, key: string): T | null {
    if (!encryptedData || !key) {
      return null;
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption resulted in empty string');
      }

      return JSON.parse(decryptedString) as T;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Encrypt specific fields of a bookmark
   */
  encryptBookmarkFields(
    bookmark: Bookmark,
    key: string,
    fieldsToEncrypt: (keyof Bookmark)[]
  ): { bookmark: Bookmark; encryptedFields: string[] } {
    const encryptedFields: string[] = [];
    const updatedBookmark = { ...bookmark };

    fieldsToEncrypt.forEach(field => {
      const fieldValue = updatedBookmark[field];
      
      if (fieldValue && typeof fieldValue === 'object' && field !== 'categories' && field !== 'tags') {
        const encrypted = this.encryptBookmark(fieldValue as any, key);
        if (encrypted.encrypted && encrypted.encryptedData) {
          (updatedBookmark as any)[field] = encrypted.encryptedData;
          encryptedFields.push(field);
        }
      }
    });

    return {
      bookmark: updatedBookmark,
      encryptedFields
    };
  }

  /**
   * Decrypt specific fields of a bookmark
   */
  decryptBookmarkFields<T>(
    bookmark: Partial<Bookmark>,
    key: string,
    fieldsToDecrypt: (keyof Bookmark)[]
  ): Partial<Bookmark> {
    const decryptedBookmark = { ...bookmark };

    fieldsToDecrypt.forEach(field => {
      const fieldValue = decryptedBookmark[field];
      
      if (fieldValue && typeof fieldValue === 'string' && fieldValue.length > 100) {
        const decrypted = this.decryptBookmark<T>(fieldValue, key);
        if (decrypted) {
          (decryptedBookmark as any)[field] = decrypted;
        }
      }
    });

    return decryptedBookmark;
  }

  /**
   * Create a hash of the encryption key for storage
   */
  hashKey(key: string): string {
    return CryptoJS.SHA256(key).toString();
  }

  /**
   * Verify that a key matches the stored hash
   */
  verifyKey(key: string, storedHash: string): boolean {
    return this.hashKey(key) === storedHash;
  }

  /**
   * Generate a key from user input (derives a consistent key from password)
   */
  deriveKey(password: string, salt: string = 'universal-bookmarker-salt'): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 10000
    }).toString();
  }

  /**
   * Store encryption metadata securely
   */
  storeEncryptionMetadata(userId: string, metadata: {
    keyHash: string;
    encryptedFields: string[];
    timestamp: number;
  }): void {
    const storageKey = `encryption_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(metadata));
  }

  /**
   * Retrieve encryption metadata
   */
  getEncryptionMetadata(userId: string): {
    keyHash: string;
    encryptedFields: string[];
    timestamp: number;
  } | null {
    const storageKey = `encryption_${userId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Clear encryption metadata for a user
   */
  clearEncryptionMetadata(userId: string): void {
    const storageKey = `encryption_${userId}`;
    localStorage.removeItem(storageKey);
  }

  /**
   * Check if bookmark data is encrypted
   */
  isBookmarkEncrypted(bookmark: Partial<Bookmark>): boolean {
    return Boolean(
      bookmark.privacy?.isEncrypted || 
      (bookmark.content && typeof bookmark.content === 'string' && (bookmark.content as string).length > 100)
    );
  }

  /**
   * Prepare bookmark for storage with optional encryption
   */
  prepareBookmarkForStorage(
    bookmark: Bookmark,
    encryptionKey?: string
  ): { bookmark: Bookmark; encryptionMetadata?: any } {
    let preparedBookmark = { ...bookmark };

    if (encryptionKey && encryptionKey.trim().length > 0) {
      // Encrypt sensitive content
      const fieldsToEncrypt: (keyof Bookmark)[] = ['content'];
      const { bookmark: encryptedBookmark, encryptedFields } = 
        this.encryptBookmarkFields(preparedBookmark, encryptionKey, fieldsToEncrypt);

      preparedBookmark = {
        ...encryptedBookmark,
        privacy: {
          isEncrypted: true,
          encryptionKey: undefined // Don't store the key, only metadata
        }
      };

      // Store encryption metadata locally (not in Algolia)
      this.storeEncryptionMetadata(bookmark.userId, {
        keyHash: this.hashKey(encryptionKey),
        encryptedFields,
        timestamp: Date.now()
      });

      return {
        bookmark: preparedBookmark,
        encryptionMetadata: {
          isEncrypted: true,
          encryptedFields,
          hasEncryptionKey: true
        }
      };
    }

    return { bookmark: preparedBookmark };
  }

  /**
   * Retrieve bookmark with decryption if needed
   */
  async retrieveBookmarkWithDecryption(
    bookmark: Bookmark,
    encryptionKey?: string
  ): Promise<Bookmark> {
    if (!bookmark.privacy?.isEncrypted || !encryptionKey) {
      return bookmark;
    }

    const metadata = this.getEncryptionMetadata(bookmark.userId);
    if (!metadata || !this.verifyKey(encryptionKey, metadata.keyHash)) {
      throw new Error('Invalid encryption key');
    }

    const fieldsToDecrypt: (keyof Bookmark)[] = ['content'];
    const decrypted = this.decryptBookmarkFields(bookmark, encryptionKey, fieldsToDecrypt);

    return decrypted as Bookmark;
  }
}

// Singleton instance
let encryptionService: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new EncryptionService();
  }
  return encryptionService;
}