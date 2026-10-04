const crypto = require('crypto');
try {
  console.log(crypto.randomUUID());
} catch(e) {
  console.error("crypto error:", e);
}
