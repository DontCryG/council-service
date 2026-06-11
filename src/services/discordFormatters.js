/**
 * Discord Webhook Formatter Service
 * Provides helper functions to build consistent Discord webhook messages.
 */

/**
 * Builds an embedded Discord message for Welfare Trades
 * @param {Object} data - The form data
 * @param {Array} items - The items array
 * @param {string} totalPrice - The calculated total price
 * @param {string} userDiscordId - The user's Discord ID (from session/auth)
 * @returns {Object} Discord webhook payload
 */
export const buildWelfareTradeWebhook = (formData, items, totalPrice, councilName, refNumber) => {
  const isVehicle = formData.tradeType === 'VEHICLE';

  const itemList = items.length > 0 
    ? "```\n" + items.map(i => `${i.name} [${i.detail || '-'}]`).join('\n') + "\n```"
    : "```\nไม่มี\n```";

  if (isVehicle) {
    return {
      embeds: [{
        title: "🚗 แจ้งเตือนธุรกรรมการเทรดรถสวัสดิการ",
        color: 0xfacc15,
        fields: [
          { name: "🏢 สังกัด", value: formData.orgName || '-', inline: true },
          { name: "👤 ผู้ถือรถ (เดิม)", value: formData.oldOwner || '-', inline: true },
          { name: "👤 ผู้รับรถ (ใหม่)", value: formData.newOwner || '-', inline: true },
          { name: "👮 เจ้าหน้าที่ผู้รับเรื่อง", value: councilName || '-', inline: false },
          { name: "🚙 รายการรถที่เทรด", value: itemList, inline: false },
          { name: "💰 ค่าบริการรวม", value: `**${totalPrice} $**`, inline: false },
        ],
        image: {
          url: "attachment://trade.png"
        },
        footer: { text: `Ref: ${refNumber || '-'} | Server System` },
        timestamp: new Date().toISOString()
      }]
    };
  } else {
    // Weapon
    const pricingStr = formData.pricingType ? formData.pricingType.split(' ')[0] : '-';
    return {
      embeds: [{
        title: "⚔️ แจ้งเตือนธุรกรรมการเทรดอาวุธสวัสดิการ",
        color: 0xef4444,
        fields: [
          { name: "📋 รูปแบบการออก", value: pricingStr, inline: true },
          { name: "🏢 สังกัด", value: formData.orgName || '-', inline: true },
          { name: "👤 ผู้ส่งมอบ (เดิม)", value: formData.oldOwner || '-', inline: true },
          { name: "👤 ผู้รับมอบ (ใหม่)", value: formData.newOwner || '-', inline: true },
          { name: "👮 เจ้าหน้าที่ผู้รับเรื่อง", value: councilName || '-', inline: false },
          { name: "🔫 รายการอาวุธ", value: itemList, inline: false },
          { name: "💰 ค่าบริการรวม", value: `**${totalPrice} $**`, inline: false },
        ],
        image: {
          url: "attachment://trade.png"
        },
        footer: { text: `Ref: ${refNumber || '-'} | Server System` },
        timestamp: new Date().toISOString()
      }]
    };
  }
};
