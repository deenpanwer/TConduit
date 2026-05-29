const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value.replace(/\\n/g, '\n');
  }
});

const serviceAccount = {
  projectId: env.FIREBASE_PROJECT_ID,
  clientEmail: env.FIREBASE_CLIENT_EMAIL,
  privateKey: env.FIREBASE_PRIVATE_KEY
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  try {
    const orgId = "org_2hqmjmdrv";
    console.log(`Checking all group chats under organizations/${orgId}/group_chats...`);
    const groupChatsSnap = await db.collection(`organizations/${orgId}/group_chats`).get();
    console.log("Total groups:", groupChatsSnap.size);
    groupChatsSnap.forEach(doc => {
      console.log("Group ID:", doc.id, "Data:", JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
