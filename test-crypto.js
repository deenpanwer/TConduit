const crypto = require('crypto');

function verifyTelnyxWebhook(rawBody, signatureB64, timestamp, publicKeyB64) {
  const message = `${timestamp}|${rawBody}`;
  const signature = Buffer.from(signatureB64, 'base64');
  
  // Format the public key as a proper PEM or use the raw buffer with KeyObject
  const publicKeyObj = crypto.createPublicKey({
    key: Buffer.from(publicKeyB64, 'base64'),
    format: 'der',
    type: 'spki'
  });

  return crypto.verify(null, Buffer.from(message), publicKeyObj, signature);
}

try {
  verifyTelnyxWebhook('test', 'dummy=', '123', 'iBmIeY1DK8OcIbcChP2IvSbe2yFDD0GP14zGRCvv+Cs=');
  console.log('crypto code ran');
} catch (err) {
  console.log('Error:', err.message);
}
