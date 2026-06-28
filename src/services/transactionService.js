import { db } from '../core/firebase';
import { collection, addDoc, query, orderBy, where, getDocs, Timestamp, doc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';

/**
 * Recursively removes undefined fields from an object to prevent Firestore errors
 */
const sanitizeForFirestore = (obj) => {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (obj instanceof Date) return obj;
  if (obj && typeof obj.toDate === 'function') return obj; // Firestore Timestamp
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        result[key] = sanitizeForFirestore(obj[key]);
      }
    }
    return result;
  }
  return obj;
};

export const saveTransactionLog = async (type, data, user = null) => {
  try {
    const logData = {
      type,
      data: sanitizeForFirestore(data),
      createdAt: Timestamp.now(),
      createdBy: user ? { uid: user.uid, email: user.email } : null
    };
    const docRef = await addDoc(collection(db, 'transaction_logs'), logData);
    return docRef.id;
  } catch (err) {
    console.error("Failed to save transaction log:", err);
    throw err;
  }
};

export const getTransactionLogs = async () => {
  try {
    const q = query(collection(db, 'transaction_logs'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (err) {
    console.error("Failed to get transaction logs:", err);
    return [];
  }
};

export const listenTransactionLogs = (callback) => {
  const q = query(collection(db, 'transaction_logs'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
    callback(data);
  }, (err) => {
    console.error("Failed to listen to transaction logs:", err);
    callback([]);
  });
};

export const deleteTransactionLog = async (logId) => {
  try {
    await deleteDoc(doc(db, 'transaction_logs', logId));
  } catch (err) {
    console.error("Failed to delete transaction log:", err);
    throw err;
  }
};

export const updateTransactionLogStatus = async (logId, status, user) => {
  try {
    const logRef = doc(db, 'transaction_logs', logId);
    const updateData = {
      status,
      approvedBy: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
      approvedAt: Timestamp.now()
    };
    
    if (status === 'approved') {
      const { deleteField } = await import('firebase/firestore');
      updateData.webhookPayload = deleteField();
    }
    
    await updateDoc(logRef, updateData);
  } catch (err) {
    console.error("Failed to update transaction status:", err);
    throw err;
  }
};

export const saveTransactionImage = async (logId, base64Image) => {
  try {
    await addDoc(collection(db, 'transactionImages'), {
      logId,
      base64Image,
      createdAt: Timestamp.now()
    });
  } catch (err) {
    console.error("Failed to save transaction image:", err);
    throw err;
  }
};

export const getTransactionImage = async (logId) => {
  try {
    const q = query(collection(db, 'transactionImages'), where('logId', '==', logId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, base64Image: docSnap.data().base64Image };
    }
    return null;
  } catch (err) {
    console.error("Failed to get transaction image:", err);
    return null;
  }
};

export const deleteTransactionImage = async (imageDocId) => {
  try {
    if (imageDocId) {
      await deleteDoc(doc(db, 'transactionImages', imageDocId));
    }
  } catch (err) {
    console.error("Failed to delete transaction image:", err);
  }
};
