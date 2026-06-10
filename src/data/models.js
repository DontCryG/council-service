import { PRICING } from '../config/constants';

/**
 * Public facing services available for all users.
 */
export const publicServices = [
    { id: 'register_org', title: 'ลงทะเบียนองค์กรใหม่', desc: 'ลงทะเบียนเพื่อสร้าง Gang หรือ Family อย่างเป็นทางการ', icon: 'ph-buildings' },
    { id: 'ps1', title: 'ระบบให้บริการทั่วไป', desc: 'บริการยื่นคำร้องทั่วไปสำหรับประชาชน', icon: 'ph-users' },
    { id: 'welfare', title: 'ระบบเบิกสวัสดิการ', desc: 'ทำเรื่องขอเบิกสวัสดิการแก๊ง/แฟมิลี่ประจำสัปดาห์', icon: 'ph-gift' },
    { id: 'welfare_trade', title: 'ระบบแลกสวัสดิการ', desc: 'สวัสดิการที่ได้สามารถนำมาแลกเปลี่ยนเป็นของอื่นๆได้', icon: 'ph-arrows-left-right' },
    { id: 'ps5', title: 'ระบบเบิก TICKET', desc: 'สำหรับประชาชนเพื่อนำไปซื้อของที่ไม่มีขายในประเทศ', icon: 'ph-ticket' },
    { id: 'edit_org', title: 'แก้ไขข้อมูลองค์กร', desc: 'แก้ไขข้อมูลการย้ายหรือตั้งชื่อแก๊ง', icon: 'ph-pencil-simple' },
    { id: 'cs5', title: 'STORY CALENDAR', desc: 'ประวัติและปฏิทินเดินสตอรี่ของการจองทั้งหมด', icon: 'ph-calendar-check' },
];

/**
 * Services restricted to council members (logged in users).
 */
export const councilServices = [
    { id: 'council_manage', title: 'ระบบจัดการรายชื่อ', desc: 'จัดการข้อมูลของสมาชิกสภา เพื่อนำไปใช้คำนวณการเข้าร่วมและอื่นๆ', icon: 'ph-user-gear' },
    { id: 'cs6', title: 'ระบบเข้าเวรสภา', desc: 'จัดการการเข้าเวร ทำงาน ของสมาชิกสภา เพื่อนำไปคิดคะแนนการทำงาน', icon: 'ph-clock' },
    { id: 'cs3', title: 'ระบบจัดการเงิน Ticket', desc: 'จัดการงบประมาณ การเก็บเงินค่า Ticket ของประชาชน', icon: 'ph-currency-circle-dollar' },
    { id: 'cs4', title: 'ระบบจัดการ GANG/FAMILY', desc: 'จัดการข้อมูลส่วนกลาง หรือการยุบ Gang/Family ในประเทศ', icon: 'ph-address-book' },
];

/**
 * Related external websites.
 */
export const relatedWebsites = [
    { id: 'rw1', title: 'กฎหน่วยงานสภา', desc: 'อ่านกฎกติกาและกฎหมายบ้านเมือง', icon: 'ph-book-open', url: 'https://sites.google.com/view/wiptown/council?authuser=0' }
];

/**
 * Transaction pricing models used in EditOrg.
 */
export const transactions = [
    { id: 1, name: `เปลี่ยนชื่อแก๊ง / แฟมิลี่ (${PRICING.ORG_RENAME_PER_HEAD.toLocaleString()} / คน)`, type: 'per_head', price: PRICING.ORG_RENAME_PER_HEAD },
    { id: 2, name: `โอนย้ายแก๊ง / แฟมิลี่ - ปกติ (${PRICING.ORG_TRANSFER_NORMAL.toLocaleString()} / คน)`, type: 'per_head', price: PRICING.ORG_TRANSFER_NORMAL },
    { id: 3, name: `โอนย้ายแก๊ง / แฟมิลี่ - โดนเตะ (${PRICING.ORG_TRANSFER_KICKED.toLocaleString()} / คน)`, type: 'per_head', price: PRICING.ORG_TRANSFER_KICKED },
    { id: 4, name: `โอนย้ายแก๊ง / แฟมิลี่ - ผิดกฎประเทศ (${PRICING.ORG_TRANSFER_RULEBREAK.toLocaleString()} / ครั้ง)`, type: 'flat', price: PRICING.ORG_TRANSFER_RULEBREAK },
    { id: 5, name: `ยุบ Gang / Family (${PRICING.ORG_DISBAND.toLocaleString()})`, type: 'flat', price: PRICING.ORG_DISBAND },
    { id: 6, name: 'เปลี่ยนแก๊งทำผิดกฎ (FREE)', type: 'flat', price: PRICING.ORG_TRANSFER_FREE }
];

export const councilList = [
    "1. NewGlaywind",
    "2. Miaa Nakhrach",
    "3. LEX SER",
    "16. Ennado Perfectboy"
];
