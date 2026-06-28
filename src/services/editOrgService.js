import { saveTransactionLog, saveTransactionImage, ensureCitizenExists } from '../core/api';

const calculateTotal = (formData) => {
  let total = 0;
  if (formData.changeInfo) total += 500000;
  if (formData.editTexture) total += (500000 * Math.max(1, formData.textureCount));
  if (formData.addCloth) total += (500000 * Math.max(1, formData.textureCount));
  if (formData.bulkChange) total += 1500000;
  if (formData.addAccessory) total += 1000000;
  return total;
};

export async function submitEditOrg(dataUrl, formData, councilMembers, refNumber, user) {
  if (!dataUrl) throw new Error("Image data URL is required");
  
  let transactionItems = [];
  if (formData.changeInfo) transactionItems.push("- เปลี่ยนข้อมูล Gang (500,000$)");
  if (formData.editTexture) transactionItems.push(`- แก้ไข Texture เสื้อผ้า (${(500000 * Math.max(1, formData.textureCount)).toLocaleString()}$)`);
  if (formData.addCloth) transactionItems.push(`- ลงชุดเพิ่ม (${(500000 * Math.max(1, formData.textureCount)).toLocaleString()}$)`);
  if (formData.bulkChange) transactionItems.push("- เหมาเปลี่ยนข้อมูล Gang (1,500,000$)");
  if (formData.addAccessory) transactionItems.push("- ลง Accessories Adons เสริม (1,000,000$)");

  const transactionText = transactionItems.length > 0 ? `\`\`\`\n${transactionItems.join('\n')}\n\`\`\`` : "```\nไม่มี\n```";

  let additionalInfo = `**สี (HEX):** ${formData.hexColor || '-'}`;
  if (formData.extraDetails) {
    additionalInfo += `\n\n**รายละเอียด:**\n${formData.extraDetails}`;
  }

  const orgTypeDisplay = formData.orgType === 'GANG' ? 'แก๊ง' : (formData.orgType === 'FAMILY' ? 'ครอบครัว' : formData.orgType);
  const councilStaffName = councilMembers?.find(c => c.id === formData.councilStaffId)?.name || '-';
  const totalAmount = calculateTotal(formData);

  const webhookPayload = {
    embeds: [{
      title: "📜 Council Service Log",
      description: "**ได้รับคำร้องขออัปเดตข้อมูลสังกัดใหม่**",
      color: 0xf59e0b,
      thumbnail: formData.logoUrl ? { url: formData.logoUrl } : undefined,
      fields: [
        { name: "ประเภท", value: orgTypeDisplay, inline: true },
        { name: "ชื่อสังกัด", value: formData.orgName, inline: true },
        { name: "ผู้ทำรายการ", value: formData.requester, inline: false },
        { name: "รายการธุรกรรมที่ทำ", value: transactionText, inline: false },
        { name: "ยอดรวมสุทธิ", value: `**${totalAmount.toLocaleString()} $**`, inline: true },
        { name: "เจ้าหน้าที่รับเรื่อง", value: councilStaffName, inline: true },
        { name: "ข้อมูลเพิ่มเติมที่แจ้ง", value: additionalInfo, inline: false },
      ],
      image: {
        url: "attachment://receipt.jpg"
      },
      footer: { text: `Ref: ${refNumber} | Server System` },
      timestamp: new Date().toISOString()
    }]
  };

  // Auto-save citizen if they don't exist
  await ensureCitizenExists(formData.requester);

  const logId = await saveTransactionLog('edit_org', {
    refNumber: refNumber,
    orgName: formData.orgName,
    orgType: formData.orgType,
    requester: formData.requester,
    councilStaffId: formData.councilStaffId,
    councilStaffName: councilStaffName,
    changeInfo: formData.changeInfo,
    editTexture: formData.editTexture,
    addCloth: formData.addCloth,
    bulkChange: formData.bulkChange,
    addAccessory: formData.addAccessory,
    textureCount: formData.textureCount,
    hexColor: formData.hexColor,
    logoUrl: formData.logoUrl,
    extraDetails: formData.extraDetails,
    totalAmount: totalAmount,
    webhookPayload: webhookPayload
  }, user);
  
  await saveTransactionImage(logId, dataUrl);
}
