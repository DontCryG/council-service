const API_BASE_URL = '/api';

import { db } from './firebase';
import { collection, addDoc, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';

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
    await addDoc(collection(db, 'transaction_logs'), logData);
  } catch (err) {
    console.error("Failed to save transaction log:", err);
    // Don't throw to prevent breaking the main flow
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
