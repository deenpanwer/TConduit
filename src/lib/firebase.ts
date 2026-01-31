import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual config from the Electron app
const firebaseConfig = {
  apiKey: "AIzaSyAfdF1ehCAkGOQOkPxQQftsk_GxUycYS5o",
  authDomain: "trac-dairy.firebaseapp.com",
  projectId: "trac-dairy",
  storageBucket: "trac-dairy.firebasestorage.app",
  messagingSenderId: "278674911210",
  appId: "1:278674911210:web:944919a021c402bd1a8c93",
  measurementId: "G-0VED36Q4LK"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
