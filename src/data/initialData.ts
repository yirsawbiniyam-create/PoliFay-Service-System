import { Department, Staff, CommissionSettings, Announcement } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'hr_dept',
    name: 'የሰዉ ሀብት አስተዳር ደጋፊ የስራ ሂደት',
    code: 'HR-01',
    icon: 'Users',
    roomNumber: 'ክፍል 101',
    active: true,
    order: 1,
  },
  {
    id: 'crime_prevention',
    name: 'ወንጀል መከላከል ዋና የስራ ሂደት',
    code: 'CP-02',
    icon: 'ShieldAlert',
    roomNumber: 'ክፍል 102',
    active: true,
    order: 2,
  },
  {
    id: 'complaints_legal',
    name: 'አቤ/መ/መ/ዋ/የስራ ሂደት',
    code: 'CPT-03',
    icon: 'FileText',
    roomNumber: 'ክፍል 103',
    active: true,
    order: 3,
  },
  {
    id: 'public_relations',
    name: 'ህዝ/ግን/ደ/የስራ ሂደት',
    code: 'PR-04',
    icon: 'Radio',
    roomNumber: 'ክፍል 104',
    active: true,
    order: 4,
  },
  {
    id: 'procurement_property',
    name: 'ግዥና ንብረት አስተዳደር ደ/የስራ ሂደት',
    code: 'PROC-05',
    icon: 'Package',
    roomNumber: 'ክፍል 105',
    active: true,
    order: 5,
  },
  {
    id: 'finance_dept',
    name: 'ፋይናንስ አስተዳደር ደ/የስራ ሂደት',
    code: 'FIN-06',
    icon: 'Landmark',
    roomNumber: 'ክፍል 106',
    active: true,
    order: 6,
  },
  {
    id: 'internal_audit',
    name: 'የዉስጥ ኦዲት ደ/የስራ ሂደት',
    code: 'AUD-07',
    icon: 'CheckSquare',
    roomNumber: 'ክፍል 107',
    active: true,
    order: 7,
  },
  {
    id: 'ethics_compliance',
    name: 'የስነምግባር ደ/የስራ ሂደት',
    code: 'ETH-08',
    icon: 'Scale',
    roomNumber: 'ክፍል 108',
    active: true,
    order: 8,
  },
  {
    id: 'special_office',
    name: 'የኮሚሽኑ ልዩ ጽ/ቤት',
    code: 'SP-09',
    icon: 'Award',
    roomNumber: 'ክፍል 201',
    active: true,
    order: 9,
  },
  {
    id: 'tech_datacenter',
    name: 'ቴክኖሎጂ ማስፋፊያና መረጃ ማዕከል',
    code: 'TECH-10',
    icon: 'Server',
    roomNumber: 'ክፍል 202',
    active: true,
    order: 10,
  },
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'POL-0192',
    badgeNumber: 'POL-0192',
    fullName: 'ኮማንደር ግርማይ አበራ',
    rank: 'ኮማንደር',
    departmentId: 'special_office',
    departmentName: 'የኮሚሽኑ ልዩ ጽ/ቤት',
    phone: '0911223344',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'on_duty',
    lastCheckIn: '08:42:15',
    active: true,
    registeredAt: '2026-01-10',
  },
  {
    id: 'POL-0481',
    badgeNumber: 'POL-0481',
    fullName: 'ዋና ኢንስፔክተር መሰረት ተስፋዬ',
    rank: 'ዋና ኢንስፔክተር',
    departmentId: 'crime_prevention',
    departmentName: 'ወንጀል መከላከል ዋና የስራ ሂደት',
    phone: '0912334455',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'on_duty',
    lastCheckIn: '08:35:20',
    active: true,
    registeredAt: '2026-01-12',
  },
  {
    id: 'POL-0753',
    badgeNumber: 'POL-0753',
    fullName: 'ኢንስፔክተር ዳዊት በቀለ',
    rank: 'ኢንስፔክተር',
    departmentId: 'tech_datacenter',
    departmentName: 'ቴክኖሎጂ ማስፋፊያና መረጃ ማዕከል',
    phone: '0922445566',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'on_duty',
    lastCheckIn: '08:48:10',
    active: true,
    registeredAt: '2026-01-15',
  },
  {
    id: 'POL-1104',
    badgeNumber: 'POL-1104',
    fullName: 'ረዳት ኢንስፔክተር ሰላማዊት ደምሴ',
    rank: 'ረዳት ኢንስፔክተር',
    departmentId: 'public_relations',
    departmentName: 'ህዝ/ግን/ደ/የስራ ሂደት',
    phone: '0933556677',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'off_duty',
    active: true,
    registeredAt: '2026-01-18',
  },
  {
    id: 'POL-1422',
    badgeNumber: 'POL-1422',
    fullName: 'ዋና ሳጅን ጥላሁን ካሳሁን',
    rank: 'ዋና ሳጅን',
    departmentId: 'hr_dept',
    departmentName: 'የሰዉ ሀብት አስተዳር ደጋፊ የስራ ሂደት',
    phone: '0944667788',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'off_duty',
    active: true,
    registeredAt: '2026-01-20',
  },
  {
    id: 'POL-1890',
    badgeNumber: 'POL-1890',
    fullName: 'ሳጅን አለምፀሐይ ሞላ',
    rank: 'ሳጅን',
    departmentId: 'complaints_legal',
    departmentName: 'አቤ/መ/መ/ዋ/የስራ ሂደት',
    phone: '0955778899',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'on_duty',
    lastCheckIn: '08:52:00',
    active: true,
    registeredAt: '2026-01-22',
  },
];

// Official SVG vector logo for Ethiopian Police Commission with golden wreath, eagle, scales of justice, star
export const DEFAULT_POLICE_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="goldGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23fde047"/>
      <stop offset="60%" stop-color="%23d97706"/>
      <stop offset="100%" stop-color="%2378350f"/>
    </radialGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%230f285a"/>
      <stop offset="100%" stop-color="%23051026"/>
    </linearGradient>
  </defs>
  <!-- Outer Gold Laurel Ring -->
  <circle cx="100" cy="100" r="92" fill="%230a1931" stroke="url(%23goldGrad)" stroke-width="7"/>
  <circle cx="100" cy="100" r="82" fill="none" stroke="%23d97706" stroke-width="2" stroke-dasharray="4,3"/>
  <!-- Police Shield -->
  <path d="M100 25 L155 45 C155 110 130 155 100 175 C70 155 45 110 45 45 Z" fill="url(%23shieldGrad)" stroke="url(%23goldGrad)" stroke-width="4"/>
  <!-- Scales of Justice -->
  <path d="M100 50 L100 125 M80 65 L120 65 M70 85 L90 85 L80 65 Z M110 85 L130 85 L120 65 Z" stroke="%23fbbf24" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Central Golden Star -->
  <polygon points="100,85 104,97 116,97 106,105 110,117 100,109 90,117 94,105 84,97 96,97" fill="%23fbbf24" stroke="%23d97706" stroke-width="1"/>
  <!-- Ethiopian Flag Strip at bottom of shield -->
  <rect x="75" y="140" width="50" height="4" fill="%2316a34a"/>
  <rect x="75" y="144" width="50" height="4" fill="%23eab308"/>
  <rect x="75" y="148" width="50" height="4" fill="%23dc2626"/>
  <!-- Text Ring -->
  <text x="100" y="20" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23fbbf24" text-anchor="middle">ETHIOPIAN POLICE</text>
  <text x="100" y="194" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23fbbf24" text-anchor="middle">የኢትዮጵያ ፖሊስ</text>
</svg>`;

// Official Vector Logo for Benishangul-Gumuz Region Police Commission
export const BENISHANGUL_GUMUZ_POLICE_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="bgGold" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="%23fef08a"/>
      <stop offset="65%" stop-color="%23eab308"/>
      <stop offset="100%" stop-color="%23854d0e"/>
    </radialGradient>
    <linearGradient id="bgShield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%230b1e3b"/>
      <stop offset="100%" stop-color="%23020617"/>
    </linearGradient>
  </defs>
  <!-- Outer Ring with Region Colors -->
  <circle cx="100" cy="100" r="94" fill="%23020617" stroke="url(%23bgGold)" stroke-width="7"/>
  <circle cx="100" cy="100" r="84" fill="none" stroke="%23ca8a04" stroke-width="2"/>
  <!-- Shield of Law & Order -->
  <path d="M100 28 L154 48 C154 112 128 155 100 173 C72 155 46 112 46 48 Z" fill="url(%23bgShield)" stroke="url(%23bgGold)" stroke-width="4"/>
  <!-- Scales of Justice -->
  <path d="M100 50 L100 120 M78 64 L122 64 M68 84 L88 84 L78 64 Z M112 84 L132 84 L122 64 Z" stroke="%23facc15" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Benishangul-Gumuz Tricolor + Red Triangle Ribbon in shield -->
  <rect x="72" y="132" width="56" height="5" fill="%23000000"/>
  <rect x="72" y="137" width="56" height="5" fill="%23ffcc00"/>
  <rect x="72" y="142" width="56" height="5" fill="%23009933"/>
  <polygon points="72,132 88,139.5 72,147" fill="%23dc2626"/>
  <!-- Central Golden Star -->
  <polygon points="100,82 103,93 115,93 105,100 109,112 100,104 91,112 95,100 85,93 97,93" fill="%23facc15" stroke="%23ca8a04" stroke-width="1.2"/>
  <!-- Arching Text: የቤ/ጉ/ክ/ፖሊስ ኮሚሽን -->
  <text x="100" y="21" font-family="sans-serif" font-size="10.5" font-weight="900" fill="%23fef08a" text-anchor="middle">የቤ/ጉ/ክ/ፖሊስ ኮሚሽን</text>
  <text x="100" y="193" font-family="sans-serif" font-size="9.5" font-weight="800" fill="%23fde047" text-anchor="middle">BGRS POLICE COMMISSION</text>
</svg>`;

// Official Vector for Benishangul-Gumuz Regional State Flag (Black, Yellow, Green with Red triangle)
export const BENISHANGUL_GUMUZ_FLAG_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 180" width="300" height="180">
  <!-- Horizontal Tricolor: Top Black, Middle Yellow, Bottom Green -->
  <rect x="0" y="0" width="300" height="60" fill="%23000000"/>
  <rect x="0" y="60" width="300" height="60" fill="%23ffcc00"/>
  <rect x="0" y="120" width="300" height="60" fill="%23009933"/>
  <!-- Red Isosceles Triangle on hoist -->
  <polygon points="0,0 100,90 0,180" fill="%23cc0000"/>
</svg>`;

// Official Vector for Ethiopian National Flag (Green, Yellow, Red with Blue disc & Gold Star)
export const ETHIOPIAN_FLAG_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 180" width="300" height="180">
  <rect width="300" height="60" fill="%23009b48"/>
  <rect y="60" width="300" height="60" fill="%23fed100"/>
  <rect y="120" width="300" height="60" fill="%23e4002b"/>
  <!-- Blue Disc -->
  <circle cx="150" cy="90" r="42" fill="%230f47af"/>
  <!-- 5-Pointed Radiant Yellow Star -->
  <polygon points="150,56 153.5,69.5 167,69.5 156,77.5 160,91 150,82.5 140,91 144,77.5 133,69.5 146.5,69.5" fill="%23fed100"/>
  <line x1="150" y1="82" x2="150" y2="98" stroke="%23fed100" stroke-width="2.5"/>
  <line x1="144" y1="80" x2="132" y2="92" stroke="%23fed100" stroke-width="2.5"/>
  <line x1="156" y1="80" x2="168" y2="92" stroke="%23fed100" stroke-width="2.5"/>
  <line x1="146" y1="73" x2="134" y2="67" stroke="%23fed100" stroke-width="2.5"/>
  <line x1="154" y1="73" x2="166" y2="67" stroke="%23fed100" stroke-width="2.5"/>
</svg>`;

// Combined Dual Flags: Ethiopian Flag + Benishangul-Gumuz Flag side-by-side
export const COMBINED_FLAGS_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="320" height="160">
  <!-- Left: Ethiopian National Flag -->
  <g transform="translate(10, 15) scale(0.46)">
    <rect width="300" height="60" fill="%23009b48" stroke="%23444" stroke-width="1"/>
    <rect y="60" width="300" height="60" fill="%23fed100"/>
    <rect y="120" width="300" height="60" fill="%23e4002b"/>
    <circle cx="150" cy="90" r="42" fill="%230f47af"/>
    <polygon points="150,56 153.5,69.5 167,69.5 156,77.5 160,91 150,82.5 140,91 144,77.5 133,69.5 146.5,69.5" fill="%23fed100"/>
  </g>
  <!-- Right: Benishangul-Gumuz Regional Flag -->
  <g transform="translate(165, 15) scale(0.46)">
    <rect x="0" y="0" width="300" height="60" fill="%23000000" stroke="%23444" stroke-width="1"/>
    <rect x="0" y="60" width="300" height="60" fill="%23ffcc00"/>
    <rect x="0" y="120" width="300" height="60" fill="%23009933"/>
    <polygon points="0,0 100,90 0,180" fill="%23cc0000"/>
  </g>
  <!-- Labels -->
  <text x="80" y="125" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23facc15" text-anchor="middle">ኢትዮጵያ</text>
  <text x="235" y="125" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23facc15" text-anchor="middle">ቤኒሻንጉል ጉሙዝ</text>
  <text x="160" y="150" font-family="sans-serif" font-size="10" font-weight="bold" fill="%2394a3b8" text-anchor="middle">ጥምር ሰንደቆች</text>
</svg>`;

// Preset Logos for the Media Gallery
export const LOGO_GALLERY_PRESETS = [
  {
    id: 'bg_police_official',
    title: 'የቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን ይፋዊ አርማ (Official BGRS Police Logo)',
    category: 'ክልላዊ ፖሊስ',
    description: 'የቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን ኦፊሴላዊ ወርቃማ ማህተም እና ሰንደቅ ያካተተ ሎጎ',
    url: BENISHANGUL_GUMUZ_POLICE_LOGO_SVG,
    isOfficial: true,
  },
  {
    id: 'eth_police_gold',
    title: 'የኢትዮጵያ ፖሊስ ኮሚሽን ወርቃማ አርማ (National Gold Police Emblem)',
    category: 'ፌዴራል/ብሔራዊ',
    description: 'የኢትዮጵያ ፖሊስ ክላሲክ የወርቅ የአንበሳ እና የህግ ሚዛን ማህተም',
    url: DEFAULT_POLICE_LOGO_SVG,
    isOfficial: false,
  },
  {
    id: 'fed_police_seal',
    title: 'የፌዴራል ፖሊስ ኮሚሽን አርማ (Federal Police Seal)',
    category: 'ፌዴራል',
    description: 'የኢፌዲሪ ፌዴራል ፖሊስ ይፋዊ ማህተም',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80',
    isOfficial: false,
  },
  {
    id: 'assosa_police_division',
    title: 'የአሶሳ ዞን እና ክልላዊ ፖሊስ መምሪያ (Regional Division Seal)',
    category: 'ክልላዊ',
    description: 'የአሶሳና መተከል ዞኖች የተቀናጀ የፖሊስ ኮሚሽን ልዩ ባጅ',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&auto=format&fit=crop&q=80',
    isOfficial: false,
  },
];

// Preset Flags for the Media Gallery
export const FLAG_GALLERY_PRESETS = [
  {
    id: 'bg_regional_flag',
    title: 'የቤኒሻንጉል ጉሙዝ ክልል ሰንደቅ ዓላማ (Benishangul-Gumuz Regional Flag)',
    category: 'ክልላዊ ሰንደቅ',
    description: 'የቤኒሻንጉል ጉሙዝ ብሔራዊ ክልላዊ መንግሥት ይፋዊ ሰንደቅ ዓላማ (ጥቁር፣ ቢጫ፣ አረንጓዴ ከቀይ ሶስት ማዕዘን)',
    url: BENISHANGUL_GUMUZ_FLAG_SVG,
    isOfficial: true,
  },
  {
    id: 'eth_national_flag',
    title: 'የኢትዮጵያ ሰንደቅ ዓላማ (Ethiopian National Flag)',
    category: 'ብሔራዊ ሰንደቅ',
    description: 'የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ ብሔራዊ ሰንደቅ ዓላማ (አረንጓዴ፣ ቢጫ፣ ቀይ ከኮከብ ማህተም ጋር)',
    url: ETHIOPIAN_FLAG_SVG,
    isOfficial: true,
  },
  {
    id: 'combined_eth_bg_flags',
    title: 'ጥምር የኢትዮጵያ እና የቤኒሻንጉል ጉሙዝ ሰንደቅ (Combined Dual Flags)',
    category: 'ጥምር ሰንደቅ',
    description: 'የኢትዮጵያ ሰንደቅ ዓላማ እና የቤኒሻንጉል ጉሙዝ ክልል ሰንደቅ ዓላማ ጎን ለጎን',
    url: COMBINED_FLAGS_SVG,
    isOfficial: true,
  },
];

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
  commissionName: 'የቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን',
  logoUrl: BENISHANGUL_GUMUZ_POLICE_LOGO_SVG,
  flagUrl: ETHIOPIAN_FLAG_SVG,
  regionalFlagUrl: BENISHANGUL_GUMUZ_FLAG_SVG,
  motto: 'በጀግንነት መጠበቅ በሰብአዊነት ማገልገል',
  morningStart: '08:30', // 2:30 Ethiopian
  morningDeadline: '09:00', // 3:00 Ethiopian
  eveningExitTime: '17:00', // 11:00 Ethiopian
  updatedAt: new Date().toISOString(),
};

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'የዲጂታል መታወቂያ እና የፋይዳ ስካን መመሪያ',
    message: 'ሁሉም የኮሚሽኑ ሰራተኞች በጠዋት ከ 2፡30 እስከ 3፡00 ባለው ሰዓት የፖሊስ ዲጂታል መታወቂያቸውን ከጀርባ ስካን አድርገው እንዲገቡ፤ ባለጉዳዮችም የፋይዳ ዲጂታል መታወቂያቸውን ስካን አድርገው እንዲስተናገዱ በጥብቅ እናሳስባለን።',
    priority: 'broadcast',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ann-2',
    title: 'የስነምግባር እና ቅልጥፍና ማሳሰቢያ',
    message: 'ተገልጋዮች ጉዳያቸውን ፈጽመው ሲወጡ የቅሬታ እና የእርካታ አስተያየት እንዲሰጡ መተባበር የሁሉም ክፍል ኃላፊዎችና ሰራተኞች ግዴታ ነው።',
    priority: 'normal',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

// Sample Pre-registered Fayda IDs for fast testing / demonstration
export const SAMPLE_FAYDA_CITIZENS = [
  {
    faydaId: 'FIN-ET-8942-0192',
    nationalId: '894201925641',
    fullName: 'አቶ አበበ ከበደ በቀለ',
    englishName: 'Abebe Kebede Bekele',
    gender: 'ወንድ (Male)',
    address: 'አሶሳ ከተማ፣ ቀበሌ 02፣ ቤኒሻንጉል ጉሙዝ',
    phone: '0911889900',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    purpose: 'የጣት አሻራ እና የነጻ ወንጀል ማረጋገጫ ምስክር ወረቀት ለመውሰድ',
  },
  {
    faydaId: 'FIN-ET-4721-8830',
    nationalId: '472188301192',
    fullName: 'ወ/ሮ ትዕግስት ኃይሌ አስፋው',
    englishName: 'Tigist Haile Asfaw',
    gender: 'ሴት (Female)',
    address: 'ባምባሲ ከተማ፣ ቀበሌ 01፣ ቤኒሻንጉል ጉሙዝ',
    phone: '0922334455',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    purpose: 'የአቤቱታ ማመልከቻ ለማቅረብ',
  },
  {
    faydaId: 'FIN-ET-6610-3329',
    nationalId: '661033298412',
    fullName: 'አቶ ዳንኤል ታደሰ ወርቁ',
    englishName: 'Daniel Tadesse Worku',
    gender: 'ወንድ (Male)',
    address: 'መተከል ዞን፣ ቻግኒ/ግልገል በለስ፣ ቤኒሻንጉል ጉሙዝ',
    phone: '0933445566',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    purpose: 'የግል ጥበቃ ፍቃድ ለማደስ',
  },
  {
    faydaId: 'FIN-ET-5190-2810',
    nationalId: '519028107765',
    fullName: 'ወ/ሪት ቤተልሔም ሰለሞን ተፈራ',
    englishName: 'Betelhem Solomon Tefera',
    gender: 'ሴት (Female)',
    address: 'ኩርሙክ ወረዳ፣ ቤኒሻንጉል ጉሙዝ',
    phone: '0944556677',
    photoUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&auto=format&fit=crop&q=80',
    purpose: 'የጠፋ የይለፍ ቃል ፖሊስ ሪፖርት ለመቀበል',
  },
  {
    faydaId: 'FIN-ET-3021-9944',
    nationalId: '302199441209',
    fullName: 'አቶ ዑስማን ሙሐመድ አሊ',
    englishName: 'Osman Mohammed Ali',
    gender: 'ወንድ (Male)',
    address: 'ካማሺ ዞን፣ ቤኒሻንጉል ጉሙዝ',
    phone: '0955667788',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    purpose: 'የትራፊክ አደጋ የካሳ ሰነድ ለማረጋገጥ',
  },
];
