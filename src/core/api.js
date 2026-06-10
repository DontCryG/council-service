const API_BASE_URL = '/api';

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
