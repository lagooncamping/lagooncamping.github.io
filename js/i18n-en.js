// =========================================================
// คำแปลภาษาอังกฤษของทั้งเว็บ (โหลดเฉพาะตอนลูกค้ากดปุ่ม EN — ดู js/prefs.js)
// วิธีทำงาน: อ่านข้อความภาษาไทยบนหน้า แล้วเปลี่ยนเป็นคำแปลจากรายการ D ด้านล่าง
// - แก้ข้อความไทยในไฟล์ .html แล้ว ต้องมาแก้ "ฝั่งซ้าย" ของรายการ D ให้ตรงกันด้วย (ไม่งั้นจะเหลือภาษาไทย)
// - ราคา/เวลา/เบอร์โทร ในคำแปลต้องตรงกับฝั่งไทยทุกตัว (ชุดทดสอบ tests/i18n.test.js เช็กให้)
// - ข้อความที่ส่งเข้า LINE แอดมิน / Google Sheets ยังเป็นภาษาไทยเหมือนเดิม (แปลเฉพาะที่ลูกค้าเห็นบนจอ)
// =========================================================
(function () {
  // ---------- คำแปลแบบตรงตัว (ข้อความไทย → อังกฤษ) ----------
  const D = {
    // ===== เมนู / ท้ายเว็บ (ทุกหน้า) =====
    'ข้ามไปเนื้อหา': 'Skip to content',
    'เมนูหลัก': 'Main menu',
    'ที่พัก & ราคา': 'Prices',
    'บรรยากาศ': 'Gallery',
    'ข้อมูลเข้าพัก & FAQ': 'Info & FAQ',
    'ที่เที่ยวใกล้เคียง': 'Nearby',
    'ติดต่อ & เดินทาง': 'Contact',
    'จองที่พัก': 'Book now',
    'เมนู': 'Menu',
    'ลานกางเต็นท์และบ้านพักริมทะเลสาบ': 'Lakeside campground and cabins',
    'ต.ช้างข้าม อ.นายายอาม จ.จันทบุรี': 'Chang Kham, Na Yai Am, Chanthaburi',
    'เปิดให้บริการทุกวัน': 'Open every day',
    'เปิดใน Google Maps →': 'Open in Google Maps →',
    'ติดต่อจอง': 'Book & enquire',
    'ติดตาม': 'Follow us',
    'เช็กการจองของฉัน': 'My booking',
    '© The Lagoon Camping Resort · นายายอาม จันทบุรี': '© The Lagoon Camping Resort · Na Yai Am, Chanthaburi',
    'ธรรมชาติ + เพื่อน = ความสุข': 'Nature + friends = happiness',
    'โทร': 'Call',
    'ทักไลน์': 'LINE us',
    'โทร ทักไลน์ หรือจองที่พัก': 'Call, LINE us or book',
    'ทัก LINE @477nvamb เพื่อจองหรือสอบถาม': 'Message LINE @477nvamb to book or ask',
    'โทรจอง 081-930-4969': 'Call to book 081-930-4969',
    'โทร 081-930-4969': 'Call 081-930-4969',
    'คัดลอก': 'Copy',
    'คัดลอกแล้ว': 'Copied',
    'การจองรอชำระ': 'Booking awaiting payment',
    'ดู QR / ส่งสลิป': 'View QR / send slip',
    'ซ่อน': 'Hide',

    // ===== หน้าแรก =====
    'ลานกางเต็นท์ริมน้ำ & บ้านพัก นายายอาม จันทบุรี | The Lagoon': 'Lakeside camping & cabins in Na Yai Am, Chanthaburi | The Lagoon',
    'ลานกางเต็นท์ริมทะเลสาบ': 'Lakeside campground',
    'นายายอาม จันทบุรี': 'Na Yai Am, Chanthaburi',
    'ตื่นมาเจอ': 'Wake up to ',
    'ทะเลสาบ': 'the lake',
    'หน้าเต็นท์': 'outside your tent',
    'ลานกางเต็นท์และบ้านพักริมทะเลสาบ บรรยากาศดี วิวสวย พาเพื่อน พาครอบครัว และพาน้องหมาน้องแมวมาพักได้': 'A lakeside campground and cabins with a relaxed vibe and lovely views. Bring your friends, your family, and your dogs and cats too.',
    'ราคาเริ่มต้น': 'Starting prices',
    'ลานกางเต็นท์': 'Camping',
    'บาท / ท่าน': 'THB / person',
    'บ้านพักมีแอร์ เริ่ม': 'Air-con cabins from',
    'บาท / หลัง': 'THB / cabin',
    'โทรจอง': 'Call to book',
    'ดูราคา': 'See prices',
    'เปิดให้บริการทุกวัน · เช็กอิน 11:00 · เช็กเอาต์ 12:00': 'Open every day · Check-in 11:00 · Check-out 12:00',
    'มาพักกับเรา': 'Stay with us',
    'กิจกรรมและสิทธิพิเศษ': 'Activities & perks',
    'ตกปลา': 'Fishing',
    'ฟรีสำหรับผู้เข้าพัก': 'Free for guests',
    'ริมทะเลสาบ': 'by the lake',
    'หน้าที่พัก': 'right outside',
    'พายเรือแคนู': 'Canoeing',
    'ฟรีเฉพาะ': 'Free for ',
    'ลูกค้าบ้านพัก': 'cabin guests',
    'ลานกางเต็นท์ 100 บาท/ลำ/ชม.': 'Campers 100 THB/canoe/hr',
    'นั่งได้ 2 คน/ลำ': 'Seats 2 per canoe',
    'เสื้อชูชีพ': 'Life jackets',
    'มีทั้งไซซ์เด็กและผู้ใหญ่': 'Kids and adult sizes',
    'พาสัตว์เลี้ยง': 'Pets ',
    'มาได้': 'welcome',
    'ลานกางเต็นท์': 'Camping',
    'นอนบ้านพัก +100 บาท/หลัง/คืน': 'Cabins +100 THB/cabin/night',
    'พาน้องหมา': 'Bring your dog ',
    'น้องแมว': 'or cat ',
    'มาด้วยกันได้': 'along',
    'ราคาเป็นกันเอง': 'Friendly prices',
    'เลือกแบบที่ใช่': 'Pick what suits you',
    // หน้าแรก: บ้านพักแต่ละแบบ (16 พ.ย. 2569)
    'บ้านพักริมทะเลสาบ': 'Lakeside cabins',
    'บ้านพัก 6 หลัง มีแอร์ทุกหลัง': '6 cabins, all with air-con',
    'ปัดดูบ้านแต่ละแบบ →': 'Swipe to see each cabin →',
    'Lagoon 1–3': 'Lagoon 1–3',
    'มี 3 หลัง · 2 ท่าน · 1 เตียงใหญ่ · ห้องน้ำในตัว': '3 cabins · 2 guests · 1 large bed · private bathroom',
    'สไตล์โมเดิร์น · 2 ท่าน · 2 เตียง · ห้องน้ำในตัว': 'Modern style · 2 guests · 2 beds · private bathroom',
    '4 ท่าน · 1 ห้องนอน 2 เตียง · ห้องน้ำในตัว': '4 guests · 1 bedroom, 2 beds · private bathroom',
    '4 ท่าน · 2 ห้องนอน · 2 ห้องน้ำ · มีครัว': '4 guests · 2 bedrooms · 2 bathrooms · kitchen',
    'บาท/คืน': 'THB/night',
    'ดูรูปทุกหลังและเช็กวันว่าง →': 'See all photos and check dates →',
    // ข้อความจากรอบปรับเว็บ 1 พ.ย. 2569
    'ค่าใช้จ่ายเพิ่ม · ของให้เช่า · ของฟรี': 'Extra charges · rentals · free items',
    'เลื่อนวัน และการคืนเงิน': 'Changing dates and refunds',
    'เลื่อนวัน ยกเลิก และการคืนเงิน': 'Changing dates, cancelling and refunds',
    'ถ้าจ่ายมัดจำไว้ ส่วนที่เหลือจ่ายวันเช็กอิน': 'If you paid a deposit, pay the rest on check-in day',
    'จองหรือสอบถาม': 'Book or ask',
    'ทัก LINE @477nvamb': 'Message LINE @477nvamb',
    'เบอร์โทรทั้งหมด': 'All phone numbers',
    'ดูรูปและรายละเอียดบ้านทีละหลัง': 'See photos and details of each cabin',
    'พาสัตว์เลี้ยงมากางเต็นท์ฟรี': 'Pets camp free',
    'นำเต็นท์มาเอง · หรือเช่าเต็นท์ หลังเล็ก 1,000 / หลังใหญ่ 1,300 บาท (นอน 2 ท่าน)': 'Bring your own tent · or rent one: small 1,000 / large 1,300 THB (sleeps 2)',
    'มีแอร์ทุกหลัง': 'Air-con in every cabin',
    'บ้านพัก': 'Cabins',
    'เริ่ม': 'From',
    'มีหลายแบบ ทั้งสำหรับ 2 ท่าน และครอบครัว 4 ท่าน': 'Several types, for 2 guests or families of 4',
    'จองลานกางเต็นท์': 'Book camping',
    'ดูราคาทั้งหมด': 'See all prices',
    'ก่อนมาพัก ดูอะไรก่อนดี': 'Before you come',
    'เช้าริมน้ำ เย็นดูพระอาทิตย์ตก': 'Lakeside mornings, sunset evenings',
    'สิ่งอำนวยความสะดวก': 'Facilities',
    'บ้านพัก: แอร์ น้ำอุ่น Wi‑Fi': 'Cabins: air-con, hot water, Wi‑Fi',
    'ลานเต็นท์: ปลั๊กไฟ ห้องน้ำ': 'Campground: power points, restrooms',
    'ชาย–หญิง': ' (men’s & women’s)',
    'ข้อมูลการเข้าพัก': 'Guest info',
    'เช็กอิน 11:00 · เช็กเอาต์ 12:00': 'Check-in 11:00 · Check-out 12:00',
    'ติดต่อ & แผนที่': 'Contact & map',
    'โทร 081-930-4969 · LINE @477nvamb': 'Call 081-930-4969 · LINE @477nvamb',
    'เที่ยวใกล้ที่พัก': 'Nearby trips',
    'พักริมทะเลสาบ แวะเที่ยวทะเล': 'Stay by the lake, visit the sea',
    'แหลมแม่นกแก้ว': 'Laem Mae Nok Kaeo',
    'ประมาณ 8 กม. · ~13 นาที': 'About 8 km · ~13 min',
    'หาดคุ้งวิมาน + เนินนางพญา': 'Khung Wiman Beach + Noen Nang Phaya',
    'ประมาณ 22 กม. · ~28 นาที': 'About 22 km · ~28 min',
    'หาดเจ้าหลาว': 'Chao Lao Beach',
    'ประมาณ 33 กม. · ~41 นาที': 'About 33 km · ~41 min',
    'ดูที่เที่ยวทั้งหมด →': 'See all places →',
    'ลานกางเต็นท์ริมทะเลสาบ เต็นท์กระโจมสีขาว': 'Lakeside campground with white bell tents',
    'บ้านพักไม้หลายหลังบนสนามหญ้ากลางสวน': 'Wooden cabins on a lawn among the trees',
    'เต็นท์เปิดไฟใต้ต้นไม้ริมทะเลสาบยามพลบค่ำ': 'Lit-up tents under lakeside trees at dusk',
    'ระเบียงบ้านพักไม้มองเห็นสนามหญ้าและทะเลสาบ': 'Wooden cabin veranda overlooking the lawn and lake',
    'สนามหญ้าเขียวใต้ร่มไม้ใหญ่ริมทะเลสาบ': 'Green lawn under big shade trees by the lake',
    'ทะเลสาบน้ำสีฟ้าใส ม้านั่งใต้ร่มไม้': 'Clear blue lake with a bench in the shade',

    // ===== บรรยากาศ =====
    'รูปบรรยากาศลานกางเต็นท์ริมทะเลสาบ จันทบุรี | The Lagoon': 'Photos of our lakeside campground in Chanthaburi | The Lagoon',
    'บรรยากาศจริง': 'Real photos',
    'แคมป์ยามพลบค่ำ': 'Camp at dusk',
    'เต็นท์ประดับไฟ': 'Tent with fairy lights',
    'พายเรือรับแดดเย็น': 'Paddling in the evening sun',
    'เช้าริมทะเลสาบ': 'Morning by the lake',
    'ชิงช้าหน้าบ้านพัก': 'Swing outside the cabins',
    'สนามหญ้าริมน้ำ': 'Lakeside lawn',
    'ทะเลสาบสะท้อนฟ้า': 'Sky reflected in the lake',
    'ลานเต็นท์ริมทะเลสาบ': 'Lakeside campground',
    'พายเล่นในทะเลสาบ': 'Paddling on the lake',
    'ตะเกียงยามค่ำ': 'Lanterns at night',
    'ลานเต็นท์ยามพลบค่ำ': 'Campground at dusk',
    'น้ำใสสีฟ้า': 'Clear blue water',
    'ตะเกียงริมทะเลสาบ': 'Lanterns by the lake',
    'โซนบ้านพัก': 'Cabin area',
    'รังนกริมน้ำ': 'Bird’s-nest swing by the water',
    'มุมพระจันทร์': 'Moon seat',
    'มุมสูง ทะเลสาบ': 'The lake from above',
    'ฟ้าสีชมพูยามเย็น': 'Pink evening sky',
    'ระเบียงบ้านพัก': 'Cabin veranda',
    'ดอกไม้ริมน้ำ': 'Flowers by the water',
    'จิบกาแฟริมน้ำ': 'Coffee by the water',
    'ยามค่ำคืน': 'At night',
    'บ้านพักใต้ร่มไม้': 'Cabins in the shade',
    'มื้อริมน้ำ': 'Lakeside meal',
    'จิบชายามเย็น': 'Evening tea',
    'วิวทะเลสาบ': 'Lake view',
    'น้ำใส มุมสูง': 'Clear water from above',
    'ห้องน้ำส่วนกลาง': 'Shared restrooms',
    'นั่งชิลริมน้ำ': 'Chilling by the water',
    'ลานหญ้าริมทะเลสาบ': 'Lakeside lawn',
    'ตะเกียงยามเย็น': 'Lanterns at sunset',
    'ซับบอร์ด': 'Paddleboarding',
    'ถนนเลียบทะเลสาบ': 'Lakeside road',
    'ยินดีต้อนรับ': 'Welcome',
    'ลานเต็นท์ใต้ร่มไม้': 'Campground in the shade',
    'ชอบบรรยากาศแบบนี้? ดูราคาแล้วจองได้เลย': 'Like what you see? Check prices and book',
    'ขับรถไม่ไกล ก็ถึงทะเล': 'The sea is a short drive away',
    'เต็นท์กระโจมสีขาวประดับไฟวงกลมบนสนามหญ้ายามค่ำ': 'White bell tent with a ring of lights on the lawn at night',
    'พายคายัคตอนพระอาทิตย์ตก แสงส้มสะท้อนผิวน้ำ': 'Kayaking at sunset, orange light on the water',
    'เต็นท์และเก้าอี้แคมป์ริมทะเลสาบยามเช้า': 'Tent and camp chairs by the lake in the morning',
    'ชิงช้าไม้บนสนามหญ้าหน้าบ้านพักไม้': 'Wooden swing on the lawn in front of the cabins',
    'ทะเลสาบนิ่งสะท้อนเมฆและท้องฟ้า': 'Still lake reflecting clouds and sky',
    'เต็นท์กระโจมสีขาวบนสนามหญ้าริมทะเลสาบ': 'White bell tent on the lakeside lawn',
    'พายซับบอร์ดและคายัคในทะเลสาบ': 'Paddleboard and kayak on the lake',
    'ตะเกียงหลายดวงจุดไฟบนโต๊ะยามค่ำ': 'Lanterns lit on a table at night',
    'ลานเต็นท์ยามพลบค่ำ ท้องฟ้าสีม่วงส้ม': 'Campground at dusk under a purple-orange sky',
    'เต็นท์ผ้าใบสองหลังจุดตะเกียงริมทะเลสาบตอนฟ้าเย็น': 'Two canvas tents with lanterns by the lake at sunset',
    'ชิงช้ารังนกหวายใต้ต้นไม้ริมทะเลสาบ': 'Rattan bird’s-nest swing under a lakeside tree',
    'ที่นั่งรูปพระจันทร์เสี้ยวริมทะเลสาบ': 'Crescent-moon seat by the lake',
    'มุมสูงทะเลสาบนิ่งสะท้อนต้นไม้ริมฝั่ง': 'Aerial view of the still lake reflecting the trees',
    'ต้นไม้ใหญ่ริมทะเลสาบตอนฟ้าสีชมพูยามเย็น': 'Big lakeside tree under a pink evening sky',
    'ดอกไม้สีม่วงริมทะเลสาบ': 'Purple flowers by the lake',
    'กาต้มน้ำบนโต๊ะแคมป์ ฉากหลังเป็นทะเลสาบ': 'Kettle on a camp table with the lake behind',
    'เต็นท์หลายหลังเปิดไฟเรียงกันยามค่ำคืน': 'A row of lit-up tents at night',
    'บ้าน Studio และบ้านกระจกบนสนามหญ้า ใต้ร่มไม้': 'The Studio and glass house on the lawn, in the shade',
    'โต๊ะอาหารใต้ฟลายชีทแขวนตะเกียง ริมทะเลสาบ': 'Dining table under a flysheet with lanterns, by the lake',
    'แก้วเครื่องดื่มบนโต๊ะ ฉากหลังพระอาทิตย์ตก': 'A drink on the table against the sunset',
    'ทะเลสาบกว้างกับท่าน้ำ ภูเขาไกลๆ': 'Wide lake with a landing and distant hills',
    'มุมสูงท่าลงน้ำมีเรือคายัค น้ำใสเห็นพื้นหิน': 'Aerial view of the kayak landing, water clear to the rocks',
    'อาคารห้องน้ำสีขาวสะอาด': 'Clean white restroom building',
    'เก้าอี้แคมป์คู่บนสนามหญ้าริมทะเลสาบ': 'Two camp chairs on the lakeside lawn',
    'ลานหญ้าใต้ต้นไม้ริมทะเลสาบ มีเต็นท์อยู่ไกลๆ': 'Lawn under lakeside trees with tents in the distance',
    'ตะเกียงแขวนตอนพระอาทิตย์ตก': 'Hanging lantern at sunset',
    'ยืนพายซับบอร์ดกลางทะเลสาบ': 'Stand-up paddleboarding on the lake',
    'ทะเลสาบกว้างใต้ร่มไม้ใหญ่ ถนนเลียบริมน้ำ ฟ้าใส': 'Wide lake under big trees, lakeside road, clear sky',
    'ป้ายไม้ชื่อเดอะ ลากูน แคมป์ปิ้ง รีสอร์ท': 'Wooden sign: The Lagoon Camping Resort',
    'เต็นท์หลายแบบใต้ร่มไม้ริมทะเลสาบ ประดับธงสี': 'Tents of all kinds under lakeside trees with colourful flags',
    'ภาพขยาย': 'Enlarged photo',
    'ปิดภาพขยาย': 'Close',
    'รูปก่อนหน้า': 'Previous photo',
    'รูปถัดไป': 'Next photo',

    // ===== ราคา =====
    'ราคาลานกางเต็นท์ & บ้านพักริมน้ำ นายายอาม จันทบุรี | The Lagoon': 'Camping & lakeside cabin prices, Na Yai Am, Chanthaburi | The Lagoon',
    'ราคาที่พัก': 'Prices',
    'เลือกได้ทั้ง': 'Choose',
    'กางเต็นท์': 'camping',
    'และ': 'or',
    'ราคาต่อคืน': 'Per night',
    'ริมน้ำ มีจุดพ่วงปลั๊กไฟ': 'By the water, with power points',
    'นำเต็นท์มาเอง': 'Bring your own tent',
    'บาท/ท่าน': 'THB/person',
    'ผู้ใหญ่และเด็ก 15 ปีขึ้นไป · เด็ก 10–14 ปี 100 บาท · ต่ำกว่า 10 ปี ฟรี': 'Adults and children 15+ · Children 10–14: 100 THB · Under 10: free',
    'เต็นท์เช่า หลังใหญ่': 'Rental tent, large',
    'บาท/หลัง': 'THB/tent',
    'นอนได้ 2 ท่าน · พร้อมเครื่องนอน 2 ชุด พัดลม และปลั๊ก': 'Sleeps 2 · with 2 bedding sets, a fan and a power socket',
    'เต็นท์เช่า หลังเล็ก': 'Rental tent, small',
    'ทาร์ปด้านข้าง': 'Side tarp',
    'บาท': 'THB',
    'กางทาร์ปด้านหน้าเต็นท์ฟรี': 'Front tarp is free',
    'เครื่องครัวไฟฟ้าที่นำมาเอง': 'Your own electric cookware',
    'บาท/เต็นท์': 'THB/tent',
    'หม้อ เตา กระทะ กาต้มน้ำ เหมาจ่าย ใช้กี่ชิ้นก็ได้ · มือถือ ไฟ พัดลม ลำโพง โน้ตบุ๊ก ใช้ไฟฟรี': 'Pots, stoves, pans, kettles: one flat fee, as many as you like · Phones, lights, fans, speakers, laptops use power free',
    'แอร์เคลื่อนที่ที่นำมาเอง': 'Your own portable air-con',
    'บาท/เครื่อง': 'THB/unit',
    'เฉพาะลานเต็นท์ (บ้านพักมีแอร์อยู่แล้ว)': 'Campground only (cabins already have air-con)',
    'บาท/ลำ/ชม.': 'THB/canoe/hr',
    'ลูกค้าลานกางเต็นท์ · ลำละ 2 ท่าน · รอบละ 1 ชั่วโมง · ลูกค้าบ้านพักพายฟรี': 'For campers · 2 per canoe · 1-hour sessions · Free for cabin guests',
    'ของให้เช่า: พัดลม 50 บาท/คืน · ชุดเครื่องนอน (ที่นอนปิกนิก หมอน ผ้าห่ม) 200 บาท/ชุด · เตาปิ้งย่าง อันใหญ่ 100 บาท / อันเล็ก 50 บาท · สายพ่วงไฟ 50 บาท/เส้น': 'For rent: fan 50 THB/night · bedding set (picnic mattress, pillow, blanket) 200 THB/set · grill large 100 THB / small 50 THB · extension cord 50 THB/cord',
    'ฟรีเสื้อชูชีพสำหรับลงเล่นน้ำ ทั้งเด็กและผู้ใหญ่ · พาสัตว์เลี้ยงมากางเต็นท์ฟรี ·ที่จอดรถลานกว้าง เต็นท์หลังคารถจอดกางได้ · เหมาลาน สอบถามราคาทาง LINE หรือโทร': 'Free life jackets for swimming, kids and adults · Pets camp free · Big parking area, rooftop tents welcome · Private hire of the whole campground: ask for a price on LINE or by phone',
    'ราคาต่อหลัง': 'Per cabin',
    'บ้านหลังเล็ก (มี 3 หลัง) · สำหรับ 2 ท่าน · 1 เตียงใหญ่ · ห้องน้ำในตัว': 'Small cabin (3 of them) · for 2 · 1 big bed · private bathroom',
    'บ้านหลังใหม่ สไตล์โมเดิร์น · สำหรับ 2 ท่าน · 2 เตียง · ห้องน้ำในตัว': 'New modern-style cabin · for 2 · 2 beds · private bathroom',
    'สำหรับ 4 ท่าน · 1 ห้องนอน 2 เตียง · ห้องน้ำในตัว': 'For 4 · 1 bedroom with 2 beds · private bathroom',
    'สำหรับ 4 ท่าน · 2 ห้องนอน (ห้องละ 1 เตียงใหญ่) · 2 ห้องน้ำในตัว · มีครัว': 'For 4 · 2 bedrooms (1 big bed each) · 2 private bathrooms · kitchen',
    'เพิ่มคน 300 บาท/ท่าน ได้ที่นอนปิกนิกเสริม · พาสัตว์เลี้ยงนอนบ้านพัก +100 บาท/หลัง/คืน · ลูกค้าบ้านพักพายเรือแคนูฟรี': 'Extra person 300 THB/person with an extra picnic mattress · Pets in cabins +100 THB/cabin/night · Cabin guests canoe free',
    'แอร์': 'Air-con',
    'ทุกหลังติดริมเขื่อน': 'Every cabin is on the waterfront',
    'ระเบียงเห็นวิวน้ำ': 'Veranda with water view',
    'น้ำอุ่น': 'Hot water',
    'ตู้เย็น': 'Fridge',
    'กาต้มน้ำร้อน': 'Kettle',
    'กาแฟยามเช้า': 'Morning coffee',
    'เงื่อนไขการชำระเงิน': 'Payment terms',
    'จองบ้านพักหรือเต็นท์ออนไลน์ ชำระผ่านพร้อมเพย์ภายใน 6 ชั่วโมงหลังจอง ไม่เช่นนั้นการจองจะถูกยกเลิกอัตโนมัติ เลือกจ่ายได้ 2 แบบ': 'Book a cabin or tent online and pay by PromptPay within 6 hours of booking, or the booking is cancelled automatically. There are 2 ways to pay:',
    'มัดจำ 50%': '50% deposit',
    'ส่วนที่เหลือจ่ายวันเช็กอิน เป็นเงินสดหรือโอนหน้าเคาน์เตอร์': 'Pay the rest on check-in day, in cash or by transfer at the counter',
    'ยกเลิก/ไม่มาเข้าพัก ไม่คืนมัดจำ': 'Cancel/no-show: deposit not refunded',
    'ชำระเต็มจำนวน': 'Pay in full',
    'ไม่ต้องจ่ายเพิ่มวันเช็กอิน': 'Nothing more to pay at check-in',
    'ยกเลิก/ไม่มาเข้าพัก ได้รับคืน 50% ของยอดจอง (ส่วนที่เกินมัดจำ)': 'Cancel/no-show: 50% of the booking refunded (the part above the deposit)',
    'ชำระแล้วขอเลื่อนวันได้โดยแจ้งแอดมิน · ยกเลิกหรือไม่มาเข้าพัก: ไม่คืนมัดจำ 50% ทุกกรณี (ยกเว้นเหตุฉุกเฉิน ทางลานจะพิจารณาเป็นรายกรณี) · ถ้าชำระเต็มจำนวน ได้รับเงินคืนส่วนที่เกินมัดจำ (50% ของยอดจอง) แอดมินโอนคืนให้': 'Once paid, you can change dates by contacting our admin · Cancellation or no-show: the 50% deposit is not refunded in any case (emergencies are considered case by case) · If you paid in full, the part above the deposit (50% of the booking) is refunded by transfer from our admin',
    'ราคาอาจเปลี่ยนตามช่วงเทศกาลและวันหยุด · จองออนไลน์ได้ตลอด 24 ชม. (เข้าพักวันนี้ จองทางเว็บได้ถึง 18:00 น. หลังจากนั้นโทร 081-930-4969)': 'Prices may change during festivals and holidays · Book online 24 hrs a day (for tonight, book online until 18:00; after that call 081-930-4969)',
    'พร้อมแล้ว? เลือกวันและบ้านที่ว่างได้เลย': 'Ready? Pick your dates and a free cabin',
    'บ้านทุกหลังมี': 'Every cabin has',

    // ===== ข้อมูลเข้าพัก & FAQ =====
    'ข้อมูลเข้าพัก & คำถามที่พบบ่อย | The Lagoon Camping Resort': 'Guest info & FAQ | The Lagoon Camping Resort',
    'ข้อมูลเข้าพัก': 'Guest info',
    'ก่อนมาพัก ควรรู้': 'Good to know before you come',
    'เวลาเช็กอิน': 'Times',
    'เช็กอิน': 'Check-in',
    'เช็กเอาต์': 'Check-out',
    'เช็กอิน ตั้งแต่เวลานี้เป็นต้นไป': 'Check-in from this time',
    'เช็กเอาต์ ก่อนเวลานี้': 'Check-out by this time',
    'งดใช้เสียงหลังเวลานี้': 'Quiet time after this',
    'จุดพ่วงปลั๊กไฟสำหรับลานเต็นท์': 'Power points for the campground',
    'ห้องน้ำแยกชาย–หญิง': 'Separate men’s and women’s restrooms',
    'Wi‑Fi ฟรี': 'Free Wi‑Fi',
    'เรือแคนู (ลำละ 2 ท่าน): ลูกค้าบ้านพักพายฟรี · ลานกางเต็นท์ 100 บาท/ลำ/ชั่วโมง': 'Canoes (2 per canoe): free for cabin guests · campers 100 THB/canoe/hour',
    'บ้านพักทุกหลังมีแอร์ น้ำอุ่น ตู้เย็น กาต้มน้ำ และกาแฟยามเช้า': 'Every cabin has air-con, hot water, a fridge, a kettle and morning coffee',
    'เสื้อชูชีพฟรี ทั้งเด็กและผู้ใหญ่': 'Free life jackets for kids and adults',
    'ร้านอาหารตามสั่งในรีสอร์ท · ทำอาหารเอง ก่อไฟ ปิ้งย่างได้': 'Made-to-order restaurant on site · You can cook, make a fire and grill',
    'ที่จอดรถลานกว้าง เต็นท์หลังคารถจอดกางได้': 'Big parking area, rooftop tents welcome',
    'เงื่อนไขการจอง': 'Booking terms',
    'เลือกชำระมัดจำ 50% หรือเต็มจำนวน ผ่านพร้อมเพย์ ภายใน 6 ชั่วโมงหลังจอง ไม่เช่นนั้นการจองจะถูกยกเลิกอัตโนมัติ': 'Pay a 50% deposit or in full by PromptPay within 6 hours of booking, or the booking is cancelled automatically',
    'เข้าพักวันนี้ จองทางเว็บได้ถึง 18:00 น. หลังจากนั้นโทร 081-930-4969': 'For tonight, book online until 18:00; after that call 081-930-4969',
    'ชำระแล้ว แจ้งแอดมินเพื่อขอเลื่อนวันเข้าพักได้': 'Once paid, contact our admin to change your dates',
    'มัดจำ 50%: ส่วนที่เหลือชำระวันเช็กอิน เป็นเงินสดหรือโอนหน้าเคาน์เตอร์': '50% deposit: pay the rest on check-in day, in cash or by transfer at the counter',
    'ยกเลิกหรือไม่มาเข้าพัก: ไม่คืนมัดจำ 50% ทุกกรณี (ยกเว้นเหตุฉุกเฉิน ทางลานจะพิจารณาเป็นรายกรณี) · ถ้าชำระเต็มจำนวน ได้รับเงินคืนส่วนที่เกินมัดจำ (50% ของยอดจอง) แอดมินโอนคืนให้': 'Cancellation or no-show: the 50% deposit is not refunded in any case (emergencies are considered case by case) · If you paid in full, the part above the deposit (50% of the booking) is refunded by transfer from our admin',
    'เหมาะกับ': 'Great for',
    'แก๊งเพื่อนสายแคมป์ปิ้ง': 'Groups of camping friends',
    'ครอบครัวที่อยากพักบ้านริมน้ำ': 'Families who want a lakeside cabin',
    'คนที่มากับสัตว์เลี้ยง': 'People travelling with pets',
    'สายตกปลาและพายเรือ': 'Fishing and paddling fans',
    'เตรียมตัวก่อนมา': 'Get ready',
    'ของที่ควรเตรียมมา': 'What to bring',
    'ติ๊กของที่เตรียมแล้วได้เลย เว็บจะจำไว้ในเครื่องนี้': 'Tick things off as you pack. This device will remember.',
    'ถ้ากางเต็นท์': 'If camping',
    'เต็นท์': 'Tent',
    'นำมาเอง 200 บาท/ท่าน · หรือเช่าหลังใหญ่ 1,300 / หลังเล็ก 1,000 บาท (พร้อมเครื่องนอน 2 ชุด พัดลม และปลั๊ก)': 'Bring your own 200 THB/person · or rent large 1,300 / small 1,000 THB (with 2 bedding sets, a fan and a power socket)',
    'เครื่องนอน': 'Bedding',
    'ที่นอนปิกนิก หมอน ผ้าห่ม · หรือเช่า 200 บาท/ชุด': 'Picnic mattress, pillow, blanket · or rent 200 THB/set',
    'สายพ่วงไฟ': 'Extension cord',
    'ลานเต็นท์มีจุดพ่วงปลั๊กไฟ · หรือเช่า 50 บาท/เส้น': 'The campground has power points · or rent 50 THB/cord',
    'พัดลม': 'Fan',
    'ใช้ไฟฟรี · หรือเช่า 50 บาท/คืน': 'Power is free · or rent 50 THB/night',
    'ทาร์ป': 'Tarp',
    'กางด้านหน้าเต็นท์ฟรี · ทาร์ปด้านข้าง +100 บาท': 'Front of tent free · side tarp +100 THB',
    'ทุกคน': 'Everyone',
    'ของกิน ของปิ้งย่าง': 'Food and BBQ supplies',
    'ทำอาหารเอง ก่อไฟ ปิ้งย่างได้ · เตาปิ้งย่างให้เช่า อันใหญ่ 100 / อันเล็ก 50 บาท · มีร้านอาหารตามสั่งในรีสอร์ท': 'You can cook, make a fire and grill · Grills for rent: large 100 / small 50 THB · Made-to-order restaurant on site',
    'อุปกรณ์ตกปลา': 'Fishing gear',
    'ตกปลาริมทะเลสาบหน้าที่พักได้ฟรี': 'Fish free from the lakeshore by your stay',
    'ชุดลงเล่นน้ำ': 'Swimwear',
    'มีเสื้อชูชีพให้ฟรี ทั้งเด็กและผู้ใหญ่': 'Free life jackets for kids and adults',
    'ของใช้น้องหมาน้องแมว': 'Things for your dog or cat',
    'ถ้าพามาด้วย · ลานกางเต็นท์ฟรี · นอนบ้านพัก +100 บาท/หลัง/คืน': 'If they come along · free when camping · cabins +100 THB/cabin/night',
    'เงินสด หรือแอปโอนเงิน': 'Cash or a bank app',
    'จ่ายมัดจำ 50%: ส่วนที่เหลือชำระวันเช็กอิน เป็นเงินสดหรือโอนหน้าเคาน์เตอร์': 'Paid a 50% deposit: pay the rest on check-in day, in cash or by transfer at the counter',
    'ล้างเครื่องหมาย': 'Clear ticks',
    'คำถามที่พบบ่อย': 'FAQ',
    'มีคำถาม? ดูตรงนี้ก่อน': 'Questions? Start here',
    'เช็กอินและเช็กเอาต์กี่โมง?': 'What are check-in and check-out times?',
    'เช็กอินได้ตั้งแต่ 11:00 น. และเช็กเอาต์ก่อน 12:00 น.': 'Check-in from 11:00 and check-out by 12:00.',
    'เช็กเอาต์ช้าได้ไหม?': 'Can I check out late?',
    'ได้ เช็กเอาต์ช้า ไม่คิดเงินเพิ่ม': 'Yes, late check-out at no extra charge.',
    'พาสัตว์เลี้ยงมาได้ไหม?': 'Can I bring pets?',
    'ได้เลย พาน้องหมาน้องแมวมากางเต็นท์ฟรี ถ้านอนบ้านพัก +100 บาท/หลัง/คืน': 'Sure. Dogs and cats camp free; in a cabin it’s +100 THB/cabin/night.',
    'มีอาหารขายไหม ทำอาหารเองได้ไหม?': 'Is there food? Can I cook?',
    'มีร้านอาหารตามสั่งในรีสอร์ท และทำอาหารเอง ก่อไฟ ปิ้งย่างได้': 'There’s a made-to-order restaurant on site, and you can cook, make a fire and grill.',
    'พาเด็กมาด้วยคิดเงินไหม?': 'Do children pay?',
    'กางเต็นท์: เด็กต่ำกว่า 10 ปีฟรี อายุ 10–14 ปี 100 บาท 15 ปีขึ้นไปคิดราคาผู้ใหญ่ 200 บาท': 'Camping: under 10 free, ages 10–14 100 THB, 15 and up pay the adult price of 200 THB.',
    'ไม่มีเต็นท์ มาพักได้ไหม?': 'No tent? Can I still come?',
    'ได้ มีเต็นท์ให้เช่า 2 ขนาด หลังใหญ่ 1,300 บาท/คืน หลังเล็ก 1,000 บาท/คืน นอนได้ 2 ท่าน พร้อมเครื่องนอน 2 ชุด พัดลม และปลั๊ก จองพร้อมบ้านหรือจองแค่เต็นท์ในหน้าจองได้เลย หรือเลือกพักบ้านพักก็ได้ (เริ่ม 1,300 บาท/คืน)': 'Yes. We rent tents in 2 sizes: large 1,300 THB/night, small 1,000 THB/night, sleeping 2, with 2 bedding sets, a fan and a power socket. Book them with a cabin or on their own on the booking page, or stay in a cabin instead (from 1,300 THB/night).',
    'บ้านพักเพิ่มคนได้ไหม?': 'Can I add people to a cabin?',
    'ได้ เพิ่มคน 300 บาท/ท่าน ได้ที่นอนปิกนิกเสริม': 'Yes, 300 THB/person with an extra picnic mattress.',
    'เหมาลานได้ไหม?': 'Can we hire the whole campground?',
    'มีบริการเหมาลาน สอบถามราคาทาง LINE หรือโทร': 'Yes, private hire is available. Ask for a price on LINE or by phone.',
    'ลานเต็นท์มีไฟฟ้าไหม?': 'Is there power at the campground?',
    'มีจุดพ่วงปลั๊กไฟสำหรับลานเต็นท์ มือถือ ไฟ พัดลม ลำโพง โน้ตบุ๊ก ใช้ไฟฟรี · เครื่องครัวไฟฟ้า (หม้อ เตา กระทะ กาต้มน้ำ) เหมา 100 บาท/เต็นท์ ใช้กี่ชิ้นก็ได้ · แอร์เคลื่อนที่ที่นำมาเอง 200 บาท/เครื่อง · มีสายพ่วงไฟให้เช่า 50 บาท/เส้น': 'Yes, there are power points. Phones, lights, fans, speakers and laptops use power free · Electric cookware (pots, stoves, pans, kettles) is a flat 100 THB/tent, as many as you like · Your own portable air-con is 200 THB/unit · Extension cords for rent at 50 THB/cord',
    'มีอะไรให้ทำฟรีบ้าง?': 'What can we do for free?',
    'ตกปลาริมทะเลสาบ พายเรือแคนู (ลูกค้าบ้านพักพายฟรี · ลูกค้าลานกางเต็นท์ 100 บาท/ลำ/ชั่วโมง) มีเสื้อชูชีพฟรีทั้งเด็กและผู้ใหญ่ และมี Wi‑Fi ฟรี': 'Fishing from the lakeshore, canoeing (free for cabin guests · campers 100 THB/canoe/hour), free life jackets for kids and adults, and free Wi‑Fi.',
    'พายเรือแคนูคิดเงินไหม?': 'Is canoeing free?',
    'ลูกค้าบ้านพักพายฟรี ไม่คิดเงิน · ลูกค้าลานกางเต็นท์ 100 บาท/ลำ (ลำละ 2 ท่าน) รอบละ 1 ชั่วโมง · มีเสื้อชูชีพฟรีทั้งเด็กและผู้ใหญ่': 'Free for cabin guests · Campers 100 THB/canoe (2 per canoe) for a 1-hour session · Free life jackets for kids and adults',
    'จองและชำระเงินอย่างไร?': 'How do I book and pay?',
    'เลือกวันและบ้านที่ว่างในหน้า': 'Pick your dates and a free cabin on the',
    'แล้วเลือกชำระมัดจำ 50% หรือเต็มจำนวน ผ่าน QR พร้อมเพย์ภายใน 6 ชั่วโมง จากนั้นส่งสลิปทาง LINE หรือโทรจองที่ 081-930-4969 ก็ได้ · จองแล้วเช็กสถานะและดูใบยืนยันการจองได้ที่หน้า': 'page, then pay a 50% deposit or in full with the PromptPay QR within 6 hours and send the slip on LINE. Or call 081-930-4969 to book · After booking, check the status and your confirmation on the',
    '(ใช้เบอร์โทรที่ใช้ตอนจอง)': 'page (use the phone number you booked with)',
    'ยกเลิกหรือเลื่อนวันได้ไหม?': 'Can I cancel or change dates?',
    'ชำระแล้วแจ้งแอดมินเพื่อขอเลื่อนวันได้ · ยกเลิกหรือไม่มาเข้าพัก: ไม่คืนมัดจำ 50% ทุกกรณี (ยกเว้นเหตุฉุกเฉิน ทางลานจะพิจารณาเป็นรายกรณี) · ถ้าชำระเต็มจำนวน ได้รับเงินคืนส่วนที่เกินมัดจำ (50% ของยอดจอง) แอดมินโอนคืนให้': 'Once paid, contact our admin to change dates · Cancellation or no-show: the 50% deposit is not refunded in any case (emergencies are considered case by case) · If you paid in full, the part above the deposit (50% of the booking) is refunded by transfer from our admin',
    'ส่งเสียงดังได้ถึงกี่โมง?': 'Until what time can we be noisy?',
    'ขอความร่วมมืองดใช้เสียงหลัง 22:00 น. เพื่อให้แขกทุกคนได้พักผ่อน': 'Please keep quiet after 22:00 so every guest can rest.',
    'มีที่จอดรถไหม?': 'Is there parking?',
    'มี เป็นลานกว้าง สายเต็นท์หลังคารถก็มาจอดกางได้': 'Yes, a big open area. Rooftop tents are welcome too.',
    'เปิดทุกวันไหม?': 'Are you open every day?',
    'เปิดให้บริการทุกวัน แนะนำให้จองหรือโทรแจ้งก่อนเดินทาง โดยเฉพาะวันหยุดยาว': 'Open every day. We recommend booking or calling before you travel, especially on long holidays.',
    'ไม่เจอคำตอบที่หา? ทักไลน์หรือโทรหาเราได้เลย': 'Didn’t find your answer? Message us on LINE or call',
    'ติดต่อเรา': 'Contact us',
    'หน้าจอง': 'booking',

    // ===== ติดต่อ =====
    'ติดต่อ & เดินทาง ลานกางเต็นท์ นายายอาม จันทบุรี | The Lagoon': 'Contact & directions, Na Yai Am, Chanthaburi | The Lagoon',
    'ติดต่อ & การเดินทาง': 'Contact & getting here',
    'จองที่พัก หรือสอบถามเพิ่มเติม': 'Book or ask us anything',
    'โทรศัพท์': 'Phone',
    'LINE (จอง/สอบถาม)': 'LINE (booking/questions)',
    'อีเมล': 'Email',
    'ที่ตั้ง': 'Location',
    'ริมอ่างเก็บน้ำตำบลช้างข้าม': 'By the Chang Kham reservoir',
    'การเดินทาง': 'Getting here',
    'จากกรุงเทพฯ ประมาณ': 'From Bangkok about',
    '200 กม.': '200 km',
    'ขับรถราว': 'about a',
    '3 ชั่วโมง': '3-hour drive',
    'จากตัวเมืองจันทบุรี ประมาณ': 'From Chanthaburi town about',
    '40 กม.': '40 km',
    'นำทางด้วย Google Maps': 'Navigate with Google Maps',
    'เปิดให้บริการทุกวัน แนะนำให้โทรแจ้งก่อนเดินทาง โดยเฉพาะวันหยุดยาว': 'Open every day. We recommend calling before you travel, especially on long holidays.',
    'แวะเที่ยวทะเลระหว่างทาง ดู': 'Visit the sea on the way: see',
    'ที่เที่ยวใกล้รีสอร์ท': 'places near the resort',
    '· พร้อมแล้ว': '· Ready?',
    'เช็กวันว่างและจองที่พัก': 'Check availability and book',
    'แผนที่ The Lagoon Camping Resort': 'Map of The Lagoon Camping Resort',
    'เบอร์หลัก': 'Main number',
    'ทัก LINE': 'Message on LINE',

    // ===== ที่เที่ยวใกล้เคียง =====
    'ที่เที่ยวนายายอาม ใกล้หาดคุ้งวิมาน แหลมแม่นกแก้ว | The Lagoon': 'Things to do near Na Yai Am, Khung Wiman Beach, Laem Mae Nok Kaeo | The Lagoon',
    'เที่ยวรอบรีสอร์ท ขับรถไม่ไกล': 'Day trips a short drive away',
    'ข้อ 2–7 อยู่บนถนนเลียบชายฝั่งเส้นเดียวกัน เที่ยวเลียบทะเลได้ครึ่งวัน': 'Places 2–7 are on the same coastal road, an easy half-day by the sea',
    'ระยะทางและเวลาขับรถเป็นค่าประมาณจากรีสอร์ท': 'Distances and drive times are approximate, from the resort',
    'ทะเล': 'Sea',
    '~8 กม. · ~13 นาที': '~8 km · ~13 min',
    'หาดเงียบใน ต.ช้างข้าม น้ำลงเดินเล่นบนหาดได้ ดูพระอาทิตย์ตกสวย': 'A quiet beach in Chang Kham. Walk on the sand at low tide and watch a beautiful sunset.',
    'นำทาง': 'Directions',
    'หาดคุ้งวิมาน': 'Khung Wiman Beach',
    '~22 กม. · ~28 นาที': '~22 km · ~28 min',
    'หาดทรายยาวริมถนนเลียบชายฝั่ง มีร้านอาหารริมหาด': 'A long sandy beach along the coastal road, with beachfront restaurants',
    'จุดชมวิวเนินนางพญา': 'Noen Nang Phaya Viewpoint',
    'ธรรมชาติ': 'Nature',
    'จุดถ่ายรูปถนนเลียบทะเลโค้งสวย ยอดนิยมของจันทบุรี': 'Chanthaburi’s favourite photo spot over a curving seaside road',
    'เจดีย์กลางน้ำบ้านหัวแหลม': 'Ban Hua Laem Pagoda in the Sea',
    'วัด': 'Temple',
    '~23 กม. · ~29 นาที': '~23 km · ~29 min',
    'เจดีย์สีขาวกลางทะเล อยู่ใกล้เนินนางพญา เที่ยวต่อกันได้': 'A white pagoda out in the sea near Noen Nang Phaya, easy to visit together',
    'หาดแหลมเสด็จ': 'Laem Sadet Beach',
    '~30 กม. · ~38 นาที': '~30 km · ~38 min',
    'หาดยาว บรรยากาศสงบ': 'A long, peaceful beach',
    'ศูนย์ศึกษาการพัฒนาอ่าวคุ้งกระเบน': 'Kung Krabaen Bay Royal Development Study Centre',
    '~30 กม. · ~39 นาที': '~30 km · ~39 min',
    'เดินชมป่าชายเลน พายคายัค ไม่เสียค่าเข้า': 'Mangrove boardwalk and kayaking, free entry',
    '~33 กม. · ~41 นาที': '~33 km · ~41 min',
    'หาดดังของจันทบุรี มีร้านอาหารทะเลเยอะ': 'Chanthaburi’s famous beach, with lots of seafood restaurants',
    'วัดเขาสุกิม': 'Wat Khao Sukim',
    '~33 กม. · ~35 นาที': '~33 km · ~35 min',
    'วัดบนเขาที่มีชื่อเสียง มีพิพิธภัณฑ์ให้ชม': 'A famous hilltop temple with a museum',
    'ชุมชนริมน้ำจันทบูร': 'Chanthaboon Waterfront Community',
    'ของกิน': 'Food',
    '~45 กม. · ~40 นาที': '~45 km · ~40 min',
    'ย่านบ้านไม้เก่าริมแม่น้ำในตัวเมือง ของกินท้องถิ่นและคาเฟ่': 'Old wooden riverside houses in town, local food and cafés',
    'สวนผลไม้เมืองจันท์': 'Chanthaburi fruit orchards',
    'ระยะทางแล้วแต่สวน': 'Distance depends on the orchard',
    'ชิมทุเรียน มังคุด เงาะ จากสวน (ตามฤดูกาล ช่วงหน้าร้อน)': 'Taste durian, mangosteen and rambutan from the orchard (in season, during the hot months)',
    'ค้นหาสวนใน Google Maps': 'Find orchards on Google Maps',
    'เที่ยวทะเลกลางวัน กลับมานอนริมทะเลสาบ ดูวันว่างแล้วจองได้เลย': 'Beach by day, sleep by the lake. Check availability and book',
    'ดูการเดินทาง': 'How to get here',

    // ===== 404 =====
    'ไม่พบหน้านี้ | The Lagoon Camping Resort': 'Page not found | The Lagoon Camping Resort',
    'ไม่พบหน้านี้ (404)': 'Page not found (404)',
    'หลงทางริมทะเลสาบหรือเปล่า?': 'Lost by the lake?',
    'ลิงก์นี้อาจพิมพ์ผิด หรือหน้านี้ถูกย้ายไปแล้ว ลองเริ่มจากหน้าด้านล่างนี้ได้เลย': 'This link may be mistyped, or the page has moved. Try one of these pages instead.',
    'กลับหน้าแรก': 'Back to home',
    'เช็กวันว่าง & จอง': 'Check availability & book',

    // ===== เช็กการจองของฉัน =====
    'เช็กการจองของฉัน | The Lagoon Camping Resort': 'My booking | The Lagoon Camping Resort',
    'เช็กการจอง': 'Check booking',
    'ใส่เบอร์โทรที่ใช้ตอนจอง เพื่อดูสถานะและใบยืนยันการจอง': 'Enter the phone number you booked with to see the status and your confirmation',
    'เบอร์โทรที่ใช้ตอนจอง': 'Phone number used for booking',
    'ค้นหาการจอง': 'Find booking',
    'จำเบอร์ไว้ในเครื่องนี้แล้ว ·': 'Number saved on this device ·',
    'ล้าง': 'Clear',
    'เช่น 081-234-5678': 'e.g. 081-234-5678',
    'กำลังค้นหา…': 'Searching…',
    'ไม่พบการจอง': 'No booking found',
    'ไม่พบการจองของเบอร์นี้ ลองเช็กเบอร์ที่ใช้ตอนจอง หรือทัก LINE': 'No booking found for this number. Check the number you booked with, or message LINE',
    'โชว์เฉพาะการจองที่ยังไม่ถึงวันเข้าพัก และที่เช็กเอาต์ไปไม่เกิน 30 วัน': 'Shows only upcoming bookings and those checked out within the last 30 days',
    'ใบยืนยันการจอง': 'Booking confirmation',
    'รหัสการจอง': 'Booking ID',
    'ไม่มีรหัส (จองทางโทรศัพท์)': 'No ID (booked by phone)',
    'ผ่านไปแล้ว': 'Past',
    'รอชำระเงิน': 'Awaiting payment',
    'ยืนยันแล้ว': 'Confirmed',
    'ยกเลิกแล้ว': 'Cancelled',
    'หมดเวลาชำระ': 'Payment time expired',
    'รอแอดมินตรวจสอบ': 'Waiting for admin check',
    'ชื่อผู้จอง': 'Name',
    'ที่พัก': 'Stay',
    'วันที่': 'Dates',
    'ผู้เข้าพัก': 'Guests',
    'ยอดรวม': 'Total',
    'ชำระแล้ว': 'Paid',
    'ชำระวันเช็กอิน': 'Pay at check-in',
    'คืนเงินแล้ว (กรณีพิเศษ)': 'Refunded (special case)',
    'พรุ่งนี้เข้าพักแล้ว': 'Your stay is tomorrow',
    'เข้าพักวันนี้': 'Your stay is today',
    'อยู่ระหว่างเข้าพัก': 'Currently staying',
    'ดู QR / ส่งสลิป →': 'View QR / send slip →',
    'ส่งสลิปทาง LINE →': 'Send slip on LINE →',
    'แผนที่ / นำทาง': 'Map / directions',
    'เพิ่มลง Google Calendar': 'Add to Google Calendar',
    'บันทึกลงปฏิทิน (.ics)': 'Save to calendar (.ics)',
    'บันทึกเป็นรูป': 'Save as image',
    'รายละเอียดการจองสำหรับคัดลอก': 'Booking details to copy',
    'แสดงหน้านี้หรือรูปนี้กับเจ้าหน้าที่ตอนเช็กอิน': 'Show this page or image to our staff at check-in',
    'เบอร์โทรไม่ถูกต้อง กรุณาตรวจอีกครั้ง เช่น 081-234-5678': 'That phone number doesn’t look right. Please check it, e.g. 081-234-5678',
    'ค้นหาบ่อยเกินไป รอ 10 นาทีแล้วลองใหม่': 'Too many searches. Wait 10 minutes and try again',
    'ไม่มีอินเทอร์เน็ต กรุณาเชื่อมต่อแล้วลองใหม่': 'No internet connection. Please reconnect and try again',
    'ระบบตอบช้า ลองใหม่อีกครั้ง': 'The system is slow to respond. Please try again',
    'ล้างเบอร์ที่จำไว้แล้ว': 'Saved number cleared',
    'กรุณาใส่เบอร์โทรที่ใช้ตอนจอง': 'Please enter the phone number you booked with',
    'ใส่ได้เฉพาะตัวเลข เช่น 081-234-5678': 'Numbers only, e.g. 081-234-5678',
    'เบอร์โทรสั้นเกินไป เบอร์มือถือมี 10 หลัก เช่น 081-234-5678': 'Phone number too short. Mobile numbers have 10 digits, e.g. 081-234-5678',
    'เบอร์โทรยาวเกินไป เบอร์มือถือมี 10 หลัก เช่น 081-234-5678': 'Phone number too long. Mobile numbers have 10 digits, e.g. 081-234-5678',
    'เบอร์โทรต้องขึ้นต้นด้วย 0 เช่น 081-234-5678': 'Phone number must start with 0, e.g. 081-234-5678',
    'บันทึกไฟล์ปฏิทินแล้ว กดเปิดไฟล์เพื่อเพิ่มลงปฏิทินในเครื่อง': 'Calendar file saved. Open it to add the stay to your calendar.',
    'บันทึกไฟล์ปฏิทินไม่สำเร็จ — ลองปุ่ม "เพิ่มลง Google Calendar" แทน': 'Couldn’t save the calendar file. Try "Add to Google Calendar" instead.',
    'บันทึกรูปแล้ว (ดูในรูปภาพหรือไฟล์ดาวน์โหลด)': 'Image saved (check your photos or downloads)',
    'บันทึกรูปไม่สำเร็จ — แคปหน้าจอใบยืนยันนี้แทนได้': 'Couldn’t save the image. Take a screenshot of this confirmation instead.',
    'คัดลอกอัตโนมัติไม่ได้ — กดค้างที่ข้อความด้านล่างเพื่อคัดลอก': 'Couldn’t copy automatically. Long-press the text below to copy it.',

    // ===== หน้าจอง =====
    'จองที่พัก ลานกางเต็นท์ & บ้านพักริมน้ำ จันทบุรี | The Lagoon': 'Book camping & lakeside cabins in Chanthaburi | The Lagoon',
    'ตอนนี้รับจองผ่านแชต Facebook': 'Right now we take bookings in Facebook chat',
    'ระบบจองออนไลน์บนเว็บยังไม่เปิดใช้งาน ทักแชตเพจ The Lagoon Camping Resort แจ้งวันที่เข้าพักและจำนวนคน แอดมินจะเช็กวันว่างและตอบกลับในแชต': 'Online booking isn’t open yet. Message The Lagoon Camping Resort page with your dates and number of guests, and our admin will check availability and reply in the chat.',
    'ทักแชตเพจ Facebook': 'Message our Facebook page',
    'ดูที่พักและราคา': 'See stays and prices',
    'โหมดทดลอง: แผนผัง รูป และการจองที่ขึ้นว่า "ถูกจองแล้ว" เป็นข้อมูลตัวอย่าง ยังไม่บันทึกการจองจริง': 'Test mode: the map, photos and "booked" labels are sample data. No real booking is saved.',
    'คุณมีการจองรอชำระ': 'You have a booking awaiting payment',
    'เปิดหน้าชำระเงิน': 'Open payment page',
    'ขั้นตอนการจอง': 'Booking steps',
    'เลือกบ้าน/เต็นท์': 'Choose cabin/tent',
    'กรอกข้อมูล': 'Your details',
    'ชำระเงิน': 'Payment',
    'เลือกวันและที่พัก': 'Choose dates and stay',
    'ทางลัดเลือกวัน (พักคืนเดียว)': 'Date shortcuts (one night)',
    'คืนนี้': 'Tonight',
    'เสาร์นี้': 'This Saturday',
    'เสาร์หน้า': 'Next Saturday',
    'เดือนก่อนหน้า': 'Previous month',
    'เดือนถัดไป': 'Next month',
    'อา.': 'Sun', 'จ.': 'Mon', 'อ.': 'Tue', 'พ.': 'Wed', 'พฤ.': 'Thu', 'ศ.': 'Fri', 'ส.': 'Sat',
    'คำอธิบายสี': 'Colour key',
    'ว่างทุกหลัง': 'All free',
    'ว่างบางหลัง': 'Some free',
    'เต็ม': 'Full',
    'ตัวเลขใต้วันที่ = บ้านว่างคืนนั้น/ทั้งหมด': 'Number under the date = cabins free that night / total',
    'ลานกางเต็นท์ไม่จำกัดจำนวน จองได้ทุกวัน': 'Camping has no limit and can be booked any day',
    'กำลังโหลดวันว่าง…': 'Loading availability…',
    'โหลดวันว่างไม่สำเร็จ ยังเลือกวันได้ตามปกติ': 'Couldn’t load availability. You can still pick dates as usual.',
    'กำลังเช็กวันว่าง…': 'Checking availability…',
    'เลือกวันเข้าพักก่อน แล้วกดเลือกบ้านที่ว่าง': 'Pick your dates first, then choose a free cabin',
    'ลองอีกครั้ง': 'Try again',
    'ช่วงนี้มีคืนที่เต็มทุกหลัง (ลานกางเต็นท์ยังจองได้) ลองเลือกวันอื่น หรือจองเฉพาะเต็นท์': 'Some nights in this range are fully booked (camping is still available). Try other dates or book a tent only.',
    'แผนผังบ้านพัก แตะที่บ้านเพื่อเลือก': 'Cabin map. Tap a cabin to choose it',
    'ทางเข้า · ลานจอดรถ': 'Entrance · parking',
    'อ่างเก็บน้ำ': 'Reservoir',
    'ต.ช้างข้าม': 'Chang Kham',
    'ถูกจองแล้ว': 'Booked',
    'วันที่เลือก ลานกางเต็นท์ไม่ว่าง (มีการจองเหมาลาน) · ยังจองบ้านพักได้ถ้าว่าง': 'The campground is booked for a private event on these dates · cabins can still be booked if free',
    'วันที่เลือก ลานกางเต็นท์ไม่ว่าง (มีการจองเหมาลาน) กรุณาเลือกบ้านพักหรือวันอื่น': 'The campground is booked for a private event on these dates. Please choose a cabin or other dates',
    'ว่าง': 'Free',
    'เลือกแล้ว': 'Selected',
    '✓ เลือกแล้ว': '✓ Selected',
    'ลานกางเต็นท์ ดูราคาและเลือกจำนวน': 'Campground: see prices and choose how many',
    '200 บาท/ท่าน · มีเต็นท์ให้เช่า': '200 THB/person · tents for rent',
    'แผนผังจำลอง ไม่ตรงตามมาตราส่วน · แตะที่บ้านเพื่อเลือก': 'Illustrative map, not to scale · Tap a cabin to choose it',
    'บ้านพักริมน้ำ': 'Lakeside cabins',
    'บ้าน 6 หลังเรียงแนวเดียวกัน ติดริมเขื่อน · มีแอร์ ห้องน้ำในตัว และกาแฟยามเช้าทุกหลัง': '6 cabins in a row on the waterfront · each with air-con, a private bathroom and morning coffee',
    'สิ่งอำนวยความสะดวกทุกหลัง': 'In every cabin',
    'บ้านทุกหลังอยู่แนวเดียวกัน ติดริมเขื่อน และมี': 'All cabins are in one row on the waterfront, and each has',
    'ห้องน้ำในตัว มีน้ำอุ่น': 'Private bathroom with hot water',
    'เพิ่มคนได้ คนละ 300 บาท (มีที่นอนปิกนิกเสริม) แจ้งทาง LINE หรือโทร 081-930-4969': 'Extra guests 300 THB each (with an extra picnic mattress). Tell us on LINE or call 081-930-4969',
    'มากันหลายคน? เลือกบ้านได้หลายหลัง และ': 'A big group? Choose several cabins, and',
    'เพิ่มเต็นท์ได้ที่การ์ดลานกางเต็นท์ด้านล่าง (จองเฉพาะเต็นท์ก็ได้)': 'add tents on the campground card below (or book tents only)',
    'บาท/คืน': 'THB/night',
    'ดูรูป': 'Photos',
    'ซ่อนรูป': 'Hide photos',
    'เลือก': 'Select',
    'บ้านหลังเล็ก': 'Small cabin',
    'บ้านหลังกลาง': 'Medium cabin',
    'บ้านหลังใหญ่ · มีครัว': 'Large cabin · kitchen',
    'บ้านหลังใหม่ สไตล์โมเดิร์น': 'New modern-style cabin',
    '1 เตียงใหญ่': '1 big bed',
    '2 เตียง': '2 beds',
    'ห้องน้ำในตัว': 'Private bathroom',
    '2 ห้องน้ำในตัว': '2 private bathrooms',
    '1 ห้องนอน 2 เตียง': '1 bedroom, 2 beds',
    '2 ห้องนอน (ห้องละ 1 เตียงใหญ่)': '2 bedrooms (1 big bed each)',
    'ลานกางเต็นท์ริมน้ำ': 'Lakeside campground',
    'เพิ่มคู่กับบ้านพัก หรือจองเฉพาะเต็นท์ก็ได้ · มีจุดพ่วงปลั๊กไฟ และห้องน้ำแยกชาย–หญิง': 'Add to a cabin or book tents only · power points and separate men’s and women’s restrooms',
    'บาท/ท่าน/คืน': 'THB/person/night',
    'นับผู้ใหญ่และเด็ก 15 ปีขึ้นไป · เด็ก 10–14 ปี 100 บาท ต่ำกว่า 10 ปีฟรี (ชำระหน้างาน)': 'Count adults and children 15+ · Children 10–14: 100 THB, under 10 free (pay on arrival)',
    'ท่าน': 'people',
    'เช่าเต็นท์หลังใหญ่': 'Rent a large tent',
    'เช่าเต็นท์หลังเล็ก': 'Rent a small tent',
    'บาท/หลัง/คืน': 'THB/tent/night',
    'นอนได้ 2 ท่าน พร้อมเครื่องนอน 2 ชุด พัดลม และปลั๊ก': 'Sleeps 2, with 2 bedding sets, a fan and a power socket',
    'หลัง': 'tents',
    'จำนวนคนนำเต็นท์มาเอง': 'Number of people with own tent',
    'จำนวนเต็นท์เช่าหลังใหญ่': 'Number of large rental tents',
    'จำนวนเต็นท์เช่าหลังเล็ก': 'Number of small rental tents',
    'ลดจำนวนคนนำเต็นท์มาเอง': 'Fewer people with own tent',
    'เพิ่มจำนวนคนนำเต็นท์มาเอง': 'More people with own tent',
    'ลดจำนวนเต็นท์เช่าหลังใหญ่': 'Fewer large rental tents',
    'เพิ่มจำนวนเต็นท์เช่าหลังใหญ่': 'More large rental tents',
    'ลดจำนวนเต็นท์เช่าหลังเล็ก': 'Fewer small rental tents',
    'เพิ่มจำนวนเต็นท์เช่าหลังเล็ก': 'More small rental tents',
    'ถัดไป': 'Next',
    '← เปลี่ยนบ้านหรือวันที่': '← Change cabin or dates',
    'ขั้นที่ 2 จาก 3': 'Step 2 of 3',
    'กรอกข้อมูลผู้จอง': 'Your details',
    'เบอร์โทร': 'Phone',
    'จำนวนคนพักในบ้าน (ท่าน)': 'Guests staying in the cabin',
    'หมายเหตุ (ถ้ามี)': 'Note (optional)',
    'เช่น พาน้องหมามาด้วย, มาถึงประมาณ 15:00': 'e.g. bringing our dog, arriving around 15:00',
    'เลือกแบบชำระเงิน': 'Choose how to pay',
    'ส่วนที่เหลือจ่ายวันเช็กอิน (เงินสดหรือโอนหน้าเคาน์เตอร์) · ยกเลิกไม่คืนมัดจำ': 'Pay the rest on check-in day (cash or transfer at the counter) · Deposit not refunded if you cancel',
    'จ่ายครบตอนจอง ไม่ต้องจ่ายเพิ่มวันเช็กอิน · ยกเลิกได้รับคืน 50% (ส่วนที่เกินมัดจำ)': 'Pay everything now, nothing more at check-in · 50% refunded if you cancel (the part above the deposit)',
    'ชำระผ่านพร้อมเพย์': 'Pay by PromptPay',
    'ภายใน 6 ชั่วโมง': 'within 6 hours',
    'หลังจอง ไม่เช่นนั้นการจองจะถูกยกเลิกอัตโนมัติ': 'of booking, or the booking is cancelled automatically',
    'มัดจำ 50%:': '50% deposit:',
    'ส่วนที่เหลือชำระวันเช็กอิน เป็นเงินสดหรือโอนหน้าเคาน์เตอร์ ·': 'pay the rest on check-in day, in cash or by transfer at the counter ·',
    'ชำระเต็มจำนวน:': 'Paid in full:',
    'ยกเลิกหรือไม่มาเข้าพัก: ไม่คืนมัดจำ 50% ทุกกรณี': 'Cancellation or no-show: the 50% deposit is not refunded in any case',
    '(ยกเว้นเหตุฉุกเฉิน ทางลานจะพิจารณาเป็นรายกรณี) · ถ้าชำระเต็มจำนวน ได้รับเงินคืนส่วนที่เกินมัดจำ (50% ของยอดจอง) แอดมินโอนคืนให้': '(emergencies are considered case by case) · If you paid in full, the part above the deposit (50% of the booking) is refunded by transfer from our admin',
    'งดใช้เสียงหลัง 22:00 น.': 'Quiet after 22:00.',
    'ฉันอ่านและยอมรับเงื่อนไขการจอง': 'I have read and accept the booking terms',
    'เว็บไซต์': 'website',
    'ยืนยันการจอง': 'Confirm booking',
    'กำลังส่ง…': 'Sending…',
    'ขั้นตอนสุดท้าย': 'Last step',
    'ชำระเงินเพื่อยืนยันการจอง': 'Pay to confirm your booking',
    'ล็อกบ้านไว้ให้คุณแล้ว กรุณาชำระเงินภายในเวลาที่กำหนด ไม่เช่นนั้นการจองจะถูกยกเลิกอัตโนมัติ': 'Your stay is held for you. Please pay within the time limit, or the booking is cancelled automatically.',
    'QR พร้อมเพย์สำหรับชำระเงิน': 'PromptPay QR for payment',
    'สแกนด้วยแอปธนาคาร ยอดเงินขึ้นให้อัตโนมัติ': 'Scan with your bank app. The amount fills in automatically.',
    'ยอดที่ต้องชำระ': 'Amount to pay',
    'ยอดคงเหลือ': 'Balance',
    'ชำระภายใน': 'Pay by',
    'พร้อมเพย์': 'PromptPay',
    'บันทึกรูป QR': 'Save QR image',
    'คัดลอกรายละเอียด': 'Copy details',
    'บันทึกรูป QR แล้ว': 'QR image saved',
    'คัดลอกรายละเอียดแล้ว': 'Details copied',
    'สแกน QR หรือโอนเข้าพร้อมเพย์ 090-936-5562 ตามยอดที่ต้องชำระ': 'Scan the QR or transfer the amount due to PromptPay 090-936-5562',
    'กดปุ่ม': 'Tap',
    '"ส่งสลิปทาง LINE"': '"Send slip on LINE"',
    'แล้วแนบรูปสลิปโอนเงินในแชต': 'and attach a photo of your transfer slip in the chat',
    'แอดมินตรวจสอบยอดแล้วจะตอบยืนยันการจองในแชต': 'Our admin checks the payment and confirms your booking in the chat',
    'เช็กสถานะการจองภายหลังได้ที่': 'Check your booking status later on',
    '(ใช้เบอร์โทรที่ใส่ตอนจอง)': '(use the phone number you booked with)',
    'ส่งสลิปทาง LINE': 'Send slip on LINE',
    'ดูรายละเอียดการจอง': 'View booking details',
    'รายละเอียดการจอง': 'Booking details',
    '(โหมดทดลอง)': '(test mode)',
    '(หมดเวลาแล้ว)': '(time is up)',
    'บ้าน': 'Cabins',
    'รวม': 'Total',
    'กรุณาใส่เบอร์โทร': 'Please enter your phone number',
    'เบอร์โทรใส่ได้เฉพาะตัวเลข เช่น 081-234-5678': 'Phone number: digits only, e.g. 081-234-5678',
    'เบอร์โทรสั้นเกินไป (ต้องมี 9–10 หลัก) เช่น 081-234-5678': 'Phone number too short (needs 9–10 digits), e.g. 081-234-5678',
    'เบอร์โทรยาวเกินไป (ต้องมี 9–10 หลัก) เช่น 081-234-5678': 'Phone number too long (needs 9–10 digits), e.g. 081-234-5678',
    'กรุณาเลือกวันเช็กอินและวันเช็กเอาต์': 'Please choose check-in and check-out dates',
    'วันเช็กเอาต์ต้องหลังวันเช็กอิน': 'Check-out must be after check-in',
    'วันที่ไม่ถูกต้อง กรุณาเลือกวันใหม่': 'Invalid dates. Please choose again',
    'จองได้สูงสุด 30 คืน': 'You can book up to 30 nights',
    'เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก เช่น 0812345678': 'Phone number must be 9–10 digits, e.g. 0812345678',
    'จำนวนคนไม่ถูกต้อง': 'Invalid number of guests',
    'จำนวนคนเกินที่บ้านที่เลือกรับได้ กรุณาเลือกบ้านหรือเต็นท์เพิ่ม': 'Too many guests for the chosen cabins. Please add a cabin or tents',
    'จำนวนเต็นท์ไม่ถูกต้อง': 'Invalid number of tents',
    'กรุณากรอกชื่อผู้จอง': 'Please enter your name',
    'หมายเหตุยาวเกินไป (ไม่เกิน 500 ตัวอักษร)': 'Note too long (max 500 characters)',
    'กรุณาเลือกบ้านหรือเต็นท์อย่างน้อย 1 อย่าง': 'Please choose at least 1 cabin or tent',
    'กรุณาใส่จำนวนคนพักในบ้าน': 'Please enter the number of guests in the cabin',
    'กรุณาเลือกแบบชำระเงิน (มัดจำ 50% หรือชำระเต็มจำนวน)': 'Please choose how to pay (50% deposit or in full)',
    'กรุณาติ๊กยอมรับเงื่อนไขการจองก่อนกดยืนยัน': 'Please tick to accept the booking terms before confirming',
    'กรุณากรอกข้อมูลให้ครบถ้วน': 'Please fill in all required fields',
    'หากยกเลิกหรือไม่มาเข้าพัก ไม่คืนมัดจำ 50% ทุกกรณี (ยกเว้นเหตุฉุกเฉิน ทางลานจะพิจารณาเป็นรายกรณี) · งดใช้เสียงหลัง 22:00 น.': 'If you cancel or don’t show up, the 50% deposit is not refunded in any case (emergencies are considered case by case) · Quiet after 22:00.',
    'ยอดชำระเต็มจำนวน': 'Full payment',
    'ยอดมัดจำ 50%': '50% deposit',

    // ===== รูปบ้านในหน้าจอง (คำอธิบายรูป) =====
    'ห้องนอนบ้าน Lagoon เตียงใหญ่ มีแอร์': 'Lagoon cabin bedroom with a big bed and air-con',
    'วิวทะเลสาบหน้าที่พัก': 'Lake view in front of the cabins',
    'ระเบียงไม้หน้าบ้าน Lagoon 1 มีม้านั่งยาว โคมไฟสาน มองเห็นต้นไม้': 'Wooden veranda of Lagoon 1 with a long bench and woven lamp, looking out to the trees',
    'บ้านไม้ทรงไทย Lagoon 1 ยกพื้น มีบันไดและระเบียงหน้าบ้าน': 'Lagoon 1, a raised Thai-style wooden cabin with steps and a front veranda',
    'ห้องนอน Lagoon 1 เตียงใหญ่ ผนังและฝ้าไม้ มีแอร์': 'Lagoon 1 bedroom with a big bed, wooden walls and ceiling, and air-con',
    'ห้องน้ำในตัวบ้าน Lagoon 1 ผนังกระเบื้องขาวดำ': 'Lagoon 1 private bathroom with black-and-white tiles',
    'วิวสนามหญ้าและทะเลสาบจากม้านั่งระเบียงบ้าน Lagoon 2': 'View of the lawn and lake from the Lagoon 2 veranda bench',
    'บ้านไม้ทรงไทย Lagoon 2 ระเบียงกว้าง ท่ามกลางต้นปาล์ม': 'Lagoon 2, a Thai-style wooden cabin with a wide veranda among palm trees',
    'ห้องนอน Lagoon 2 เตียงใหญ่ ผนังไม้ มีแอร์ ห้องน้ำในตัว': 'Lagoon 2 bedroom with a big bed, wooden walls, air-con and a private bathroom',
    'ห้องน้ำในตัวบ้าน Lagoon 2 กระเบื้องสีเทา': 'Lagoon 2 private bathroom with grey tiles',
    'บ้านไม้ Lagoon เรียงกันริมสนามหญ้า': 'Lagoon wooden cabins in a row along the lawn',
    'สนามหญ้าและต้นไม้ใหญ่ริมทะเลสาบในรีสอร์ท': 'Lawn and big trees by the lake in the resort',
    'บ้านไม้ Lagoon Family 1 ระเบียงกว้าง มีเรือแคนูหน้าบ้าน': 'Lagoon Family 1 wooden cabin with a wide veranda and a canoe out front',
    'ห้องนอน Family 1 เตียง 2 เตียง ผนังไม้ มีแอร์': 'Family 1 bedroom with 2 beds, wooden walls and air-con',
    'ห้องนอน Family 1 มีตู้เย็นและโต๊ะเครื่องแป้ง': 'Family 1 bedroom with a fridge and dressing table',
    'ถนนริมทะเลสาบใกล้ที่พัก ร่มไม้ใหญ่': 'Shady lakeside road near the cabins',
    'วิวจากระเบียง Family 2 เห็นชิงช้าและทะเลสาบ': 'View from the Family 2 veranda over the swing and lake',
    'บ้านไม้ 2 ชั้น Lagoon Family 2 ตอนกลางวัน ใต้ถุนมีโต๊ะนั่งเล่น': 'Lagoon Family 2, a 2-storey wooden house by day, with a table underneath',
    'ห้องนอน Family 2 เตียงใหญ่ มีแอร์': 'Family 2 bedroom with a big bed and air-con',
    'บ้านไม้ 2 ชั้น Lagoon Family 2 เปิดไฟยามค่ำ': 'Lagoon Family 2, a 2-storey wooden house lit up at night',
    'โต๊ะหินอ่อนหน้าห้อง Studio มองเห็นสนามหญ้าและทะเลสาบ': 'Marble table outside the Studio, looking over the lawn and lake',
    'บ้าน Lagoon Studio ประตูกระจกบานใหญ่ มีโต๊ะนั่งเล่นหน้าบ้าน': 'Lagoon Studio with big glass doors and a table out front',
    'ห้องนอน Studio เตียงไม้ใหญ่ พื้นกระเบื้อง มีแอร์ ตู้เย็น และกาต้มน้ำ': 'Studio bedroom with a big wooden bed, tiled floor, air-con, fridge and kettle',
    'ห้องน้ำในตัว Studio ผนังกระเบื้องลายหินอ่อน': 'Studio private bathroom with marble-look tiles',
  };

  // ---------- ทั้งกล่อง (ข้อความที่มีหลายท่อนต่อกัน แปลทีละท่อนแล้วอ่านไม่รู้เรื่อง) ----------
  // ฝั่งซ้าย = ข้อความไทยทั้งกล่องต่อกัน (ไม่มีเว้นวรรคระหว่างท่อน) · ฝั่งขวา = HTML ภาษาอังกฤษ
  const E = {
    'ฟรีเฉพาะลานกางเต็นท์': 'Free for<wbr> campers',
    'ลานกางเต็นท์ริมทะเลสาบ นายายอาม จันทบุรี': 'Lakeside campground in <span class="nw">Na Yai Am, Chanthaburi</span>',
    'เลือกได้ทั้งกางเต็นท์และบ้านพัก': 'Choose <span class="nw">camping</span><wbr> or <span class="nw">a cabin</span>',
    'จากกรุงเทพฯ ประมาณ 200 กม. ขับรถราว 3 ชั่วโมงจากตัวเมืองจันทบุรี ประมาณ 40 กม.': 'From Bangkok about <span class="nw">200 km</span>, a drive of about <span class="nw">3 hours</span><br>From Chanthaburi town about <span class="nw">40 km</span>',
  };

  // ---------- วันที่ ----------
  const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const MF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const EN_MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const EN_MF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW = { 'อา.': 'Sun', 'จ.': 'Mon', 'อ.': 'Tue', 'พ.': 'Wed', 'พฤ.': 'Thu', 'ศ.': 'Fri', 'ส.': 'Sat',
    'อาทิตย์': 'Sun', 'จันทร์': 'Mon', 'อังคาร': 'Tue', 'พุธ': 'Wed', 'พฤหัสบดี': 'Thu', 'พฤหัส': 'Thu', 'ศุกร์': 'Fri', 'เสาร์': 'Sat' };
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const msRe = MS.map(esc).join('|');
  const dowRe = 'อาทิตย์|จันทร์|อังคาร|พุธ|พฤหัสบดี|พฤหัส|ศุกร์|เสาร์|อา\\.|พฤ\\.|จ\\.|อ\\.|พ\\.|ศ\\.|ส\\.';
  const year = (y) => (y ? ' ' + (Number(y) - 543) : '');
  const DATE_RULES = [
    // "อ. 10 พ.ย. 2569" / "อังคาร 10 พ.ย. 2569" / "อ. 10 พ.ย."
    [new RegExp(`(?:(${dowRe}) )?(\\d{1,2}) (${msRe})(?: (\\d{4}))?`, 'g'),
      (m, d, day, mon, y) => `${d ? DOW[d] + ' ' : ''}${day} ${EN_MS[MS.indexOf(mon)]}${year(y)}`],
    // "พฤศจิกายน 2569"
    [new RegExp(`(${MF.join('|')})(?: (\\d{4}))?`, 'g'), (m, mon, y) => `${EN_MF[MF.indexOf(mon)]}${year(y)}`],
  ];

  const n = (x, one, many) => `${x} ${Number(String(x).replace(/,/g, '')) === 1 ? one : many}`;
  // ---------- ข้อความที่มีตัวเลขเปลี่ยนไปมา (ทั้งประโยค) ----------
  const RULES = [
    [/^ดูภาพขยาย: (.+)$/, (m, a) => 'View larger: ' + (tr(a) || a)],
    [/^รูป (.+) ปัดซ้ายขวาเพื่อดูรูปถัดไป$/, '$1 photos, swipe left or right'],
    [/^เลือกแล้ว (.+?)( \(ถูกจองแล้ว\))?$/, (m, h, b) => `Selected ${h}${b ? ' (booked)' : ''}`],
    [/^เลือก (.+?)( \(ถูกจองแล้ว\))?$/, (m, h, b) => `Select ${h}${b ? ' (booked)' : ''}`],
    [/^พักได้ (\d+) ท่าน$/, 'Sleeps $1'],
    [/^(\d+) ท่าน$/, (m, q) => n(q, 'person', 'people')],
    [/^(\d+) หลัง$/, (m, q) => n(q, 'tent', 'tents')],
    [/^([\d,]+) บาท$/, '$1 THB'],
    [/^([\d,]+) บาท\/คืน$/, '$1 THB/night'],
    [/^(\d+) คืน$/, (m, x) => n(x, 'night', 'nights')],
    [/^(\d+) คืน · รวม ([\d,]+) บาท$/, (m, x, t) => `${n(x, 'night', 'nights')} · total ${t} THB`],
    [/^(\d+) คืน · ([\d,]+) บาท$/, (m, x, t) => `${n(x, 'night', 'nights')} · ${t} THB`],
    [/^(\d+) คืน · รวม (\d+) ท่าน$/, (m, x, g) => `${n(x, 'night', 'nights')} · ${n(g, 'guest', 'guests')} in total`],
    [/^(\d+) (ท่าน|หลัง) × ([\d,]+) บาท × (\d+) คืน = ([\d,]+) บาท$/, (m, q, u, p, x, t) => `${n(q, u === 'ท่าน' ? 'person' : 'tent', u === 'ท่าน' ? 'people' : 'tents')} × ${p} THB × ${n(x, 'night', 'nights')} = ${t} THB`],
    [/^นำเต็นท์มาเอง:? (\d+) ท่าน$/, (m, q) => `Own tent: ${n(q, 'person', 'people')}`],
    [/^เต็นท์มาเอง (\d+) ท่าน$/, (m, q) => `Own tent: ${n(q, 'person', 'people')}`],
    [/^เช่าเต็นท์หลังใหญ่:? (\d+) หลัง$/, (m, q) => `Large rental tent × ${q}`],
    [/^เช่าเต็นท์หลังเล็ก:? (\d+) หลัง$/, (m, q) => `Small rental tent × ${q}`],
    [/^เช่าเต็นท์หลังใหญ่ (\d+) หลัง · หลังเล็ก (\d+) หลัง$/, 'Large rental tent × $1 · small × $2'],
    [/^(\d+) ท่านในบ้าน$/, (m, q) => `${n(q, 'guest', 'guests')} in cabins`],
    [/^\(2 ท่าน\/หลัง\)$/, '(2 per tent)'],
    [/^(.+) \(ตั้งแต่ (\d\d:\d\d)\)$/, (m, d, t) => `${tr(d) || d} (from ${t})`],
    [/^(.+) \(ก่อน (\d\d:\d\d)\)$/, (m, d, t) => `${tr(d) || d} (by ${t})`],
    [/^ว่าง (\d+) จาก (\d+) หลัง$/, '$1 of $2 cabins free'],
    [/^พบ (\d+) การจอง$/, (m, q) => `Found ${n(q, 'booking', 'bookings')}`],
    [/^อีก (\d+) วันถึงวันเข้าพัก$/, '$1 days until your stay'],
    [/^\(เหลืออีก (?:(\d+) ชม\. )?(\d+) นาที\)$/, (m, h, mi) => `(${h ? h + ' hr ' : ''}${mi} min left)`],
    [/^(.+) เวลา (\d\d:\d\d) น\.$/, (m, d, t) => `${tr(d) || d}, ${t}`],
    [/^มีการจองรอชำระ · ภายใน (\d\d:\d\d) น\.$/, 'Booking awaiting payment · pay by $1'],
    [/^บ้านที่เลือกรองรับได้ (\d+) ท่าน \(มากกว่านี้ เพิ่มคนได้ คนละ ([\d,]+) บาท มีที่นอนปิกนิกเสริม แจ้งทาง LINE หรือโทร ([\d-]+) หรือย้อนกลับไปเพิ่มเต็นท์\)$/,
      'The chosen cabins sleep $1 (more guests are $2 THB each with an extra picnic mattress; tell us on LINE or call $3, or go back and add tents)'],
    [/^จำนวนคนพักในบ้านใส่ได้ (\d+)–(\d+) ท่าน$/, 'Guests in the cabin: $1–$2'],
    [/^หลัง (\d+):00 น\. จองเข้าพักคืนนี้ทางเว็บไม่ได้ กรุณาเลือกวันเช็กอินตั้งแต่ (.+) \(เข้าพักคืนนี้ โทร ([\d-]+)\)$/, (m, h, d, p) => `After ${h}:00, tonight can’t be booked online. Please choose check-in from ${tr(d) || d} (for tonight, call ${p})`],
    [/^เลือกวันที่ผ่านมาแล้วไม่ได้ กรุณาเลือกวันเช็กอินตั้งแต่ (.+)$/, (m, d) => `Past dates can’t be chosen. Please choose check-in from ${tr(d) || d}`],
    [/^หลัง (\d+):00 น\. จองเข้าพักคืนนี้ทางเว็บไม่ได้ กรุณาโทร$/, 'After $1:00, tonight can’t be booked online. Please call'],
    [/^หลัง (\d+):00 น\. จองเข้าพักคืนนี้ทางเว็บไม่ได้ กรุณาโทร ([\d-]+) หรือทัก LINE (\S+)$/, 'After $1:00, tonight can’t be booked online. Please call $2 or message LINE $3'],
    [/^หรือทัก$/, 'or message'],
    [/^หรือโทร ([\d-]+) \(จองทางเว็บได้ไม่เกิน (\d+) ท่าน\) หรือย้อนกลับไปเลือกบ้านหรือเต็นท์เพิ่ม$/, 'or call $1 (online bookings are limited to $2 guests), or go back and add a cabin or tents'],
    [/^เช็กวันว่างไม่สำเร็จ กรุณาลองใหม่ หรือโทรจอง ([\d-]+)$/, 'Couldn’t check availability. Please try again or call $1 to book'],
    [/^ส่งการจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือโทรจอง ([\d-]+)$/, 'Couldn’t send the booking. Please try again or call $1 to book'],
    [/^ขออภัย (.+) เพิ่งถูกจองไปในวันที่เลือก กรุณาเลือกบ้านหรือวันใหม่$/, 'Sorry, $1 was just booked for these dates. Please choose another cabin or dates.'],
    [/^บ้านที่เลือกพักได้สูงสุด (\d+) ท่าน ถ้ามา (\d+) ท่าน เพิ่มคนได้ คนละ ([\d,]+) บาท \(มีที่นอนปิกนิกเสริม\) กรุณาแจ้งทาง$/, 'The chosen cabins sleep up to $1. For $2 guests, extra people are $3 THB each (with an extra picnic mattress). Please tell us on'],
    [/^([\d,]+) บาท — ชำระวันเช็กอิน \(เงินสดหรือโอนหน้าเคาน์เตอร์\)$/, '$1 THB, paid on check-in day (cash or transfer at the counter)'],
    [/^ชำระเต็มจำนวน: ไม่ต้องจ่ายเพิ่มวันเช็กอิน · หากยกเลิกหรือไม่มาเข้าพัก ไม่คืนมัดจำ 50% แต่ได้รับเงินคืนส่วนที่เกินมัดจำ ([\d,]+) บาท \(50% ของยอดจอง\) แอดมินโอนคืนให้ · งดใช้เสียงหลัง 22:00 น\.$/,
      'Paid in full: nothing more to pay at check-in · If you cancel or don’t show up, the 50% deposit is not refunded, but the part above the deposit, $1 THB (50% of the booking), is refunded by transfer from our admin · Quiet after 22:00.'],
    [/^(?:โหลด QR |สร้างรูป)ไม่สำเร็จ — โอนเข้าพร้อมเพย์ (\S+) ยอด ([\d,]+) บาท$/, 'Couldn’t load the QR. Transfer $2 THB to PromptPay $1'],
    [/^ได้รับเงินคืน 50% ของยอดจอง \(([\d,]+) บาท\) · (คืนเงินแล้ว|แอดมินจะโอนคืนให้)$/, (m, a, s) => `50% of the booking refunded (${a} THB) · ${s === 'คืนเงินแล้ว' ? 'refund sent' : 'our admin will transfer it'}`],
    [/^([\d,]+) บาท \(เงินสดหรือโอนหน้าเคาน์เตอร์\)$/, '$1 THB (cash or transfer at the counter)'],
    [/^โอน ([\d,]+) บาท(?: ภายใน (.+?))? แล้วส่งสลิปทาง LINE (\S+)$/, (m, a, w, l) => `Transfer ${a} THB${w ? ' by ' + (tr(w) || w) : ''}, then send the slip on LINE ${l}`],
    [/^ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้ง หรือทัก LINE (\S+)$/, 'Temporary system problem. Try again or message LINE $1'],
    [/^ระบบเช็กการจองยังไม่พร้อมใช้งาน กรุณาทัก LINE (\S+) หรือโทร ([\d-]+)$/, 'Booking lookup isn’t available yet. Please message LINE $1 or call $2'],
    [/^เชื่อมต่อระบบไม่สำเร็จ ลองใหม่อีกครั้ง หรือโทร ([\d-]+)$/, 'Couldn’t connect. Try again or call $1'],
    [/^โทร ([\d-]+)$/, 'Call $1'],
    // รายละเอียดการจอง ทีละบรรทัด "หัวข้อ: ค่า"
    [/^(บ้าน|นำเต็นท์มาเอง|เช่าเต็นท์หลังใหญ่|เช่าเต็นท์หลังเล็ก|เช็กอิน|เช็กเอาต์|ยอดรวม|ชื่อ|เบอร์|หมายเหตุ|รหัสการจอง|ยอดมัดจำ 50%|ยอดชำระเต็มจำนวน|พร้อมเพย์|ชำระภายใน|สถานะ|ที่พัก|แผนที่|โทร): (.+)$/,
      (m, k, v) => `${LABELS[k]}: ${TH.test(v) ? tr(v) || v : v}`],
    [/^(.+) \((\d+) ท่าน\)$/, (m, a, q) => `${tr(a) || a} (${n(q, 'guest', 'guests')})`],
    [/^ประมาณ (\d+) กิโลเมตร ขับรถประมาณ (\d+) นาที$/, 'About $1 kilometres, about a $2-minute drive'],
  ];
  const LABELS = { 'บ้าน': 'Cabins', 'นำเต็นท์มาเอง': 'Own tent', 'เช่าเต็นท์หลังใหญ่': 'Large rental tents', 'เช่าเต็นท์หลังเล็ก': 'Small rental tents',
    'เช็กอิน': 'Check-in', 'เช็กเอาต์': 'Check-out', 'ยอดรวม': 'Total', 'ชื่อ': 'Name', 'เบอร์': 'Phone', 'หมายเหตุ': 'Note', 'รหัสการจอง': 'Booking ID',
    'ยอดมัดจำ 50%': '50% deposit', 'ยอดชำระเต็มจำนวน': 'Full payment', 'พร้อมเพย์': 'PromptPay', 'ชำระภายใน': 'Pay by', 'สถานะ': 'Status', 'ที่พัก': 'Stay', 'แผนที่': 'Map', 'โทร': 'Call' };
  // คำย่อยที่ใช้แทนในข้อความยาว (หลังจากลองแบบตรงตัวและแบบทั้งประโยคแล้ว)
  const PIECES = [
    [/จองทางเว็บไม่ได้/g, 'not bookable online'],
    [/เต็มทุกหลัง/g, 'all cabins booked'],
    [/ว่าง (\d+) จาก (\d+) หลัง/g, '$1 of $2 cabins free'],
    [/วันเช็กอิน/g, 'check-in'],
    [/วันเช็กเอาต์/g, 'check-out'],
    [/อยู่ในช่วงที่เลือก/g, 'in your stay'],
    [/ถูกจองแล้ว/g, 'booked'],
    [/เลือกแล้ว/g, 'selected'],
    [/([\d,]+) บาท\/คืน/g, '$1 THB/night'],
    [/ ว่าง( |$)/g, ' free$1'],
  ];

  const TH = /[\u0e00-\u0e7f]/;
  const norm = (s) => s.replace(/[\u2060\u200b\u00ad]/g, '').replace(/\s+/g, ' ').trim();
  const misses = new Set();

  function tr(raw) {
    const k = norm(raw);
    if (!TH.test(k)) return null;
    if (Object.prototype.hasOwnProperty.call(D, k)) return D[k];
    // ข้อความหลายบรรทัด / คั่นด้วย " · " หรือ ", " → แปลทีละส่วน
    if (/\n/.test(raw)) {
      const parts = raw.split('\n').map((l) => (TH.test(l) ? tr(l) || l : l));
      return parts.join('\n');
    }
    let out = k;
    for (const [re, rep] of DATE_RULES) out = out.replace(re, rep);
    if (out !== k && !TH.test(out)) return out;
    if (Object.prototype.hasOwnProperty.call(D, out)) return D[out];
    for (const [re, rep] of RULES) if (re.test(out)) return out.replace(re, rep);
    for (const sep of [' · ', ', ']) {
      if (out.includes(sep)) {
        const parts = out.split(sep).map((p) => (TH.test(p) ? tr(p) : p));
        if (parts.every((p) => p !== null)) return parts.join(sep);
      }
    }
    for (const [re, rep] of PIECES) out = out.replace(re, rep);
    if (TH.test(out)) misses.add(k);
    return out !== k ? out : null;
  }

  // ---------- เปลี่ยนข้อความบนหน้า ----------
  const ATTRS = ['alt', 'title', 'aria-label', 'placeholder'];
  const textLog = new Map(); // text node → { th, en }
  const attrLog = new Map(); // element → { attr: { th, en } }
  const SKIP = 'script,style,textarea,[data-i18n-skip],[translate="no"]';
  let observer = null;
  let active = false;

  function doText(node) {
    const v = node.nodeValue;
    if (!v || !TH.test(v)) return;
    const pa = node.parentElement;
    if (!pa || pa.closest(SKIP)) return;
    const rec = textLog.get(node);
    if (rec && rec.en === v) return;
    const en = tr(v);
    if (en == null) return;
    const lead = v.match(/^\s*/)[0];
    const trail = v.match(/\s*$/)[0];
    const out = /\n/.test(v) ? en : lead + en + trail;
    textLog.set(node, { th: v, en: out });
    node.nodeValue = out;
  }
  const SKIP_ATTR = 'script,style,[data-i18n-skip],[translate="no"]';
  function doAttrs(el) {
    if (el.closest(SKIP_ATTR)) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v || !TH.test(v)) continue;
      const recs = attrLog.get(el) || {};
      if (recs[a] && recs[a].en === v) continue;
      const en = tr(v);
      if (en == null) continue;
      recs[a] = { th: v, en };
      attrLog.set(el, recs);
      el.setAttribute(a, en);
    }
  }
  const elemLog = new Map(); // element → { th, en } (innerHTML)
  function doElems(root) {
    if (root.nodeType !== 1) return;
    const els = [root, ...root.querySelectorAll('h1,h2,h3,p,li,em,span,strong,label,a,button')];
    for (const el of els) {
      if (!el.firstElementChild || el.closest(SKIP) || el.querySelector('[id],svg')) continue;
      const k = norm(el.textContent);
      if (!Object.prototype.hasOwnProperty.call(E, k)) continue;
      const th = el.innerHTML;
      el.innerHTML = E[k];
      elemLog.set(el, { th, en: el.innerHTML });
    }
  }
  function walk(root) {
    doElems(root);
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let t;
    const texts = [];
    while ((t = tw.nextNode())) texts.push(t);
    texts.forEach(doText);
    if (root.nodeType === 1) doAttrs(root);
    root.querySelectorAll('[alt],[title],[aria-label],[placeholder]').forEach(doAttrs);
  }

  // ข้อความเตือนของเบราว์เซอร์ (ฟองข้อความในช่องกรอก / alert) ก็แปลด้วย
  // (เก็บของเดิมแยกทีละชนิดช่อง — ใช้ของช่อง input กับ textarea ปนกันไม่ได้)
  const POPUP_OWNERS = [HTMLInputElement.prototype, HTMLTextAreaElement.prototype, HTMLSelectElement.prototype];
  const origValidity = POPUP_OWNERS.map((p) => p.setCustomValidity);
  const origAlert = window.alert;
  const wrap = (fn) => function (msg) { return fn.call(this, active && msg && TH.test(msg) ? tr(msg) || msg : msg); };
  const wrapped = origValidity.map(wrap);
  const wrappedAlert = wrap(origAlert);
  function patchPopups(on) {
    POPUP_OWNERS.forEach((p, i) => { p.setCustomValidity = on ? wrapped[i] : origValidity[i]; });
    window.alert = on ? wrappedAlert : origAlert;
  }

  function start(done) {
    active = true;
    patchPopups(true);
    walk(document.documentElement);
    if (!observer) {
      observer = new MutationObserver((list) => {
        for (const m of list) {
          if (m.type === 'childList') m.addedNodes.forEach(walk);
          else if (m.type === 'characterData') doText(m.target);
          else if (m.type === 'attributes') doAttrs(m.target);
        }
      });
    }
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    if (done) done();
  }
  // กลับเป็นภาษาไทย: ใส่ข้อความเดิมคืน (เฉพาะที่ยังเป็นคำแปลของเราอยู่)
  function stop() {
    active = false;
    patchPopups(false);
    if (observer) observer.disconnect();
    elemLog.forEach((r, el) => { if (el.innerHTML === r.en) el.innerHTML = r.th; });
    elemLog.clear();
    textLog.forEach((r, node) => { if (node.nodeValue === r.en) node.nodeValue = r.th; });
    attrLog.forEach((recs, el) => { for (const a in recs) if (el.getAttribute(a) === recs[a].en) el.setAttribute(a, recs[a].th); });
    textLog.clear();
    attrLog.clear();
  }

  window.LagoonI18n = { start, stop, tr, misses, dict: D };
})();
