import { sendWebhook, saveTransactionLog, ensureCitizenExists } from '../core/api';

/**
 * Handles the complete business logic for submitting a Welfare request
 * @param {Blob} blob - The captured screenshot blob
 * @param {Object} formData - The form data object
 * @param {Array} vehicles - The list of vehicles
 * @param {string} refNumber - The generated reference number
 * @param {Object} user - The current logged in user (if any)
 * @returns {Promise<void>}
 */
export async function submitWelfareForm(blob, formData, vehicles, refNumber, user) {
  if (!blob) throw new Error("Image blob is required");

  // 1. Format Welfare Items
  let welfareItems = [];
  if (formData.hasWeaponM9) welfareItems.push("อาวุธ: มีด M9");
  if (formData.hasWeaponHeavyRevolver) welfareItems.push("อาวุธ: ปืน Heavy Revolver Mk II");
  if (formData.hasWeaponPoolCue) welfareItems.push("อาวุธ: ไม้ Pool Cue");
  if (vehicles && vehicles.length > 0) {
    vehicles.forEach(v => welfareItems.push(`รถ: ${v.plate || '-'} (${v.model || '-'})`));
  }
  if (formData.otherWelfare) welfareItems.push(`อื่นๆ: ${formData.otherWelfare}`);
  
  const welfareListText = welfareItems.length > 0 ? "```\n" + welfareItems.join("\n") + "\n```" : "```\n- ไม่มีรายการ -\n```";

  // 2. Construct Discord Embed Payload
  const fd = new FormData();
  fd.append('file', blob, 'welfare.png');
  fd.append('payload_json', JSON.stringify({
    embeds: [{
      title: "📜 ตรวจพบการลงนามรับสวัสดิการใหม่",
      description: `**เลขที่อ้างอิง:** ${refNumber}`,
      color: 0xfacc15,
      fields: [
        { name: "🏢 สังกัด", value: formData.orgName || '-', inline: true },
        { name: "✍️ ผู้ลงนาม", value: formData.requester || '-', inline: true },
        { name: "🎁 รายการสวัสดิการ", value: welfareListText, inline: false },
      ],
      image: {
        url: "attachment://welfare.png"
      },
      footer: { text: `Ref: ${refNumber} | Server System` },
      timestamp: new Date().toISOString()
    }]
  }));

  // 3. Send Webhook
  await sendWebhook('welfare', fd);

  // 4. Ensure citizen exists
  await ensureCitizenExists(formData.requester);

  // 5. Save Transaction Log
  await saveTransactionLog('welfare', {
    refNumber: refNumber,
    orgType: formData.orgType,
    orgName: formData.orgName,
    requester: formData.requester,
    vehicles: vehicles,
    hasWeaponM9: formData.hasWeaponM9,
    hasWeaponHeavyRevolver: formData.hasWeaponHeavyRevolver,
    hasWeaponPoolCue: formData.hasWeaponPoolCue,
    otherWelfare: formData.otherWelfare
  }, user);
}
