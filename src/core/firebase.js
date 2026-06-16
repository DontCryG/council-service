import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDz1VFwr66FaEdcBRrvcg4VO6LLbNn2lCc",
  authDomain: "council-service-dd3a4.firebaseapp.com",
  projectId: "council-service-dd3a4",
  storageBucket: "council-service-dd3a4.firebasestorage.app",
  messagingSenderId: "640229308786",
  appId: "1:640229308786:web:04e76e31d7b623fe2005eb",
  measurementId: "G-KYKCJ1TD1F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable offline persistence using the modern API (Firebase v9/v10+)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

