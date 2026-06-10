import { PRICING } from '../config/constants';

/**
 * Public facing services available for all users.
 */
export const publicServices = [
    { id: 'register_org', title: 'ลงทะเบียนองค์กรใหม่', desc: 'ลงทะเบียนเพื่อสร้าง Gang หรือ Family อย่างเป็นทางการ', icon: 'ph-buildings' },
    { id: 'ps1', title: 'ระบบให้บริการทั่วไป', desc: 'บริการยื่นคำร้องทั่วไปสำหรับประชาชน', icon: 'ph-users' },
    { id: 'welfare', title: 'ระบบเบิกสวัสดิการ', desc: 'ลงทะเบียนขอรับสวัสดิการจากสภา', icon: 'ph-gift' },
    { id: 'welfare_trade', title: 'ระบบเทรดสวัสดิการ', desc: 'บริการแลกเปลี่ยนและจัดการสวัสดิการขององค์กร', icon: 'ph-arrows-left-right' },
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
    { id: 'cs4', title: 'ระบบจัดการ GANG/FAMILY', desc: 'จัดการข้อมูลพื้นฐาน รายชื่อสมาชิก ของแก๊ง/แฟมิลี่ในเมือง', icon: 'ph-address-book' },
    { id: 'admin/transactions', title: 'ประวัติการทำรายการ (Logs)', desc: 'ดูประวัติการทำธุรกรรมและบริการทั้งหมดที่ถูกบันทึกไว้ในฐานข้อมูล', icon: 'ph-database' },
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
    { id: 1, name: `เพิ่มรายชื่อสมาชิก (${PRICING.ORG_ADD_MEMBER.toLocaleString()} /คน)`, type: 'per_head', price: PRICING.ORG_ADD_MEMBER },
    { id: 2, name: `ถอนรายชื่อสมาชิก - ปกติ (${PRICING.ORG_REMOVE_MEMBER_NORMAL.toLocaleString()} /คน)`, type: 'per_head', price: PRICING.ORG_REMOVE_MEMBER_NORMAL },
    { id: 3, name: `ถอนรายชื่อสมาชิก - ถอนลอย (${PRICING.ORG_REMOVE_MEMBER_FLOATING.toLocaleString()} /คน)`, type: 'per_head', price: PRICING.ORG_REMOVE_MEMBER_FLOATING },
    { id: 4, name: `ถอนรายชื่อสมาชิก - ยืนยันตนเอง (${PRICING.ORG_REMOVE_MEMBER_SELF.toLocaleString()} /ครั้ง)`, type: 'flat', price: PRICING.ORG_REMOVE_MEMBER_SELF },
    { id: 5, name: `ยุบแก๊ง/ครอบครัว (${PRICING.ORG_DISBAND.toLocaleString()})`, type: 'flat', price: PRICING.ORG_DISBAND },
    { id: 6, name: `บริการเพิ่ม SLOT แก๊งเป็น 25 คน (${PRICING.ORG_ADD_SLOT.toLocaleString()})`, type: 'flat', price: PRICING.ORG_ADD_SLOT },
    { id: 7, name: 'แก้ไขตำแหน่ง (FREE)', type: 'flat', price: PRICING.ORG_EDIT_POSITION }
];

export const councilList = [
    "1. NewGlaywind",
    "2. Miaa Nakhrach",
    "3. LEX SER",
    "16. Ennado Perfectboy"
];
