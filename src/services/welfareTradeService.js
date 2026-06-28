import { saveTransactionLog, saveTransactionImage, ensureCitizenExists } from '../core/api';
import { buildWelfareTradeWebhook } from './discordFormatters';

const getTotalPrice = (formData, items) => {
  const count = items.length;
  if (formData.tradeType === 'VEHICLE') {
    return (300000 * count).toLocaleString();
  } else {
    if (formData.pricingType.includes('1.5M')) {
      return `${(1.5 * count).toFixed(1).replace('.0', '')}M`;
    } else if (formData.pricingType.includes('2.0M')) {
      return `${(2.0 * count).toFixed(1).replace('.0', '')}M`;
    }
  }
  return formData.pricingType;
};

export async function submitWelfareTrade(dataUrl, formData, items, councilMembers, refNumber, user) {
  if (!dataUrl) throw new Error("Image data URL is required");
  
  const councilName = councilMembers?.find(c => c.id === formData.councilStaffId)?.name;
  const totalPrice = getTotalPrice(formData, items);
  const payload = buildWelfareTradeWebhook(formData, items, totalPrice, councilName, refNumber);

  payload.embeds[0].image = { url: "attachment://receipt.jpg" };

  // Auto-save citizen if they don't exist
  await ensureCitizenExists(formData.requester);

  const logId = await saveTransactionLog('welfare_trade', {
    refNumber: refNumber,
    orgName: formData.orgName,
    orgType: formData.orgType,
    tradeType: formData.tradeType,
    oldOwner: formData.oldOwner,
    newOwner: formData.newOwner,
    items: items,
    totalPrice: totalPrice,
    councilStaffId: formData.councilStaffId,
    councilStaffName: councilName || '-',
    webhookPayload: payload
  }, user);
  
  await saveTransactionImage(logId, dataUrl);
}
