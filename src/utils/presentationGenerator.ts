import PptxGenJS from 'pptxgenjs';
import { CommissionSettings } from '../types';

export interface PresentationSlideCard {
  heading: string;
  items: string[];
  accent?: 'amber' | 'emerald' | 'cyan' | 'rose';
}

export interface SystemSlideData {
  id: number;
  tag: string;
  title: string;
  subtitle?: string;
  layout: 'cover' | 'cards' | 'two_col' | 'table';
  cards?: PresentationSlideCard[];
  leftTitle?: string;
  leftItems?: string[];
  rightTitle?: string;
  rightItems?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
  highlightBox?: string;
}

export const SYSTEM_SLIDES: SystemSlideData[] = [
  {
    id: 1,
    tag: 'ስላይድ 1 • ርዕስ እና ስያሜ',
    title: 'የፖሊስ እና የፋይዳ ዲጂታል መስተንግዶ ሲስተም',
    subtitle: 'Police & Fayda Digital Hospitality, Attendance, Citizen Feedback & 100% Performance Evaluation System',
    layout: 'cover',
    highlightBox: 'የቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን • «በሰብዓዊነት ማገልገል በጀግንነት መጠበቅ»',
  },
  {
    id: 2,
    tag: 'ስላይድ 2 • መነሻ ሁኔታ',
    title: 'መነሻ ሁኔታ እና የነበሩ ተግዳሮቶች',
    subtitle: 'ለምን ይህ ዲጂታል ሲስተም አስፈለገ?',
    layout: 'cards',
    cards: [
      {
        heading: 'የሰዓት አክባሪነትና አቴንዳንስ ችግር',
        accent: 'rose',
        items: [
          'የሰራተኞች መግቢያና መውጫ በወረቀት ፊርማ መዝገብ ስለነበረ በትክክል ለመለካት አዳጋች ነበር።',
          'የጠዋት መግቢያ (2፡30–3፡00) እና የመውጫ ሰዓት (11፡00+) በራስ-ሰር አይገመገምም ነበር።',
        ],
      },
      {
        heading: 'የባለጉዳይ ምዝገባና ታሪክ መጥፋት',
        accent: 'amber',
        items: [
          'ባለጉዳይ በወረቀት ሲመዘገብ መረጃው ይጠፋል፤ ተመልሶ ሲመጣ የቀድሞ ፋይሉ አይገኝም ነበር።',
          'በተገልጋይ የተሰጠውን እርካታ በቁጥርና በመቶኛ (%) መለካት አይቻልም ነበር።',
        ],
      },
      {
        heading: 'የመረጃ መደጋገምና የምዘና ክፍተት',
        accent: 'cyan',
        items: [
          'አድሚኑ ሰራተኛ ሲመዘግብ ከመታወቂያ ሲስተም ውጪ በእጅ ሁሉንም መረጃ መጻፍ ነበረበት።',
          'ሰራተኞችን እና ክፍሎችን ከ100% በተጨባጭ መረጃ ለማወዳደር የተቀናጀ ስርዓት አልነበረም።',
        ],
      },
    ],
  },
  {
    id: 3,
    tag: 'ስላይድ 3 • ዓላማ',
    title: 'የሲስተሙ ዋና እና ዝርዝር ዓላማዎች',
    subtitle: 'የተቋሙን አገልግሎት አሰጣጥ በቴክኖሎጂ ማዘመን',
    layout: 'two_col',
    leftTitle: 'ዋና ዓላማ (General Objective)',
    leftItems: [
      'በቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን የሰራተኞችን ሰዓት ክትትል፣ የባለጉዳይ ዲጂታል ምዝገባ፣ የተገልጋይ እርካታ እና የ100% አፈጻጸም ምዘናን በአንድ የተቀናጀ ስርዓት ማዘመን።',
      'ከክልሉ ፖሊስ ኮሚሽን የዲጂታል መታወቂያ ሲስተም ጋር ሙሉ በሙሉ የተገናኘና የተናበበ አሰራር መዘርጋት።',
    ],
    rightTitle: 'ዝርዝር ዓላማዎች (Specific Objectives)',
    rightItems: [
      'በመታወቂያ ቁጥር ብቻ የሰራተኛውን ሙሉ መረጃና ፎቶ ከመታወቂያ ሲስተም በራስ-ሰር ማምጣት።',
      'በስልክ QR ኮድ ስካን የሰራተኞችን መግቢያና መውጫ እና የባለጉዳዮችን መስተንግዶ መመዝገብ።',
      'በአስተያየት (45%)፣ በመግቢያ (30%) እና በመውጫ (25%) ከ100% እየሰሉ ከ1ኛ ደረጃ ጀምሮ ማወዳደር።',
      'QR ስካን ያደረገ ተጠቃሚ ወደ አድሚን ገጽ እንዳይገባ ጥብቅ ደህንነት ማረጋገጥ።',
    ],
  },
  {
    id: 4,
    tag: 'ስላይድ 4 • ግብ እና ጠቀሜታ',
    title: 'የሲስተሙ ግቦች እና አጠቃላይ ጠቀሜታ',
    subtitle: 'ግልጽነት፣ ፍጥነት እና ተጠያቂነት ያለው የፖሊስ አገልግሎት',
    layout: 'two_col',
    leftTitle: 'የሲስተሙ ግቦች (Goals)',
    leftItems: [
      '100% ዲጂታል የመስተንግዶና የሰዓት ክትትል ስርዓት በሁሉም ክፍሎች መገንባት።',
      'የባለጉዳይ መስተንግዶ ጊዜን መቀነስ እና የተገልጋይ እርካታን በቀጣይነት ማሳደግ።',
      'ሁሉንም የጉብኝት፣ የአስተያየት እና የአቴንዳንስ መረጃ በCloud Firestore ታሪክ (History) ማስቀመጥ።',
      'ፍትሐዊ እና በመረጃ የተደገፈ የውድድርና የማበረታቻ ስርዓት መፍጠር።',
    ],
    rightTitle: 'አጠቃላይ ጠቀሜታ (Importance)',
    rightItems: [
      'አመራሩ በየዕለቱ እና ባለፉት 7 ቀናት ያለውን የአገልግሎት ለውጥ በግራፍ (Charts) ይከታተላል።',
      'በህዝብ እና በፖሊስ መካከል ያለውን መተማመንና ተጠያቂነት ያጠናክራል።',
      'የወረቀት፣ የህትመት እና የመዝገብ አያያዝ ወጪን በከፍተኛ ሁኔታ ይቀንሳል።',
      'ሁለት ተቋማዊ ሲስተሞችን በማናበብ ወጥ የሆነ መረጃ (Single Source of Truth) ይፈጥራል።',
    ],
  },
  {
    id: 5,
    tag: 'ስላይድ 5 • ትስስር እና ደህንነት',
    title: 'ከዲጂታል መታወቂያ ሲስተም ጋር ያለው ትስስር እና ደህንነት',
    subtitle: 'በጀርባ የተናበበ ዳታቤዝ እና ጥብቅ የመረጃ ጥበቃ',
    layout: 'cards',
    cards: [
      {
        heading: 'ቀጥተኛ የመታወቂያ ሲስተም ግንኙነት',
        accent: 'amber',
        items: [
          'ከ bg-police-id-system Firestore ጋር በቀጥታ የተገናኘ ነው።',
          'አድሚኑ BGR-POL ቁጥር ሲያስገባ ስም፣ ማዕረግ፣ ፎቶ፣ ስልክና ኃላፊነት በራስ-ሰር ይመጣል።',
          'የተደረጉ ለውጦች በሁለቱም ሲስተሞች መካከል ይናበባሉ።',
        ],
      },
      {
        heading: 'የሞባይል QR ገለልተኛነት (Isolation)',
        accent: 'emerald',
        items: [
          'በግድግዳ QR የገባ ሰራተኛ ወይም ባለጉዳይ የራሱን ፖርታል ብቻ ያያል።',
          'ወደ አድሚን ዳሽቦርድ፣ ወደ መዝገቦች ወይም ወደ ሌላ ሰው መረጃ መግባት አይቻልም።',
        ],
      },
      {
        heading: 'የአድሚን መግቢያ ቁልፍ (Security Gate)',
        accent: 'rose',
        items: [
          'ሁሉም የአድሚን ገጾች በጥብቅ PIN መግቢያ የተቆለፉ ናቸው።',
          'የCloud Firestore ደህንነት ህጎች (firestore.rules) ያልተፈቀደ ንባብና ለውጥ ይከላከላሉ።',
        ],
      },
    ],
  },
  {
    id: 6,
    tag: 'ስላይድ 6 • QR ፖስተሮች እና ሙሉ ስክሪን',
    title: 'የQR ኮድ ማሳያ፣ ሙሉ ስክሪን እና የA4 ፖስተር ህትመት',
    subtitle: 'ለስክሪን ዕይታ እና ለግድግዳ ህትመት የተለያዩ ብልህ አቀማመጦች',
    layout: 'two_col',
    leftTitle: 'በስክሪን እና በሙሉ ስክሪን (Display Mode)',
    leftItems: [
      'የሰራተኛው QR (በግራ) እና የባለጉዳዩ QR (በቀኝ) ጎን ለጎን በአንድ ስክሪን ይታያሉ።',
      'በመሀላቸው ትልቅ ክብ የፖሊስ ሎጎ እና ከታቹ «በሰብዓዊነት ማገልገል በጀግንነት መጠበቅ» በሚያምር ቀለም ይቀመጣል።',
      '«ሙሉ ስክሪን (QR ብቻ)» ሲጫን ሌሎች ጽሑፎች ተደብቀው QR ኮዶቹና ሎጎው ብቻ በትልቁ ይታያሉ።',
    ],
    rightTitle: 'በወረቀት ሲታተም (Print A4 Posters)',
    rightItems: [
      'ፕሪንት ሲደረግ መሀል ሎጎው ቀርቶ የሰራተኛው ለብቻ እና የባለጉዳዩ ለብቻ በየራሳቸው A4 ገጽ ይታተማሉ።',
      'ከላይ ሄደር ላይ፡ በስተግራ የቤ/ጉሙዝ ሰንደቅ ዓላማ፣ ከመሀል ክብ ሎጎና የሲስተሙ ስም በአማርኛ/እንግሊዝኛ፣ በስተቀኝ የኢትዮጵያ ሰንደቅ ዓላማ ይቀመጣሉ።',
      'ከእያንዳንዱ QR ኮድ ጋር ባለ 4-ደረጃ የአሰራር መመሪያ አብሮ ይታተማል።',
    ],
  },
  {
    id: 7,
    tag: 'ስላይድ 7 • የአሰራር ሂደት',
    title: 'ሲስተሙ እንዴት ይሰራል? (ሰራተኛ እና ባለጉዳይ)',
    subtitle: 'በስልክ ካሜራ ስካን የሚከናወን ቀላልና ፈጣን አሰራር',
    layout: 'two_col',
    leftTitle: 'የሰራተኛ መግቢያ/መውጫ እና የዕለቱ ፓስ',
    leftItems: [
      '1. ሰራተኛው በክፍሉ የተለጠፈውን QR በስልኩ ስካን ያደርጋል።',
      '2. መታወቂያ ቁጥሩን አስገብቶ የዲጂታል መታወቂያ ካርዱን ያረጋግጣል።',
      '3. «መግቢያ» (2፡30–3፡00 ከፍተኛ / ከ3፡01 ዝቅተኛ) ወይም «መውጫ» (11፡00+ በጣም ከፍተኛ) ይጫናል።',
      '4. ከገባ በኋላ «የዕለቱ ጊዜያዊ መግቢያ ካርድ / ደረሰኝ» ከQR ማረጋገጫ ጋር አውጥቶ ፕሪንት ወይም ኮፒ ማድረግ ይችላል።',
    ],
    rightTitle: 'የባለጉዳይ ምዝገባ እና አስተያየት መስጫ',
    rightItems: [
      '1. ባለጉዳዩ QR ስካን አድርጎ «አገልግሎት ፈልጌ» የሚለውን ይመርጣል።',
      '2. ስሙን፣ ስልክ ቁጥሩን፣ ጉዳዩን እና የመታወቂያውን የፊት/ኋላ ፎቶ (Compressed) ያስገባል።',
      '3. ጉዳዩን ሲጨርስ «አስተያየት ለመስጠት» በሚለው ስልኩን (09... ወይም +2519...) አስገብቶ ፋይሉን ያመጣል።',
      '4. ከ1 እስከ 5 ደረጃ ይሰጣል፤ ሁሉም በFirestore ታሪክ (History) ይቀመጣል።',
    ],
  },
  {
    id: 8,
    tag: 'ስላይድ 8 • ምዘና እና ዳሽቦርድ',
    title: 'የ100% የምዘና ስርዓት እና የዳሽቦርድ ትንታኔ',
    subtitle: 'በተጨባጭ መረጃ የተመሰረተ ፍትሐዊ ደረጃ አሰጣጥ',
    layout: 'cards',
    cards: [
      {
        heading: 'የሰራተኞች የ100% ምዘና ቀመር',
        accent: 'amber',
        items: [
          '45% — የባለጉዳይ አስተያየት (Citizen Service Feedback)',
          '30% — የመግቢያ ሰዓት አክባሪነት (Check-In Punctuality)',
          '25% — የመውጫ ሰዓት አክባሪነት (Check-Out Punctuality)',
        ],
      },
      {
        heading: 'አራት የደረጃ እና የንጽጽር ዕይታዎች',
        accent: 'emerald',
        items: [
          'የሁሉም ሰራተኞች አጠቃላይ ደረጃ ከ1ኛ ጀምሮ (1ኛ..N)',
          'በየክፍሉ የሰራተኞች ደረጃ (የየክፍሉ 1ኛ ተለይቶ ይታያል)',
          'ክፍል ከክፍል ደረጃ እና እስከ 4 ሰራተኛ/ክፍል ጎን-ለጎን ማወዳደሪያ',
        ],
      },
      {
        heading: 'የአድሚን ዳሽቦርድ ግራፎች (Recharts)',
        accent: 'cyan',
        items: [
          'የዛሬው ባለጉዳዮች ከተሰጡ አስተያየቶች ጋር ማነጻጸሪያ ካርድ',
          'ባለፉት 7 ቀናት የአገልግሎት እርካታ Trend LineChart',
          'በስራ ላይ ያሉ ሰራተኞችና የባለጉዳዮች ሙሉ ታሪክ',
        ],
      },
    ],
  },
  {
    id: 9,
    tag: 'ስላይድ 9 • ጠቀሜታ ለባለድርሻ አካላት',
    title: 'ለሰራተኛው፣ ለተቋሙ እና ለባለጉዳዩ ያለው ጠቀሜታ',
    subtitle: 'ሁሉም አካል ተጠቃሚ የሚሆንበት የተቀናጀ ስርዓት',
    layout: 'cards',
    cards: [
      {
        heading: 'ለሰራተኛው (Police Officers)',
        accent: 'amber',
        items: [
          'ወረፋ ሳይጠብቅ በስልኩ በሰከንዶች ውስጥ ይመዘገባል።',
          'የራሱን ዲጂታል መታወቂያና የዕለቱን መግቢያ ደረሰኝ (Pass) ያያል።',
          'ጥረቱና ሰዓት አክባሪነቱ በፍትሐዊነት ከ100% ተለክቶ እውቅና ያገኛል።',
        ],
      },
      {
        heading: 'ለተቋሙ (Police Commission)',
        accent: 'emerald',
        items: [
          'የአድሚን ድካምን ይቀንሳል (መረጃ በራስ-ሰር ከመታወቂያ ሲስተም ይመጣል)።',
          'የወረቀትና የመዝገብ ወጪን በእጅጉ ይቀንሳል።',
          'ለአመራር ውሳኔና ለኦዲት የተሟላ ዳታና የክፍሎች ንጽጽር ያቀርባል።',
        ],
      },
      {
        heading: 'ለባለጉዳዩ (Citizens & Visitors)',
        accent: 'cyan',
        items: [
          'ፈጣን፣ ዲጂታል እና ከወረፋ የጸዳ ምዝገባ ያገኛል።',
          'ያለ ፍርሃት ስለተሰጠው አገልግሎት ከ1–5 ደረጃ ይሰጣል።',
          'የቀድሞ ጉብኝቱ በስልክ ቁጥሩ ስለሚገኝ ተመላላሽ መጉላላት ይቀራል።',
        ],
      },
    ],
  },
  {
    id: 10,
    tag: 'ስላይድ 10 • ችግር ፈቺነቱ',
    title: 'የሲስተሙ ችግር ፈቺነት (Before vs After)',
    subtitle: 'ነባር ተግዳሮቶች እና ሲስተሙ ያመጣቸው ተጨባጭ መፍትሔዎች',
    layout: 'table',
    tableHeaders: ['ከዚህ በፊት የነበረው ችግር', 'ሲስተሙ ያመጣው መፍትሔ'],
    tableRows: [
      [
        'አድሚኑ ሰራተኛ ሲመዘግብ ሙሉ መረጃውን ከባዶ በእጅ መጻፍ ነበረበት',
        'መታወቂያ ቁጥር ሲገባ ሙሉ መረጃና ፎቶ ከመታወቂያ ሲስተም በራስ-ሰር ይመጣል',
      ],
      [
        'QR ስካን ያደረገ ተጠቃሚ ወደ አድሚን ገጽ ወይም የሌላ ሰው መረጃ የመግባት ስጋት',
        'በQR የገባ ተጠቃሚ የራሱን ፖርታል ብቻ ያያል፤ አድሚኑ በPIN የተቆለፈ ነው',
      ],
      [
        'ባለጉዳይ አስተያየት ሊሰጥ ሲል ቀደም የተመዘገበ ፋይል አይገኝም ነበር',
        'ሁሉም ምዝገባ በFirestore History ይቀመጣል፤ በ09/+2519 ፎርማት ይገኛል',
      ],
      [
        'የሰራተኞችንና የክፍሎችን አፈጻጸም ከ100% ማወዳደር አለመቻል',
        'በመግቢያ (30%)፣ መውጫ (25%) እና አስተያየት (45%) ከ1ኛ ደረጃ ጀምሮ ያወዳድራል',
      ],
      [
        'የወረቀት መዝገብ መጥፋት እና የአገልግሎት ታሪክ አለመገኘት',
        'ሁሉም መረጃ በCloud Firestore ውስጥ በዘላቂነትና በታሪክ መልክ ይቀመጣል',
      ],
    ],
  },
  {
    id: 11,
    tag: 'ስላይድ 11 • የሚያስፈልገው ማቴሪያል',
    title: 'ሲስተሙን ለማስጀመር የሚያስፈልጉ ግብዓቶች',
    subtitle: 'የሃርድዌር፣ የኔትወርክ እና የሶፍትዌር መሠረተ-ልማት',
    layout: 'two_col',
    leftTitle: 'የሃርድዌር እና የቢሮ ማቴሪያሎች',
    leftItems: [
      'ቢያንስ 1 ዴስክቶፕ ኮምፒውተር ወይም ላፕቶፕ (ለአድሚን ዳሽቦርድና ምዝገባ)።',
      'የA4 ቀለም ፕሪንተር እና ላሚኔሽን ማሽን (የQR ፖስተሮችን አትሞ ግድግዳ ላይ ለመለጠፍ)።',
      'ስማርት ቲቪ ወይም ሞኒተር (አማራጭ — በመግቢያ ላይ QR በሙሉ ስክሪን ለማሳየት)።',
      'የሰራተኞች እና የባለጉዳዮች ካሜራ ያለው ስማርት ስልክ (በብራውዘር ይሰራል)።',
    ],
    rightTitle: 'የኔትወርክ እና የሶፍትዌር ግብዓቶች',
    rightItems: [
      'የተረጋጋ የቢሮ ዋይፋይ (Wi-Fi) ወይም የሞባይል ዳታ ኢንተርኔት።',
      'የFirebase Cloud Firestore ዳታቤዝ (ዋናው እና የተገናኘው የመታወቂያ ሲስተም)።',
      'የድረ-ገጽ ማስተናገጃ (Web Hosting / Vercel / Cloud Run)።',
      'ለአድሚን ኃላፊዎች የተመደበ ሚስጥራዊ የመግቢያ PIN ኮድ።',
    ],
  },
  {
    id: 12,
    tag: 'ስላይድ 12 • ማጠቃለያ',
    title: 'ማጠቃለያ (Conclusion)',
    subtitle: 'ወደ ላቀ ዲጂታል የፖሊስ አገልግሎት የሚደረግ ሽግግር',
    layout: 'cover',
    highlightBox:
      '«የፖሊስ እና የፋይዳ ዲጂታል መስተንግዶ ሲስተም» የቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽንን አገልግሎት ፈጣን፣ ግልጽ፣ ደህንነቱ የተጠበቀ እና በ100% ተጨባጭ ምዘና የሚመራ ተቋም ያደርገዋል።',
  },
];

function stripDataUriPrefix(uri?: string): string | null {
  if (!uri) return null;
  if (uri.startsWith('data:image/')) {
    return uri;
  }
  return null;
}

export function buildSystemPresentation(settings?: CommissionSettings): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"
  pptx.author = 'Benishangul-Gumuz Region Police Commission';
  pptx.company = settings?.commissionName || 'የቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን';
  pptx.subject = 'የፖሊስ እና የፋይዳ ዲጂታል መስተንግዶ ሲስተም — አጠቃላይ የሲስተም ሰነድ';
  pptx.title = 'የፖሊስ እና የፋይዳ ዲጂታል መስተንግዶ ሲስተም';

  const commissionName = settings?.commissionName || 'የቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን';
  const motto = (settings?.motto || 'በሰብዓዊነት ማገልገል በጀግንነት መጠበቅ').replace(/[«»"]/g, '').trim();
  const logoData = stripDataUriPrefix(settings?.logoUrl);

  const NAVY = '0F172A';
  const DARK_CARD = '1E293B';
  const SLATE_TEXT = 'E2E8F0';
  const MUTED = '94A3B8';
  const AMBER = 'F59E0B';
  const EMERALD = '10B981';
  const CYAN = '38BDF8';
  const ROSE = 'F43F5E';

  const addTricolorAndChrome = (slide: PptxGenJS.Slide, slideNum: number, tag: string) => {
    slide.background = { color: NAVY };

    // Top Ethiopian Tricolor strip (Green, Yellow, Red)
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4.44, h: 0.1, fill: { color: '16A34A' } });
    slide.addShape(pptx.ShapeType.rect, { x: 4.44, y: 0, w: 4.45, h: 0.1, fill: { color: 'EAB308' } });
    slide.addShape(pptx.ShapeType.rect, { x: 8.89, y: 0, w: 4.44, h: 0.1, fill: { color: 'DC2626' } });

    // Top tag & slide index
    slide.addText(tag, {
      x: 0.6,
      y: 0.25,
      w: 8.0,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: AMBER,
      fontFace: 'Nyala',
    });

    slide.addText(`${slideNum} / ${SYSTEM_SLIDES.length}`, {
      x: 11.4,
      y: 0.25,
      w: 1.3,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: MUTED,
      align: 'right',
    });

    // Footer divider & text
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 6.95,
      w: 12.13,
      h: 0,
      line: { color: '334155', width: 1 },
    });

    slide.addText(`${commissionName}  •  «${motto}»`, {
      x: 0.6,
      y: 7.03,
      w: 12.13,
      h: 0.35,
      fontSize: 10,
      color: MUTED,
      fontFace: 'Nyala',
      align: 'center',
    });
  };

  SYSTEM_SLIDES.forEach((s) => {
    const slide = pptx.addSlide();
    addTricolorAndChrome(slide, s.id, s.tag);

    if (s.layout === 'cover') {
      // Decorative ring / logo if SVG/PNG data URI is available
      if (logoData && !logoData.startsWith('data:image/svg+xml')) {
        slide.addImage({
          data: logoData,
          x: 5.9,
          y: 0.9,
          w: 1.5,
          h: 1.5,
          rounding: true,
        });
      } else {
        slide.addShape(pptx.ShapeType.ellipse, {
          x: 6.05,
          y: 0.95,
          w: 1.2,
          h: 1.2,
          fill: { color: DARK_CARD },
          line: { color: AMBER, width: 3 },
        });
        slide.addText('BGR\nPOLICE', {
          x: 6.05,
          y: 1.15,
          w: 1.2,
          h: 0.8,
          fontSize: 12,
          bold: true,
          color: AMBER,
          align: 'center',
        });
      }

      slide.addText(s.title, {
        x: 0.8,
        y: 2.5,
        w: 11.73,
        h: 1.1,
        fontSize: 32,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        fontFace: 'Nyala',
      });

      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 1.2,
          y: 3.65,
          w: 10.93,
          h: 0.8,
          fontSize: 15,
          bold: true,
          color: EMERALD,
          align: 'center',
        });
      }

      if (s.highlightBox) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 1.6,
          y: 4.8,
          w: 10.13,
          h: 1.3,
          fill: { color: DARK_CARD },
          line: { color: AMBER, width: 1.5 },
          rectRadius: 0.15,
        });
        slide.addText(s.highlightBox, {
          x: 1.9,
          y: 4.95,
          w: 9.53,
          h: 1.0,
          fontSize: 16,
          bold: true,
          color: 'FEF3C7',
          align: 'center',
          valign: 'middle',
          fontFace: 'Nyala',
        });
      }
      return;
    }

    // Standard Title + Subtitle Header
    slide.addText(s.title, {
      x: 0.6,
      y: 0.62,
      w: 12.13,
      h: 0.65,
      fontSize: 24,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Nyala',
    });

    if (s.subtitle) {
      slide.addText(s.subtitle, {
        x: 0.6,
        y: 1.25,
        w: 12.13,
        h: 0.4,
        fontSize: 13,
        color: EMERALD,
        fontFace: 'Nyala',
      });
    }

    if (s.layout === 'two_col') {
      // Left Column Box
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6,
        y: 1.85,
        w: 5.9,
        h: 4.85,
        fill: { color: DARK_CARD },
        line: { color: AMBER, width: 1.2 },
        rectRadius: 0.12,
      });

      slide.addText(s.leftTitle || '', {
        x: 0.85,
        y: 2.02,
        w: 5.4,
        h: 0.45,
        fontSize: 16,
        bold: true,
        color: AMBER,
        fontFace: 'Nyala',
      });

      const leftTextRows = (s.leftItems || []).map((t) => ({
        text: `• ${t}`,
        options: { breakLine: true, paraSpaceAfter: 10 },
      }));
      slide.addText(leftTextRows, {
        x: 0.85,
        y: 2.55,
        w: 5.4,
        h: 3.95,
        fontSize: 13.5,
        color: SLATE_TEXT,
        valign: 'top',
        fontFace: 'Nyala',
      });

      // Right Column Box
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.83,
        y: 1.85,
        w: 5.9,
        h: 4.85,
        fill: { color: DARK_CARD },
        line: { color: EMERALD, width: 1.2 },
        rectRadius: 0.12,
      });

      slide.addText(s.rightTitle || '', {
        x: 7.08,
        y: 2.02,
        w: 5.4,
        h: 0.45,
        fontSize: 16,
        bold: true,
        color: EMERALD,
        fontFace: 'Nyala',
      });

      const rightTextRows = (s.rightItems || []).map((t) => ({
        text: `• ${t}`,
        options: { breakLine: true, paraSpaceAfter: 10 },
      }));
      slide.addText(rightTextRows, {
        x: 7.08,
        y: 2.55,
        w: 5.4,
        h: 3.95,
        fontSize: 13.5,
        color: SLATE_TEXT,
        valign: 'top',
        fontFace: 'Nyala',
      });
    } else if (s.layout === 'cards' && s.cards) {
      const count = s.cards.length;
      const gap = 0.35;
      const totalW = 12.13;
      const cardW = (totalW - gap * (count - 1)) / count;

      s.cards.forEach((card, idx) => {
        const x = 0.6 + idx * (cardW + gap);
        const accentColor =
          card.accent === 'emerald'
            ? EMERALD
            : card.accent === 'cyan'
            ? CYAN
            : card.accent === 'rose'
            ? ROSE
            : AMBER;

        slide.addShape(pptx.ShapeType.roundRect, {
          x,
          y: 1.85,
          w: cardW,
          h: 4.85,
          fill: { color: DARK_CARD },
          line: { color: accentColor, width: 1.4 },
          rectRadius: 0.12,
        });

        slide.addText(card.heading, {
          x: x + 0.2,
          y: 2.05,
          w: cardW - 0.4,
          h: 0.55,
          fontSize: 15,
          bold: true,
          color: accentColor,
          fontFace: 'Nyala',
        });

        const itemRuns = card.items.map((item) => ({
          text: `• ${item}`,
          options: { breakLine: true, paraSpaceAfter: 10 },
        }));

        slide.addText(itemRuns, {
          x: x + 0.2,
          y: 2.7,
          w: cardW - 0.4,
          h: 3.8,
          fontSize: 13,
          color: SLATE_TEXT,
          valign: 'top',
          fontFace: 'Nyala',
        });
      });
    } else if (s.layout === 'table' && s.tableHeaders && s.tableRows) {
      const rows: PptxGenJS.TableRow[] = [
        s.tableHeaders.map((h) => ({
          text: h,
          options: {
            bold: true,
            fontSize: 14,
            color: NAVY,
            fill: { color: AMBER },
            fontFace: 'Nyala',
          },
        })),
        ...s.tableRows.map((r, rIdx) =>
          r.map((cell, cIdx) => ({
            text: cell,
            options: {
              fontSize: 12.5,
              color: cIdx === 1 ? 'A7F3D0' : SLATE_TEXT,
              fill: { color: rIdx % 2 === 0 ? DARK_CARD : '162032' },
              fontFace: 'Nyala',
            },
          }))
        ),
      ];

      slide.addTable(rows, {
        x: 0.6,
        y: 1.85,
        w: 12.13,
        colW: [5.8, 6.33],
        border: { type: 'solid', color: '334155', pt: 1 },
        margin: [8, 10, 8, 10],
        valign: 'middle',
      });
    }
  });

  return pptx;
}

export async function downloadSystemPowerPoint(settings?: CommissionSettings): Promise<void> {
  const pptx = buildSystemPresentation(settings);
  await pptx.writeFile({ fileName: 'Police_Fayda_Digital_Hospitality_System.pptx' });
}
