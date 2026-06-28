import { saveTransactionLog, saveTransactionImage, ensureCitizenExists } from '../core/api';

/**
 * Handles the complete business logic for submitting a General Service request
 * @param {string} dataUrl - The captured receipt image as data URL (JPEG/PNG)
 * @param {Object} formData - The form data object
 * @param {Array} members - The list of members
 * @param {Array} councilMembers - The list of council members (for looking up name)
 * @param {Object} selectedTransaction - The matched transaction object from models
 * @param {string} refNumber - The generated reference number
 * @param {Object} user - The current logged in user (if any)
 * @returns {Promise<void>}
 */
export async function submitGeneralService(dataUrl, formData, members, councilMembers, selectedTransaction, refNumber, user) {
  if (!dataUrl) throw new Error("Image data URL is required");

  // 1. Format Display Texts
  const typeDisplay = formData.groupType === 'GANG' ? 'แก๊ง' : 'ครอบครัว';
  const councilName = councilMembers?.find(c => c.id === formData.councilMemberId)?.name || '-';
  const membersText = members?.map(m => m.value).join('\n') || '';

  // 2. Construct Webhook Payload
  const webhookPayload = {
    embeds: [{
      title: "Council Service Log",
      description: "Service request submitted",
      color: 0xf59e0b,
      fields: [
        { name: "Type", value: typeDisplay, inline: true },
        { name: "Group", value: formData.groupName || '-', inline: true },
        { name: "Requester", value: formData.requester || '-', inline: false },
        { name: "Transaction", value: selectedTransaction?.name || '-', inline: false },
        { name: "Members", value: `\`\`\`\n${membersText || '-'}\n\`\`\``, inline: false },
        { name: "Council", value: councilName, inline: false }
      ],
      image: {
        url: "attachment://receipt.jpg"
      },
      footer: { text: `Ref: ${refNumber} | Server System` },
      timestamp: new Date().toISOString()
    }]
  };

  // 3. Ensure citizen exists
  await ensureCitizenExists(formData.requester);

  // 4. Save Transaction Log
  const logId = await saveTransactionLog('general_service', {
    refNumber: refNumber,
    orgType: formData.groupType,
    groupName: formData.groupName,
    requester: formData.requester,
    transactionId: formData.transactionId,
    transactionName: selectedTransaction?.name || '-',
    councilMemberId: formData.councilMemberId,
    councilMemberName: councilName,
    members: members?.map(m => m.value) || [],
    webhookPayload: webhookPayload
  }, user);
  
  // 5. Save Transaction Image
  await saveTransactionImage(logId, dataUrl);
}
