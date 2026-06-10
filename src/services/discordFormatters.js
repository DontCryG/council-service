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
export const buildWelfareTradeWebhook = (formData, items, totalPrice, councilName) => {
  return {
    embeds: [{
      title: "🔄 WELFARE TRADE RECEIPT",
      color: 0x8b5cf6, // Violet
      fields: [
        { name: "🏰 แก๊ง/แฟมิลี่", value: `${formData.orgName} (${formData.orgType})`, inline: true },
        { name: "📦 ประเภทสวัสดิการ", value: formData.tradeType === 'VEHICLE' ? 'ยานพาหนะ' : 'อาวุธ', inline: true },
        { name: "📤 ชื่อผู้ให้ (เก่า)", value: formData.oldOwner, inline: true },
        { name: "📥 ชื่อผู้รับ (ใหม่)", value: formData.newOwner, inline: true },
        { name: "🛡️ สภาที่รับเรื่อง", value: councilName || '-', inline: true },
        { name: "💰 เรทราคา", value: totalPrice, inline: true },
        { name: "📋 รายการของ", value: items.map(i => `${i.name} ${i.detail ? `(${i.detail})` : ''}`).join('\n'), inline: false },
      ],
      image: {
        url: "attachment://trade.png"
      },
      footer: { text: "Council Secretary System" },
      timestamp: new Date().toISOString()
    }]
  };
};
