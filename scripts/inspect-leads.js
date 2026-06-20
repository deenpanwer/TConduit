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
    console.log(`Checking config...`);
    const configSnap = await db.doc(`organizations/${orgId}/crm_config/main`).get();
    if (configSnap.exists()) {
      console.log("Config:", JSON.stringify(configSnap.data().modules.leads, null, 2));
    } else {
      console.log("No config found");
    }

    console.log(`Checking crm_entities of type lead...`);
    const snap = await db.collection(`organizations/${orgId}/crm_entities`)
      .where("type", "==", "lead")
      .where("isDeleted", "==", false)
      .get();
    
    console.log(`Total leads: ${snap.size}`);
    
    const counts = {};
    snap.forEach(doc => {
      const data = doc.data();
      const rootStatus = data.status;
      const dataStatus = data.data ? data.data.status : undefined;
      const key = `root:${rootStatus} | data:${dataStatus}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    
    console.log("Counts:", JSON.stringify(counts, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
