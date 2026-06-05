# Cryptoxis

Cryptoxis is a browser-focused JavaScript library for chunked one-time-pad-style file encryption and decryption.

It generates a random key stream the same size as the input file, XORs it with the file bytes, and writes two outputs:

1. the encrypted file
2. the key file

Both are required for decryption.

## Features

- Chunked file encryption/decryption
- Works with large files
- Uses `crypto.getRandomValues`
- No external dependencies
- Progress callback support
- Writable-stream-based output

## Requirements

Cryptoxis targets modern browsers with support for:

- ES modules
- `File` / `Blob`
- `Uint8Array`
- `crypto.getRandomValues`
- writable streams

If using the included file writer helper, the browser must also support `window.showSaveFilePicker` and run on HTTPS or `localhost`.

## Usage

```javascript
import {Cryptoxis, FileStream} from "./Cryptoxis.js";
```

## Encrypt

```javascript
const encryptedWriter = await FileStream.createWriter(`${file.name}.encrypted`);
const keyWriter = await FileStream.createWriter(`${file.name}.key`);

await Cryptoxis.encrypt(file, encryptedWriter, keyWriter, ({percent}) => {
    console.log(`Encrypting: ${percent.toFixed(2)}%`);
});

await encryptedWriter.close();
await keyWriter.close();
```

## Decrypt

```javascript
const decryptedWriter = await FileStream.createWriter("decrypted-file");

await Cryptoxis.decrypt(
    encryptedFile,
    keyFile,
    decryptedWriter,
    ({percent}) => {
        console.log(`Decrypting: ${percent.toFixed(2)}%`);
    },
);

await decryptedWriter.close();
```

## API

### `Cryptoxis.encrypt(file, encryptedWriter, keyWriter, progress)`

Encrypts `file`, writes encrypted bytes to `encryptedWriter`, and writes the generated key bytes to `keyWriter`.

### `Cryptoxis.decrypt(file, keyFile, decryptedWriter, progress)`

Decrypts `file` using `keyFile` and writes the result to `decryptedWriter`.

### Progress callback

```javascript
{
    phase: "encrypting",
    processedBytes: 1048576,
    totalBytes: 5242880,
    percent: 20
}
```

`phase` is either `"encrypting"` or `"decrypting"`.

## Security Notes

- Keep the key file secret.
- Never reuse a key file.
- Losing the key means losing the data.
- A wrong same-size key may produce corrupted output.
- Cryptoxis does not provide passwords, authentication, tamper detection, or key exchange.

Read `DISCLAIMER.md` before using Cryptoxis for sensitive data.
