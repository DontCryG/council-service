import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

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
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable persistence');
  }
});
