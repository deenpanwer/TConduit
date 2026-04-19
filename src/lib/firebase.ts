import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

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

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

// Initialize Firestore with persistent local cache
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export { auth, db, storage, rtdb };
