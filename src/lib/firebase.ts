import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getDatabase, Database } from "firebase/database";

// TODO: Replace with your actual config from the Trac Dairy app
const firebaseConfig = {
  apiKey: "AIzaSyAfdF1ehCAkGOQOkPxQQftsk_GxUycYS5o",
  authDomain: "trac-dairy.firebaseapp.com",
  projectId: "trac-dairy",
  storageBucket: "trac-dairy.firebasestorage.app",
  messagingSenderId: "278674911210",
  appId: "1:278674911210:web:944919a021c402bd1a8c93",
  measurementId: "G-0VED36Q4LK",
  databaseURL: "https://trac-dairy-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let rtdb: Database;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
  rtdb = getDatabase(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} else {
  app = getApp();
  auth = getAuth(app);
  storage = getStorage(app);
  rtdb = getDatabase(app);
  db = getFirestore(app);
}

export { auth, db, storage, rtdb };
