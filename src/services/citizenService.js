import { db } from '../core/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

export const ensureCitizenExists = async (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return;
  const trimmedName = name.trim();
  
  try {
    const q = query(collection(db, 'citizens'), where('name', '==', trimmedName));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await addDoc(collection(db, 'citizens'), {
        name: trimmedName,
        createdAt: Timestamp.now()
      });
    }
  } catch (err) {
    console.error("Failed to ensure citizen exists:", err);
  }
};
