import type { Lang, Localized, Project } from "./types";

export const person = {
  name: "Adib Rezazadeh",
  nickname: "Shahrokh",
  email: "adib.rezazadeh@gmail.com",
  phone: "+98 917 736 7441",
  phoneHref: "tel:+989177367441",
  linkedin: "https://www.linkedin.com/in/adib-rezazadeh-84aa3936",
  linkedinLabel: "/in/adib-rezazadeh-84aa3936",
  github: "https://github.com/adibrezazadeh",
  location: {
    en: "Shiraz, Iran",
    fa: "شیراز، ایران",
    ar: "شيراز، إيران",
  } satisfies Localized,
  relocation: {
    en: "Open to relocation",
    fa: "آماده جابه‌جایی",
    ar: "منفتح على الانتقال",
  } satisfies Localized,
  roleLine: {
    en: "Senior full-stack engineer & technical leader",
    fa: "مهندس ارشد فول‌استک و رهبر فنی",
    ar: "مهندس فل ستاك أول وقائد تقني",
  } satisfies Localized,
  years: {
    en: "6+ years",
    fa: "بیش از ۶ سال",
    ar: "أكثر من ٦ سنوات",
  } satisfies Localized,
  summary: {
    en: "Full-stack engineer and technical leader with 6+ years shipping web and mobile products end-to-end — from system architecture to pixel-level UI. Specialized in React / Next.js (App Router) front ends built with TypeScript, Tailwind and shadcn/ui, backed by Node.js services and SQL/NoSQL data layers. Currently splitting time across a CTO seat, a Head of Engineering role, and hands-on full-stack delivery — setting technical direction, building engineering culture, and still writing production code every week.",
    fa: "مهندس فول‌استک و رهبر فنی با بیش از ۶ سال ساخت محصول وب و موبایل، از معماری سیستم تا جزئیات رابط کاربری. تخصص او فرانت‌اند React و Next.js (App Router) با TypeScript، Tailwind و shadcn/ui است، با سرویس‌های Node.js و لایه‌های داده SQL و NoSQL. هم‌زمان روی صندلی مدیر فناوری، نقش مدیر مهندسی، و تحویل فول‌استک کار می‌کند؛ جهت فنی را می‌گذارد، فرهنگ مهندسی می‌سازد، و هر هفته هنوز کد پروداکشن می‌نویسد.",
    ar: "مهندس فل ستاك وقائد تقني بخبرة تزيد على ست سنوات في تسليم منتجات الويب والموبايل من طرف إلى طرف، من معمارية النظام إلى تفاصيل الواجهة. يتخصص في واجهات React وNext.js (App Router) مبنية بـ TypeScript وTailwind وshadcn/ui، مع خدمات Node.js وطبقات SQL وNoSQL. يقسم وقته اليوم بين مقعد مدير تقني، ودور رئيس هندسة، وتسليم فل ستاك عملي: يضع الاتجاه التقني، ويبني ثقافة الهندسة، ويكتب كود الإنتاج كل أسبوع.",
  } satisfies Localized,
};

export const stack = [
  "React",
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui",
  "Node.js",
  "REST APIs",
  "SQL",
  "NoSQL",
  "Radix UI",
  "Cloud Deploy",
  "CI/CD",
] as const;

export const leadership: Record<Lang, string[]> = {
  en: [
    "Technical strategy",
    "Team management",
    "Architecture",
    "Mentoring",
    "Product strategy",
  ],
  fa: [
    "استراتژی فنی",
    "مدیریت تیم",
    "معماری",
    "منتورینگ",
    "استراتژی محصول",
  ],
  ar: [
    "الاستراتيجية التقنية",
    "إدارة الفريق",
    "المعمارية",
    "التوجيه",
    "استراتيجية المنتج",
  ],
};

export const education: {
  degree: Localized;
  school: string;
  years: string;
}[] = [
  {
    degree: {
      en: "Ph.D., Business Administration",
      fa: "دکتری مدیریت بازرگانی",
      ar: "دكتوراه في إدارة الأعمال",
    },
    school: "M.A.D Higher Education Institute",
    years: "2019 — 2020",
  },
  {
    degree: {
      en: "B.A., Business Management",
      fa: "کارشناسی مدیریت بازرگانی",
      ar: "بكالوريوس في إدارة الأعمال",
    },
    school: "M.A.D Higher Education Institute",
    years: "2017 — 2018",
  },
  {
    degree: {
      en: "Associate, Software Engineering",
      fa: "کاردانی مهندسی نرم‌افزار",
      ar: "دبلوم في هندسة البرمجيات",
    },
    school: "Technical University of Larestan",
    years: "2007 — 2010",
  },
];

const shiraz = {
  en: "Shiraz, Iran",
  fa: "شیراز، ایران",
  ar: "شيراز، إيران",
} satisfies Localized;

const iran = { en: "Iran", fa: "ایران", ar: "إيران" } satisfies Localized;

const vancouver = {
  en: "Vancouver, BC (Remote)",
  fa: "ونکوور، بریتیش کلمبیا (دورکاری)",
  ar: "فانكوفر، كولومبيا البريطانية (عن بُعد)",
} satisfies Localized;

export const projects: Project[] = [
  {
    id: "hubly",
    name: "Hubly.ir",
    href: "https://hubly.ir",
    group: "current",
    period: { en: "Jan 2025 — Now", fa: "ژانویه ۲۰۲۵ — اکنون", ar: "يناير ٢٠٢٥ — الآن" },
    place: shiraz,
    role: { en: "Chief Technology Officer", fa: "مدیر فناوری", ar: "المدير التقني" },
    mat: "#1e6d68",
    summary: {
      en: "CTO of Hubly.ir, an Iranian platform for building an online hub and selling courses, files, communities, and other digital products.",
      fa: "مدیر فناوری Hubly.ir، پلتفرم ایرانی برای ساخت هاب آنلاین و فروش دوره، فایل، انجمن و محصولات دیجیتال.",
      ar: "المدير التقني لـ Hubly.ir، منصة إيرانية لبناء مركز على الإنترنت وبيع الدورات والملفات والمجتمعات والمنتجات الرقمية.",
    },
    bullets: {
      en: [
        "Own technology strategy and vision; design scalable architecture for web-based products and lead the engineering team's standards and workflows.",
        "Build and optimize full-stack applications with Next.js, React, TypeScript, and Node.js, and guide the technical roadmap against business goals.",
      ],
      fa: [
        "استراتژی و چشم‌انداز فناوری را بر عهده دارد؛ معماری مقیاس‌پذیر محصولات وب را طراحی می‌کند و استانداردها و جریان کار تیم مهندسی را هدایت می‌کند.",
        "اپلیکیشن‌های فول‌استک را با Next.js، React، TypeScript و Node.js می‌سازد و بهینه می‌کند و نقشه راه فنی را با هدف‌های کسب‌وکار هم‌راستا می‌کند.",
      ],
      ar: [
        "يملك استراتيجية التقنية ورؤيتها، ويصمم معمارية قابلة للتوسع لمنتجات الويب، ويقود معايير فريق الهندسة ومسارات العمل.",
        "يبني ويحسّن تطبيقات فل ستاك بـ Next.js وReact وTypeScript وNode.js، ويوجّه خارطة الطريق التقنية وفق أهداف العمل.",
      ],
    },
  },
  {
    id: "glonova",
    name: "Glonova",
    href: "https://glonova.com",
    group: "current",
    period: { en: "Feb 2026 — Now", fa: "فوریه ۲۰۲۶ — اکنون", ar: "فبراير ٢٠٢٦ — الآن" },
    place: vancouver,
    role: { en: "Head of Engineering", fa: "مدیر مهندسی", ar: "رئيس الهندسة" },
    mat: "#243056",
    summary: {
      en: "Head of Engineering at Glonova, which is building an independent verification standard for medical aesthetics clinics in British Columbia.",
      fa: "مدیر مهندسی Glonova که در حال ساخت یک استاندارد مستقل برای راستی‌آزمایی کلینیک‌های زیبایی پزشکی در بریتیش کلمبیا است.",
      ar: "رئيس الهندسة في Glonova، التي تبني معيارًا مستقلًا للتحقق من عيادات التجميل الطبي في كولومبيا البريطانية.",
    },
    bullets: {
      en: [
        "Own technical strategy and architecture for the engineering org; run the full SDLC from planning to deployment on React, Next.js, TypeScript, Node.js, and cloud infrastructure.",
        "Set coding standards, run code reviews, and mentor developers while overseeing performance, security, and scalability.",
      ],
      fa: [
        "استراتژی فنی و معماری سازمان مهندسی را بر عهده دارد و کل چرخه توسعه را از برنامه‌ریزی تا استقرار روی React، Next.js، TypeScript، Node.js و زیرساخت ابری پیش می‌برد.",
        "استاندارد کدنویسی می‌گذارد، بازبینی کد را اداره می‌کند، توسعه‌دهنده‌ها را منتور می‌کند و بر کارایی، امنیت و مقیاس‌پذیری نظارت دارد.",
      ],
      ar: [
        "يملك الاستراتيجية التقنية ومعمارية منظمة الهندسة، ويدير دورة التطوير كاملة من التخطيط إلى النشر على React وNext.js وTypeScript وNode.js والبنية السحابية.",
        "يضع معايير الكتابة، ويدير مراجعات الكود، ويوجّه المطورين، ويشرف على الأداء والأمان وقابلية التوسع.",
      ],
    },
  },
  {
    id: "sazeh",
    name: "Sazeh Peyvand",
    group: "current",
    period: { en: "Jun 2026 — Now", fa: "ژوئن ۲۰۲۶ — اکنون", ar: "يونيو ٢٠٢٦ — الآن" },
    place: shiraz,
    role: { en: "Full-Stack Engineer", fa: "مهندس فول‌استک", ar: "مهندس فل ستاك" },
    mat: "#c4622d",
    summary: {
      en: "Full-stack engineer at Sazeh Peyvand in Shiraz, shipping features from the API through to the interface.",
      fa: "مهندس فول‌استک در سازه‌پیوند در شیراز؛ ویژگی‌ها را از API تا رابط کاربری تحویل می‌دهد.",
      ar: "مهندس فل ستاك في Sazeh Peyvand في شيراز، يسلّم الميزات من واجهة البرمجة حتى الواجهة.",
    },
    bullets: {
      en: [
        "Build full-stack features end-to-end with React.js, Next.js, TypeScript, and Node.js, from API to UI.",
        "Ship reusable, scalable frontend architecture and server-side functionality with a focus on performance and code quality.",
      ],
      fa: [
        "ویژگی‌های فول‌استک را از API تا UI با React.js، Next.js، TypeScript و Node.js می‌سازد.",
        "معماری فرانت‌اند قابل‌استفاده مجدد و مقیاس‌پذیر و منطق سمت سرور را با تمرکز بر کارایی و کیفیت کد تحویل می‌دهد.",
      ],
      ar: [
        "يبني ميزات فل ستاك من طرف إلى طرف بـ React.js وNext.js وTypeScript وNode.js، من واجهة البرمجة إلى الواجهة.",
        "يسلّم معمارية واجهة قابلة لإعادة الاستخدام والتوسع ووظائفًا على الخادم، مع تركيز على الأداء وجودة الكود.",
      ],
    },
  },
  {
    id: "sepanja",
    name: "Sepanja",
    group: "previous",
    period: { en: "May 2025 — Jan 2026", fa: "مه ۲۰۲۵ — ژانویه ۲۰۲۶", ar: "مايو ٢٠٢٥ — يناير ٢٠٢٦" },
    place: shiraz,
    role: {
      en: "Senior Front-End Developer",
      fa: "توسعه‌دهنده ارشد فرانت‌اند",
      ar: "مطور واجهات أول",
    },
    mat: "#8d2f2f",
    summary: {
      en: "Senior front-end developer. High-performance interfaces with the Next.js App Router, Server Components, TypeScript, and Tailwind.",
      fa: "توسعه‌دهنده ارشد فرانت‌اند. رابط‌های پرکارایی با Next.js App Router، Server Components، TypeScript و Tailwind.",
      ar: "مطور واجهات أول. واجهات عالية الأداء مع Next.js App Router وServer Components وTypeScript وTailwind.",
    },
    bullets: {
      en: [
        "Built high-performance UIs with Next.js App Router, Server Components, TypeScript, and Tailwind CSS.",
        "Designed complex UI systems with shadcn/ui and Radix UI; mentored the team on frontend architecture.",
      ],
      fa: [
        "رابط‌های پرکارایی را با Next.js App Router، Server Components، TypeScript و Tailwind CSS ساخت.",
        "سیستم‌های پیچیده UI را با shadcn/ui و Radix UI طراحی کرد و تیم را در معماری فرانت‌اند منتور کرد.",
      ],
      ar: [
        "بنى واجهات عالية الأداء بـ Next.js App Router وServer Components وTypeScript وTailwind CSS.",
        "صمم أنظمة واجهة معقدة بـ shadcn/ui وRadix UI، ووجّه الفريق في معمارية الواجهة.",
      ],
    },
  },
  {
    id: "chadco",
    name: "Chadco",
    group: "previous",
    period: { en: "Mar 2024 — Oct 2024", fa: "مارس ۲۰۲۴ — اکتبر ۲۰۲۴", ar: "مارس ٢٠٢٤ — أكتوبر ٢٠٢٤" },
    place: iran,
    role: {
      en: "Senior Front-End Developer",
      fa: "توسعه‌دهنده ارشد فرانت‌اند",
      ar: "مطور واجهات أول",
    },
    mat: "#3f6b3a",
    summary: {
      en: "Senior front-end developer on scalable React and Next.js apps, and de-facto product manager across multiple products.",
      fa: "توسعه‌دهنده ارشد فرانت‌اند روی اپ‌های مقیاس‌پذیر React و Next.js، و در عمل مدیر محصول چند محصول.",
      ar: "مطور واجهات أول لتطبيقات React وNext.js القابلة للتوسع، ومدير منتج بحكم الواقع عبر عدة منتجات.",
    },
    bullets: {
      en: [
        "Built scalable apps with React, Next.js, and TypeScript; established reusable components and frontend best practices.",
        "Contributed to product roadmap decisions as de-facto Product Manager across multiple products.",
      ],
      fa: [
        "اپ‌های مقیاس‌پذیر را با React، Next.js و TypeScript ساخت و کامپوننت‌های قابل‌استفاده مجدد و روش‌های درست فرانت‌اند را پایه گذاشت.",
        "به‌عنوان مدیر محصول در عمل، در تصمیم‌های نقشه راه چند محصول مشارکت کرد.",
      ],
      ar: [
        "بنى تطبيقات قابلة للتوسع بـ React وNext.js وTypeScript، وأرسى مكونات قابلة لإعادة الاستخدام وممارسات واجهة أفضل.",
        "ساهم في قرارات خارطة طريق المنتج كمدير منتج بحكم الواقع عبر عدة منتجات.",
      ],
    },
  },
  {
    id: "tripsi",
    name: "TripSi",
    group: "previous",
    period: { en: "Jan 2020 — Feb 2024", fa: "ژانویه ۲۰۲۰ — فوریه ۲۰۲۴", ar: "يناير ٢٠٢٠ — فبراير ٢٠٢٤" },
    place: shiraz,
    role: { en: "Full-Stack Engineer", fa: "مهندس فول‌استک", ar: "مهندس فل ستاك" },
    mat: "#e6a21a",
    summary: {
      en: "Full-stack engineer for four years, owning web and mobile products from the interface through Node.js services and SQL/NoSQL data.",
      fa: "چهار سال مهندس فول‌استک؛ مالک محصول وب و موبایل از رابط کاربری تا سرویس‌های Node.js و داده‌های SQL و NoSQL.",
      ar: "مهندس فل ستاك لأربع سنوات، يملك منتجات الويب والموبايل من الواجهة حتى خدمات Node.js وبيانات SQL وNoSQL.",
    },
    bullets: {
      en: [
        "Owned web and mobile products end-to-end — React/Next.js/Tailwind front ends, Node.js services, SQL and NoSQL data layers.",
        "Drove system architecture, technical planning, and deployment across the full 4-year product lifecycle.",
      ],
      fa: [
        "محصولات وب و موبایل را از ابتدا تا انتها در اختیار داشت: فرانت‌اند React و Next.js و Tailwind، سرویس‌های Node.js، و لایه‌های SQL و NoSQL.",
        "معماری سیستم، برنامه‌ریزی فنی و استقرار را در کل چرخه چهارساله محصول پیش برد.",
      ],
      ar: [
        "ملك منتجات الويب والموبايل من طرف إلى طرف: واجهات React وNext.js وTailwind، وخدمات Node.js، وطبقات SQL وNoSQL.",
        "قاد معمارية النظام والتخطيط التقني والنشر عبر دورة المنتج الكاملة لأربع سنوات.",
      ],
    },
  },
  {
    id: "stogite",
    name: "Stogite",
    href: "https://stogite.com",
    group: "selected",
    period: { en: "2026", fa: "۲۰۲۶", ar: "٢٠٢٦" },
    place: null,
    role: { en: "Builder", fa: "سازنده", ar: "البنّاء" },
    mat: "#6b3a5d",
    summary: {
      en: "His own product: a private journal. Speak or type moments through the day and Stogite weaves them into a continuing narrative, with comic panels added to that same date.",
      fa: "محصول خودش: یک ژورنال خصوصی. لحظه‌های روز را بگویید یا بنویسید؛ Stogite آن‌ها را به یک روایت پیوسته می‌بافد و پنل کمیک را به همان تاریخ اضافه می‌کند.",
      ar: "منتجه الخاص: يوميات خاصة. انطق أو اكتب لحظات اليوم، فينسجها Stogite في سرد متصل ويضيف لوحات مصورة إلى التاريخ نفسه.",
    },
    bullets: {
      en: [
        "Speak or type a walk, a conversation, the coffee before a meeting. The day is written as narrative, not a feed.",
        "Comic panels belong to the same date as the story.",
      ],
      fa: [
        "یک پیاده‌روی، یک گفتگو، یا قهوه قبل از جلسه را بگویید یا تایپ کنید. آن روز به‌صورت روایت نوشته می‌شود، نه یک فید.",
        "پنل‌های کمیک به همان تاریخ داستان تعلق دارند.",
      ],
      ar: [
        "انطق أو اكتب نزهة أو حوارًا أو قهوة قبل اجتماع. يُكتب ذلك اليوم سردًا، لا موجزًا عامًا.",
        "اللوحات المصورة تتبع تاريخ القصة نفسه.",
      ],
    },
  },
  {
    id: "meraas",
    name: "Meraas Gallery",
    href: "https://meraasgallery.com",
    group: "selected",
    period: null,
    place: null,
    role: { en: "Web", fa: "وب", ar: "ويب" },
    mat: "#8a6232",
    summary: {
      en: "The public site of Meraas Gallery: handmade Khatam, saffron cases, and other premium handicrafts, with worldwide shipping and delivery in Qatar.",
      fa: "سایت عمومی Meraas Gallery: خاتم دست‌ساز، جعبه‌های زعفران و صنایع‌دستی ممتاز دیگر، با ارسال جهانی و تحویل در قطر.",
      ar: "الموقع العام لـ Meraas Gallery: خاتم مصنوع يدويًا، وعلب زعفران، وحرف فاخرة أخرى، مع شحن عالمي وتوصيل في قطر.",
    },
    bullets: {
      en: [
        "Retail and wholesale of premium handmade handicrafts.",
        "The resume does not list a separate job title or dates for this site, so the frame stays with the public description and the link.",
      ],
      fa: [
        "خرده‌فروشی و عمده‌فروشی صنایع‌دستی ممتاز دست‌ساز.",
        "رزومه عنوان شغلی جدا یا تاریخ برای این سایت ندارد؛ قاب روی توضیح عمومی و لینک می‌ماند.",
      ],
      ar: [
        "بيع بالتجزئة والجملة لحرف يدوية فاخرة.",
        "السيرة لا تذكر مسمى وظيفيًا منفصلًا أو تواريخ لهذا الموقع، فيبقى الإطار على الوصف العام والرابط.",
      ],
    },
  },
  {
    id: "medagold",
    name: "MedaGold",
    group: "selected",
    period: null,
    place: null,
    role: { en: "Project", fa: "پروژه", ar: "مشروع" },
    mat: "#c6a15b",
    summary: {
      en: "Named with the other selected work in this office. The resume does not include a public URL, dates, or a separate title, so this frame does not add any.",
      fa: "کنار بقیه کارهای انتخابی این دفتر نام برده شده. رزومه لینک عمومی، تاریخ، یا عنوان جدا ندارد و این قاب چیزی به آن اضافه نمی‌کند.",
      ar: "مذكور مع الأعمال المختارة الأخرى في هذا المكتب. السيرة لا تتضمن رابطًا عامًا أو تواريخ أو مسمى منفصلًا، ولهذا لا يضيف الإطار شيئًا.",
    },
    bullets: {
      en: [],
      fa: [],
      ar: [],
    },
  },
  {
    id: "agents",
    name: "AI agents & bots",
    group: "selected",
    period: null,
    place: null,
    role: { en: "Practice", fa: "کار عملی", ar: "ممارسة" },
    mat: "#355c7d",
    summary: {
      en: "Hands-on work with AI agents and bots: specialized roles for research, drafting, and planning, and terminal coding agents where a person stays in the loop. The assistant on this desk answers from local notes. An API key can be configured later; none is required.",
      fa: "کار عملی با عامل‌ها و ربات‌های هوش مصنوعی: نقش‌های تخصصی برای پژوهش، پیش‌نویس و برنامه‌ریزی، و عامل‌های کدنویسی در ترمینال که انسان در حلقه می‌ماند. دستیار همین میز از یادداشت‌های محلی جواب می‌دهد. کلید API را بعداً می‌شود گذاشت؛ لازم نیست.",
      ar: "عمل تطبيقي مع وكلاء الذكاء الاصطناعي والروبوتات: أدوار متخصصة للبحث والصياغة والتخطيط، ووكلاء برمجة في الطرفية يبقى فيها الإنسان داخل الحلقة. مساعد هذا المكتب يجيب من ملاحظات محلية. يمكن ضبط مفتاح API لاحقًا؛ وليس مطلوبًا.",
    },
    bullets: {
      en: [
        "The public writing is about designing workflows: which agent does what, which tools it can use, and where a human stays in the loop.",
        "This office ships the local version of that idea. It does not call a paid API unless ASSISTANT_API_KEY and ASSISTANT_API_URL are both set.",
      ],
      fa: [
        "نوشته‌های عمومی‌اش درباره طراحی جریان کار است: کدام عامل چه می‌کند، به کدام ابزار دسترسی دارد، و انسان کجا در حلقه می‌ماند.",
        "این دفتر نسخه محلی همان ایده را دارد و تا وقتی ASSISTANT_API_KEY و ASSISTANT_API_URL هر دو تنظیم نشده باشند به API پولی وصل نمی‌شود.",
      ],
      ar: [
        "كتابته العامة عن تصميم سير العمل: أي وكيل يفعل ماذا، وأي أدوات يصل إليها، وأين يبقى الإنسان داخل الحلقة.",
        "هذا المكتب ينفّذ النسخة المحلية من الفكرة، ولا يتصل بواجهة مدفوعة إلا إذا ضُبط ASSISTANT_API_KEY وASSISTANT_API_URL معًا.",
      ],
    },
  },
];

export function getProject(id: string): Project | undefined {
  return projects.find((project) => project.id === id);
}

export function projectLines(project: Project, lang: Lang): string[] {
  return [
    project.name,
    project.role[lang],
    project.period?.[lang] ?? "",
    project.place?.[lang] ?? "",
    project.summary[lang],
    ...project.bullets[lang],
    project.href ?? "",
  ].filter(Boolean);
}

const en = {
  bootLine: "The lamp is warming up.",
  simpleMode: "Simple mode",
  roomMode: "Enter the office",
  stepBack: "Step back",
  dockMonitor: "Monitor",
  dockWall: "Projects",
  dockShelf: "Skills",
  dockPhone: "Contact",
  dockAssistant: "Assistant",
  hintRoom: "Click the monitor, a frame, the shelf, or the phone. Esc steps back.",
  skillsTitle: "Skills",
  contactTitle: "Contact",
  projectsTitle: "Projects",
  currentTitle: "Current engagements",
  previousTitle: "Previous experience",
  selectedTitle: "Selected work",
  educationTitle: "Education",
  leadershipTitle: "Leadership",
  stackTitle: "Stack",
  openLink: "Open link",
  close: "Close",
  resumeTitle: "Resume",
  resumeDownload: "Download resume",
  aboutTitle: "About",
  osLeave: "Leave the desk",
  terminalWelcome: "ShahrokhOS — type help",
  terminalPlaceholder: "help, whoami, projects, contact",
  assistantTitle: "Desk assistant",
  assistantIntro:
    "Ask about Adib — roles, projects, the stack, or how to reach him. Answers come from notes on this desk.",
  assistantPlaceholder: "Ask about Shahrokh…",
  assistantSend: "Send",
  assistantThinking: "Looking it up…",
  suggestions: ["Who is Shahrokh?", "What is he working on now?", "How do I contact him?"],
  footerNote: "Poly Haven textures (CC0). No paid API required.",
  soundOn: "Room tone",
  soundOff: "Mute room",
  loadingOffice: "Loading the office",
  nowBadge: "Now",
  noPublicLink: "No public link on the resume.",
  tryAgain: "Try again",
  errorTitle: "The office hit a snag.",
  skip: "Skip to content",
  simpleLead: "A fast reading of the same office, without the 3D room.",
  desktopCaption: "Folders on the desk. Open one.",
  langLabel: "Language",
  email: "Email",
  phone: "Phone",
  linkedin: "LinkedIn",
  github: "GitHub",
  locationLabel: "Location",
  terminalHelpHint: "Type help to see commands.",
  assistantEmpty: "Ask a question about Adib.",
  assistantFallback:
    "I can answer from the notes on this desk: Hubly, Glonova, Sazeh Peyvand, Sepanja, Chadco, TripSi, Stogite, Meraas Gallery, MedaGold, AI agents, the stack, education, and contact.",
  osClock: "local time",
  groupLabel: {
    current: "Now",
    previous: "Earlier",
    selected: "Selected",
  } as Record<Project["group"], string>,
};

export const ui: Record<Lang, typeof en> = {
  en,
  fa: {
    bootLine: "چراغ رومیزی روشن می‌شود.",
    simpleMode: "حالت ساده",
    roomMode: "ورود به دفتر",
    stepBack: "یک قدم عقب",
    dockMonitor: "مانیتور",
    dockWall: "پروژه‌ها",
    dockShelf: "مهارت‌ها",
    dockPhone: "تماس",
    dockAssistant: "دستیار",
    hintRoom: "مانیتور، یک قاب، قفسه یا تلفن را بزنید. Esc برمی‌گرداند.",
    skillsTitle: "مهارت‌ها",
    contactTitle: "تماس",
    projectsTitle: "پروژه‌ها",
    currentTitle: "همکاری‌های جاری",
    previousTitle: "تجربه قبلی",
    selectedTitle: "کارهای انتخابی",
    educationTitle: "تحصیلات",
    leadershipTitle: "رهبری",
    stackTitle: "پشته",
    openLink: "باز کردن لینک",
    close: "بستن",
    resumeTitle: "رزومه",
    resumeDownload: "دانلود رزومه",
    aboutTitle: "درباره",
    osLeave: "ترک میز",
    terminalWelcome: "ShahrokhOS — بنویسید help",
    terminalPlaceholder: "help، whoami، projects، contact",
    assistantTitle: "دستیار میز",
    assistantIntro:
      "درباره ادیب بپرسید: نقش‌ها، پروژه‌ها، مهارت‌ها، یا راه تماس. پاسخ‌ها از یادداشت‌های روی همین میز می‌آیند.",
    assistantPlaceholder: "درباره شاهرخ بپرسید…",
    assistantSend: "بفرست",
    assistantThinking: "دارم در یادداشت‌ها می‌گردم…",
    suggestions: ["شاهرخ کیست؟", "الان روی چه چیزی کار می‌کند؟", "چطور با او تماس بگیرم؟"],
    footerNote: "بافت‌ها از Poly Haven (CC0). API پولی لازم نیست.",
    soundOn: "صدای اتاق",
    soundOff: "قطع صدا",
    loadingOffice: "دفتر در حال بار شدن است",
    nowBadge: "اکنون",
    noPublicLink: "در رزومه لینک عمومی نیست.",
    tryAgain: "دوباره",
    errorTitle: "دفتر به یک گیر خورد.",
    skip: "پرش به محتوا",
    simpleLead: "همان دفتر، برای خواندن سریع، بدون اتاق سه‌بعدی.",
    desktopCaption: "پوشه‌ها روی میز است. یکی را باز کنید.",
    langLabel: "زبان",
    email: "ایمیل",
    phone: "تلفن",
    linkedin: "لینکدین",
    github: "گیت‌هاب",
    locationLabel: "مکان",
    terminalHelpHint: "برای دیدن فرمان‌ها help را بنویسید.",
    assistantEmpty: "یک سؤال درباره ادیب بپرسید.",
    assistantFallback:
      "از یادداشت‌های همین میز می‌توانم درباره Hubly، Glonova، سازه‌پیوند، سپنجا، Chadco، TripSi، Stogite، Meraas Gallery، MedaGold، عامل‌های هوش مصنوعی، مهارت‌ها، تحصیل و تماس جواب بدهم.",
    osClock: "ساعت محلی",
    groupLabel: { current: "اکنون", previous: "قبلی", selected: "انتخابی" },
  },
  ar: {
    bootLine: "المصباح يدفأ.",
    simpleMode: "الوضع البسيط",
    roomMode: "ادخل المكتب",
    stepBack: "ارجع خطوة",
    dockMonitor: "الشاشة",
    dockWall: "المشاريع",
    dockShelf: "المهارات",
    dockPhone: "التواصل",
    dockAssistant: "المساعد",
    hintRoom: "انقر الشاشة أو إطارًا أو الرف أو الهاتف. Esc يرجعك.",
    skillsTitle: "المهارات",
    contactTitle: "التواصل",
    projectsTitle: "المشاريع",
    currentTitle: "الأعمال الحالية",
    previousTitle: "الخبرة السابقة",
    selectedTitle: "أعمال مختارة",
    educationTitle: "الدراسة",
    leadershipTitle: "القيادة",
    stackTitle: "التقنيات",
    openLink: "افتح الرابط",
    close: "إغلاق",
    resumeTitle: "السيرة",
    resumeDownload: "تنزيل السيرة",
    aboutTitle: "نبذة",
    osLeave: "غادر المكتب",
    terminalWelcome: "ShahrokhOS — اكتب help",
    terminalPlaceholder: "help، whoami، projects، contact",
    assistantTitle: "مساعد المكتب",
    assistantIntro:
      "اسأل عن أديب: الأدوار، المشاريع، المهارات، أو طريقة التواصل. الإجابات من ملاحظات على هذا المكتب.",
    assistantPlaceholder: "اسأل عن شاهرخ…",
    assistantSend: "إرسال",
    assistantThinking: "أبحث في الملاحظات…",
    suggestions: ["من هو شاهرخ؟", "على ماذا يعمل الآن؟", "كيف أتواصل معه؟"],
    footerNote: "الخامات من Poly Haven (CC0). بلا واجهة مدفوعة.",
    soundOn: "صوت الغرفة",
    soundOff: "كتم الصوت",
    loadingOffice: "المكتب يُحمَّل",
    nowBadge: "الآن",
    noPublicLink: "لا يوجد رابط عام في السيرة.",
    tryAgain: "حاول مجددًا",
    errorTitle: "تعثر المكتب.",
    skip: "تخطَّ إلى المحتوى",
    simpleLead: "القراءة السريعة للمكتب نفسه، من غير الغرفة ثلاثية الأبعاد.",
    desktopCaption: "المجلدات على المكتب. افتح واحدًا.",
    langLabel: "اللغة",
    email: "البريد",
    phone: "الهاتف",
    linkedin: "لينكدإن",
    github: "غيت هب",
    locationLabel: "المكان",
    terminalHelpHint: "اكتب help لرؤية الأوامر.",
    assistantEmpty: "اسأل سؤالًا عن أديب.",
    assistantFallback:
      "أجيب من ملاحظات هذا المكتب: Hubly وGlonova وSazeh Peyvand وSepanja وChadco وTripSi وStogite وMeraas Gallery وMedaGold ووكلاء الذكاء الاصطناعي والمهارات والدراسة والتواصل.",
    osClock: "التوقيت المحلي",
    groupLabel: { current: "الآن", previous: "سابق", selected: "مختار" },
  },
};

export function localeTag(lang: Lang): string {
  if (lang === "fa") return "fa-IR";
  if (lang === "ar") return "ar";
  return "en-GB";
}
