const API_BASE_URL = '/api';

import { db } from './firebase';
import { collection, addDoc, query, orderBy, getDocs, Timestamp, doc, updateDoc, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';

/**
 * Saves a transaction log to Firestore
 * @param {string} type - Transaction type (e.g., 'EditOrg', 'WelfareTrade')
 * @param {Object} data - The payload
 * @param {Object} [user] - The admin user performing the action (optional)
 */
export const saveTransactionLog = async (type, data, user = null) => {
  try {
    const logData = {
      type,
      data,
      createdAt: Timestamp.now(),
      createdBy: user ? { uid: user.uid, email: user.email } : null
    };
    const docRef = await addDoc(collection(db, 'transaction_logs'), logData);
    return docRef.id;
  } catch (err) {
    console.error("Failed to save transaction log:", err);
    alert('Save Log Error: ' + err.message);
    throw err;
  }
};

/**
 * Fetches transaction logs from Firestore
 * @returns {Promise<Array>} Array of log objects
 */
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

/**
 * Listens to transaction logs in real-time
 * @param {Function} callback - Function to call with updated data
 * @returns {Function} Unsubscribe function
 */
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

/**
 * Deletes a transaction log from Firestore
 * @param {string} logId - The ID of the log to delete
 */
export const deleteTransactionLog = async (logId) => {
  const { doc, deleteDoc } = await import('firebase/firestore');
  try {
    await deleteDoc(doc(db, 'transaction_logs', logId));
  } catch (err) {
    console.error("Failed to delete transaction log:", err);
    throw err;
  }
};

/**
 * Updates the status of a transaction log (e.g., for Approval)
 * @param {string} logId - The ID of the log
 * @param {string} status - New status ('pending' | 'approved')
 * @param {Object} user - The user approving it
 */
export const updateTransactionLogStatus = async (logId, status, user) => {
  try {
    const logRef = doc(db, 'transaction_logs', logId);
    await updateDoc(logRef, {
      status,
      approvedBy: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
      approvedAt: Timestamp.now()
    });
  } catch (err) {
    console.error("Failed to update transaction status:", err);
    throw err;
  }
};
/**
 * Sends a payload to the Discord webhook via the Cloudflare proxy.
 * @param {string} type - The webhook type (e.g., 'welfare_trade', 'general')
 * @param {FormData|Object} formData - The payload to send (FormData for files, Object for JSON)
 * @returns {Promise<boolean>} True if successful
 * @throws {Error} If the request fails
 */
export const sendWebhook = async (type, formData) => {
  const isFormData = formData instanceof FormData;
  
  const fetchOptions = {
    method: 'POST',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    body: isFormData ? formData : JSON.stringify(formData)
  };

  try {
    const response = await fetch(`${API_BASE_URL}/webhooks/${type}`, fetchOptions);
    if (!response.ok) {
      let err;
      try {
        err = await response.json();
      } catch (e) {
        throw new Error(`Endpoint /api/webhooks/${type} returned ${response.status}. (ถ้าเทสในเครื่องตอนรัน npm run dev จะพังเพราะไม่มี backend ทำงานอยู่ครับ ต้องเทสบนเว็บจริง)`);
      }
      throw new Error((err.error || 'Webhook failed') + (err.details ? ': ' + err.details : ''));
    }
    return true;
  } catch (err) {
    console.error("Webhook Error:", err);
    throw err;
  }
};

/**
 * Saves a base64 image string to Firestore in a separate collection
 */
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

/**
 * Retrieves a base64 image string from Firestore for a specific logId
 */
export const getTransactionImage = async (logId) => {
  try {
    const q = query(collection(db, 'transactionImages'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const doc = snapshot.docs.find(d => d.data().logId === logId);
    if (doc) {
      return { id: doc.id, base64Image: doc.data().base64Image };
    }
    return null;
  } catch (err) {
    console.error("Failed to get transaction image:", err);
    return null;
  }
};

/**
 * Deletes a transaction image document by its imageDocId
 */
export const deleteTransactionImage = async (imageDocId) => {
  try {
    if (imageDocId) {
      await deleteDoc(doc(db, 'transactionImages', imageDocId));
    }
  } catch (err) {
    console.error("Failed to delete transaction image:", err);
  }
};
