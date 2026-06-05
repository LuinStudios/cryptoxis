export class Cryptoxis {
  static async encrypt(file, encryptedWriter, keyWriter, progress = () => {}) {
    let processedBytes = 0;
    let totalBytes = file.size;
    let chunkCount = Chunk.count(file);

    try {
      for (let index = 0; index < chunkCount; index++) {
        let plaintext = await Chunk.read(file, index);
        let key = Key.create(plaintext.length);
        let encrypted = Chunk.xor(plaintext, key);

        await encryptedWriter.write(encrypted);
        await keyWriter.write(key);

        processedBytes += plaintext.length;

        progress({
          phase: "encrypting",
          processedBytes,
          totalBytes,
          percent: Cryptoxis.#calculatePercent(processedBytes, totalBytes),
        });
      }
    } catch (error) {
      await Cryptoxis.#abortQuietly(encryptedWriter);
      await Cryptoxis.#abortQuietly(keyWriter);
      throw error;
    }
  }

  static async decrypt(file, keyFile, decryptedWriter, progress = () => {}) {
    if (file.size !== keyFile.size) {
      throw new Error("Wrong key length.");
    }

    let processedBytes = 0;
    let totalBytes = file.size;
    let chunkCount = Chunk.count(file);

    try {
      for (let index = 0; index < chunkCount; index++) {
        let ciphertext = await Chunk.read(file, index);
        let key = await Chunk.read(keyFile, index);
        let decrypted = Chunk.xor(ciphertext, key);

        await decryptedWriter.write(decrypted);

        processedBytes += ciphertext.length;

        progress({
          phase: "decrypting",
          processedBytes,
          totalBytes,
          percent: Cryptoxis.#calculatePercent(processedBytes, totalBytes),
        });
      }
    } catch (error) {
      await Cryptoxis.#abortQuietly(decryptedWriter);
      throw error;
    }
  }

  static #calculatePercent(processedBytes, totalBytes) {
    return totalBytes === 0 ? 100 : (processedBytes / totalBytes) * 100;
  }

  static async #abortQuietly(writer) {
    try {
      await writer.abort();
    } catch {}
  }
}

export class Chunk {
  static size = 1024 * 1024;

  static count(file) {
    return Math.ceil(file.size / Chunk.size);
  }

  static async read(file, index) {
    let start = index * Chunk.size;
    let end = Math.min(start + Chunk.size, file.size);
    let blob = file.slice(start, end);
    let buffer = await blob.arrayBuffer();

    return new Uint8Array(buffer);
  }

  static xor(left, right) {
    if (left.length !== right.length) {
      throw new Error("Wrong chunk length.");
    }

    let output = new Uint8Array(left.length);

    for (let index = 0; index < left.length; index++) {
      output[index] = left[index] ^ right[index];
    }

    return output;
  }
}

export class Key {
  static create(length) {
    if (!Number.isInteger(length)) {
      throw new TypeError("Length must be an integer.");
    }

    if (length < 0) {
      throw new RangeError("Length must not be negative.");
    }

    let key = new Uint8Array(length);

    for (let offset = 0; offset < key.length; offset += 65536) {
      crypto.getRandomValues(key.subarray(offset, offset + 65536));
    }

    return key;
  }
}

export class FileStream {
  static async createWriter(filename) {
    if (!window.isSecureContext) {
      throw new Error(
        "File streaming requires a secure context. Use HTTPS or localhost.",
      );
    }

    if (!window.showSaveFilePicker) {
      throw new Error(
        "File streaming is not supported in this browser. Use Chrome or Edge.",
      );
    }

    let fileHandle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: "Binary file",
          accept: {
            "application/octet-stream": [".bin", ".encrypted", ".key"],
          },
        },
      ],
    });

    return fileHandle.createWritable();
  }
}
