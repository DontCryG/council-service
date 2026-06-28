import { saveTransactionLog, saveTransactionImage, ensureCitizenExists } from '../core/api';

/**
 * Handles the business logic for registering a new organization
 */
export async function submitRegisterOrg(dataUrl, formData, coLeaders, members, councilMembers, refNumber, user) {
  if (!dataUrl) throw new Error("Image data URL is required");

  const typeDisplay = formData.orgType === 'GANG' ? 'แก๊ง' : 'ครอบครัว';
  const councilName = councilMembers?.find(c => c.id === formData.councilStaffId)?.name || '-';

  const coLeaderText = coLeaders?.length > 0 ? `**รองหัวหน้า:** ${coLeaders.map(c => c.name).join(', ')}` : '';
  const memberText = members?.length > 0 ? `**สมาชิกเริ่มต้น:**\n${members.map(m => m.name).join('\n')}` : '';
  const membersFullText = [
    `**หัวหน้า:** ${formData.leader}`,
    coLeaderText,
    memberText
  ].filter(Boolean).join('\n');

  const webhookPayload = {
    embeds: [{
      title: "Council Service Log",
      description: "Organization registration submitted",
      color: 0xf59e0b,
      thumbnail: formData.logo ? { url: formData.logo } : undefined,
      fields: [
        { name: "Type", value: typeDisplay, inline: true },
        { name: "Group", value: formData.alias ? `[${formData.alias}] ${formData.name || '-'}` : (formData.name || '-'), inline: true },
        { name: "Theme Color", value: formData.color || '-', inline: true },
        { name: "Transaction", value: "ขึ้นทะเบียนสังกัดใหม่", inline: false },
        { name: "Members", value: membersFullText || '-', inline: false },
        { name: "Council", value: councilName, inline: false }
      ],
      image: {
        url: "attachment://receipt.jpg"
      },
      footer: { text: `Ref: ${refNumber} | Server System` },
      timestamp: new Date().toISOString()
    }]
  };

  // Auto-save citizen if they don't exist
  await ensureCitizenExists(formData.leader);

  const logId = await saveTransactionLog('register_org', {
    refNumber: refNumber,
    orgType: formData.orgType,
    name: formData.name,
    alias: formData.alias,
    color: formData.color,
    leader: formData.leader,
    logo: formData.logo,
    coLeaders: coLeaders?.map(c => c.name) || [],
    members: members?.map(m => m.name) || [],
    councilStaffId: formData.councilStaffId,
    councilStaffName: councilName,
    totalAmount: 200000,
    webhookPayload: webhookPayload
  }, user);
  
  await saveTransactionImage(logId, dataUrl);
}
