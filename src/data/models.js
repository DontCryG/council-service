export const publicServices = [
    { id: 'register_org', title: 'ระบบรับรองแก๊ง/แฟมิลี่', desc: 'ลงทะเบียนเพื่อสร้าง Gang หรือ Family อย่างเป็นทางการ', icon: 'ph-buildings' },
    { id: 'ps1', title: 'ระบบสวัสดิการอาวุธ', desc: 'รับสิทธิ์เบิกสวัสดิการอาวุธ', icon: 'ph-users' },
    { id: 'welfare', title: 'ระบบเบิกสวัสดิการ', desc: 'ทำเรื่องขอเบิกสวัสดิการแก๊ง/แฟมิลี่ประจำสัปดาห์', icon: 'ph-gift' },
    { id: 'welfare_trade', title: 'ระบบแลกสวัสดิการ', desc: 'สวัสดิการที่ได้สามารถนำมาแลกเปลี่ยนเป็นของอื่นๆได้', icon: 'ph-arrows-left-right' },
    { id: 'ps5', title: 'ระบบเบิก TICKET', desc: 'สำหรับประชาชนเพื่อนำไปซื้อของที่ไม่มีขายในประเทศ', icon: 'ph-ticket' },
    { id: 'edit_org', title: 'เปลี่ยนชื่อ/ย้ายแก๊ง', desc: 'แก้ไขข้อมูลการย้ายหรือตั้งชื่อแก๊ง', icon: 'ph-pencil-simple' },
    { id: 'cs5', title: 'STORY CALENDAR', desc: 'ประวัติและปฏิทินเดินสตอรี่ของการจองทั้งหมด', icon: 'ph-calendar-check' },
];

export const councilServices = [
    { id: 'council_manage', title: 'ระบบจัดการรายชื่อ', desc: 'จัดการข้อมูลของสมาชิกสภา เพื่อนำไปใช้คำนวณการเข้าร่วมและอื่นๆ', icon: 'ph-user-gear' },
    { id: 'cs6', title: 'ระบบเข้าเวรสภา', desc: 'จัดการการเข้าเวร ทำงาน ของสมาชิกสภา เพื่อนำไปคิดคะแนนการทำงาน', icon: 'ph-clock' },
    { id: 'cs3', title: 'ระบบจัดการเงิน Ticket', desc: 'จัดการงบประมาณ การเก็บเงินค่า Ticket ของประชาชน', icon: 'ph-currency-circle-dollar' },
    { id: 'cs4', title: 'ระบบจัดการแก๊ง/แฟม', desc: 'จัดการข้อมูลส่วนกลาง หรือการยุบ Gang/Family ในประเทศ', icon: 'ph-address-book' },
];

export const relatedWebsites = [
    { id: 'rw1', title: 'กฎหมายประเทศ', desc: 'อ่านกฎกติกาและกฎหมายบ้านเมือง', icon: 'ph-book-open', url: 'https://sites.google.com/view/wiptown/council?authuser=0' }
];

export const transactions = [
    { id: 1, name: 'เปลี่ยนชื่อแก๊ง / แฟมิลี่ (100,000 / คน)', type: 'per_head', price: 100000 },
    { id: 2, name: 'โอนย้ายแก๊ง / แฟมิลี่ - ปกติ (100,000 / คน)', type: 'per_head', price: 100000 },
    { id: 3, name: 'โอนย้ายแก๊ง / แฟมิลี่ - โดนเตะ (250,000 / คน)', type: 'per_head', price: 250000 },
    { id: 4, name: 'โอนย้ายแก๊ง / แฟมิลี่ - ผิดกฎประเทศ (300,000 / ครั้ง)', type: 'flat', price: 300000 },
    { id: 5, name: 'ยุบ Gang / Family (1,000,000)', type: 'flat', price: 1000000 },
    { id: 6, name: 'เปลี่ยนแก๊งทำผิดกฎ (FREE)', type: 'flat', price: 0 }
];

export const councilList = [
    "1. NewGlaywind",
    "2. Miaa Nakhrach",
    "3. LEX SER",
    "16. Ennado Perfectboy"
];
