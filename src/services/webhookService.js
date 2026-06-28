const API_BASE_URL = '/api';

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
