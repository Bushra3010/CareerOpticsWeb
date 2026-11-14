// First four CareerOptics blog posts. Content uses the light markdown the site
// renders (## headings, - bullets, **bold**). Covers are the client's banners.
// Edit or unpublish any of these from /admin/blogs.

const AUTHOR = "CareerOptics Counselling Team";
const BANNER = (file) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/banners/${file}`;

export const POSTS = [
  {
    slug: "bihar-student-credit-card-scheme-guide",
    title: "Bihar Student Credit Card Scheme 2026: Eligibility, Documents and How to Apply",
    excerpt:
      "An education loan of up to ₹4 lakh at 4% interest — who can apply, which documents you need, and how the DRCC process works, step by step.",
    category: "Scholarships & Loans",
    tags: ["Bihar Student Credit Card", "BSCC", "Education Loan", "Bihar"],
    read_minutes: 6,
    published_at: "2026-11-12",
    cover: "hero-bscc-admission-open.webp",
    meta_description:
      "Bihar Student Credit Card Scheme explained: up to ₹4 lakh education loan at 4% interest, eligibility, documents, DRCC process and how CareerOptics helps you apply.",
    content: `For many families in Bihar, the biggest question after Class 12 is not which course to choose — it is how to pay for it. The **Bihar Student Credit Card Scheme (BSCC)** exists for exactly this. It gives an education loan of **up to ₹4 lakh** so a student can take admission without the family selling land or borrowing at high interest.

## What the scheme offers

- An education loan of **up to ₹4 lakh** for higher education after Class 12
- **4% simple interest** per year
- Only **1% interest** for girls, transgender students and differently-abled students
- The loan is guaranteed by the Bihar government through the Bihar State Education Finance Corporation, so the family does not need to give any security
- Fees, and for many courses hostel and study expenses, can be covered within the limit

## Who is eligible

- You must be a **permanent resident of Bihar**
- You must have **passed Class 12** from a recognised board
- You must be taking admission in a **recognised institution** for a degree, diploma or other approved professional course
- You should be **under 25 years of age** at the time of applying

## Documents you will need

- Aadhaar card of the student and the co-applicant (usually a parent)
- Class 10 and Class 12 marksheets and certificates
- Admission letter from the college or university
- Fee structure issued by the institution
- Residence certificate of Bihar
- Bank account details and PAN card
- Passport-size photographs of the student and the co-applicant

## How to apply

- **Register online** on the official Bihar Student Credit Card portal and fill in the application form
- **Book a slot** at your District Registration and Counselling Centre (DRCC)
- **Visit the DRCC** on your date with all original documents for verification
- After verification the application goes to the Bihar State Education Finance Corporation for **sanction**
- Once sanctioned, the fee is paid **directly to your college** as per its fee schedule

## Repayment

You do not repay while you study. Repayment begins **after the course ends or once you start working, whichever is earlier**, in easy monthly instalments. Always check the latest repayment terms on the official portal, as the government revises them from time to time.

## Mistakes that get applications rejected

- Choosing a college or course that is **not on the approved list** for the scheme
- Spelling or date-of-birth **mismatches** between Aadhaar and marksheets
- Missing the **fee structure** on the college letterhead
- Reaching the DRCC without **original documents**

## How CareerOptics helps

Our counsellors help you pick a college that is approved under the scheme, prepare every document, fill the online form and get ready for DRCC verification — **free of charge for students**. We work with partner universities across Bihar, Uttar Pradesh, Punjab and Rajasthan that accept the Bihar Student Credit Card.

Call or WhatsApp **8252532179** to check your eligibility and get a shortlist of BSCC-approved colleges for your course.`,
  },
  {
    slug: "up-b-ed-admission-guide",
    title: "UP B.Ed Admission: Eligibility, Entrance Exam and the CareerOptics Package",
    excerpt:
      "Want to become a teacher in Uttar Pradesh? Here is who can apply for B.Ed, how the entrance and counselling work, and what our ₹65,000 all-inclusive package covers.",
    category: "Teaching Courses",
    tags: ["B.Ed", "Uttar Pradesh", "Teaching", "Admission"],
    read_minutes: 5,
    published_at: "2026-11-10",
    cover: "hero-bed-up.webp",
    meta_description:
      "UP B.Ed admission guide: eligibility, entrance exam, counselling, career scope, and the CareerOptics ₹65,000 package with books, exam-time travel and free counselling.",
    content: `A **B.Ed (Bachelor of Education)** is the professional degree you need to teach in upper primary and secondary schools. In Uttar Pradesh it is one of the most popular routes to a stable teaching career — and with the right guidance, it is also one of the most affordable.

## What is B.Ed?

- A **two-year** professional degree, with semester exams
- Recognised by the **NCTE** (National Council for Teacher Education)
- Prepares you to teach **classes 6 to 10**; with a postgraduate degree in your subject, it also opens the way to teaching higher classes
- Includes school internship and practice teaching

## Who can apply

- You need a **graduation or post-graduation** degree from a recognised university
- Generally a minimum of **50% marks** is required (**45%** for reserved categories), as per NCTE norms
- Students in the final year of graduation can usually apply and submit the result later — confirm this in the current year's notification

## How admission works in UP

- Admission to government-aided and self-financed B.Ed colleges in UP is through the **state B.Ed entrance exam**, conducted every year by a state university nominated by the government
- After the result, candidates take part in **online counselling** and choose colleges by rank
- The exam date, the conducting university and the fee change every year, so always follow the **official notification** for the current session

## Career after B.Ed

- Teaching posts in government and private schools after clearing **TET / CTET**
- Teaching in coaching institutes and online platforms
- With a PG degree, eligibility for **PGT** and lecturer-level posts through the relevant recruitment exams

## The CareerOptics B.Ed package — ₹65,000 total

We offer B.Ed admission in Uttar Pradesh for a **total fee of ₹65,000**, paid in stages:

- **Booking amount** — ₹5,000
- **At counselling** — ₹10,000
- **At the 1st semester exam** — ₹30,000
- **At the 3rd semester exam** — ₹20,000

What is included:

- Online form fill-up support
- Bus or train arrangements at entrance exam time
- Stay facility during semester exams
- Semester-wise or year-wise exam option
- **Free books, notes and syllabus** for both years
- **Free smartphone** after course completion
- **Free counselling** throughout

University options include **Sahu Ji Maharaj University (Kanpur)**, **Chaudhary Charan Singh University (Meerut)** and **Indira Gandhi University (Haryana)**. Seats are limited each session.

Talk to our counsellors on **8252532179** or **7903745881** to check your eligibility and book your seat.`,
  },
  {
    slug: "d-el-ed-vs-b-ed-which-is-right-for-you",
    title: "D.El.Ed or B.Ed — Which Teaching Course Is Right for You?",
    excerpt:
      "Both lead to a teaching career, but they prepare you for different classes. Here is a clear comparison, including the 2023 Supreme Court ruling every aspiring primary teacher should know.",
    category: "Teaching Courses",
    tags: ["D.El.Ed", "B.Ed", "Teaching", "TET", "CTET"],
    read_minutes: 5,
    published_at: "2026-11-08",
    cover: "hero-deled-up.webp",
    meta_description:
      "D.El.Ed vs B.Ed compared: which classes you can teach, duration, eligibility, TET/CTET papers and the 2023 Supreme Court ruling on B.Ed for primary teachers.",
    content: `If you want to become a teacher, the first decision is between **D.El.Ed** and **B.Ed**. Many students treat them as the same thing. They are not — each one prepares you to teach a different age group, and choosing the wrong one can close the door to the jobs you actually want.

## D.El.Ed at a glance

- **Diploma in Elementary Education** — a two-year course (earlier called BTC in Uttar Pradesh)
- Trains you to teach **primary classes 1 to 5**
- Leads to **CTET / TET Paper 1**, which is required for primary teacher recruitment
- In **Uttar Pradesh, graduation is required** to apply for D.El.Ed

## B.Ed at a glance

- **Bachelor of Education** — a two-year degree after graduation
- Trains you to teach **classes 6 to 8** (upper primary) and **classes 9 to 10** (secondary)
- Leads to **CTET / TET Paper 2** for upper primary posts
- With a postgraduate degree in your subject, opens the way to higher-class teaching posts

## The Supreme Court ruling you must know

In **August 2023** the Supreme Court held that **B.Ed graduates are not eligible for primary teacher (classes 1 to 5) posts** — those posts require D.El.Ed or an equivalent elementary teacher-training qualification.

So the choice is simple:

- If you want to teach **young children in primary school**, choose **D.El.Ed**
- If you want to teach **middle and secondary classes**, choose **B.Ed**

## Side-by-side

- **Classes you can teach** — D.El.Ed: 1 to 5; B.Ed: 6 to 10
- **Duration** — both are two years
- **Eligibility exam after the course** — D.El.Ed: TET/CTET Paper 1; B.Ed: TET/CTET Paper 2
- **Typical jobs** — D.El.Ed: primary teacher; B.Ed: TGT and upper primary teacher

## Can I do both?

Yes. Many teachers complete one and then the other to widen their options. If you already have graduation, you can start with either — think about which classes you enjoy teaching and which recruitments are coming up in your state.

## How CareerOptics helps

We guide students through **UP D.El.Ed** admission in PNP-approved, NCTE-recognised colleges, with practice-teaching support, free study books and stay during examinations — and through **UP B.Ed** admission with our all-inclusive package.

Not sure which course fits you? Call **8252532179** and a counsellor will walk you through it — free.`,
  },
  {
    slug: "are-distance-and-online-degrees-valid",
    title: "Are Distance and Online Degrees Valid? What UGC Rules Say",
    excerpt:
      "Studying from home is now a mainstream option — if the university is approved. Here is how to check approval, which courses can be done by distance, and how to avoid fake universities.",
    category: "Distance & Online",
    tags: ["Distance Education", "Online Degree", "UGC-DEB", "ODL"],
    read_minutes: 5,
    published_at: "2026-11-05",
    cover: "hero-distance-online.webp",
    meta_description:
      "Are distance and online degrees valid? UGC rules on ODL and online degrees, how to check UGC-DEB approval, which courses are not allowed by distance, and fee examples.",
    content: `Working, preparing for a government exam, or living far from a good college — for many students, studying from home is the only practical way to earn a degree. The question we hear most often is simple: **is a distance or online degree actually valid?**

## The short answer

**Yes — if the university is approved for the programme you are taking.** Under UGC regulations, degrees earned through **Open and Distance Learning (ODL)** or **online mode** from a recognised university that holds the required approval are treated as **equivalent to regular degrees**.

The catch is the word *approved*. A degree from a university that does not hold approval for that programme, in that mode, for that year, may not be accepted for jobs or further study.

## How to check if a university is approved

- Open the **UGC-DEB** (Distance Education Bureau) website at deb.ugc.ac.in
- Look up the university in the list of **recognised HEIs** for the current academic year
- Check that your **exact programme** (for example BA, B.Com, MBA) is listed, in the **mode** you are joining — ODL or online
- Prefer universities with **NAAC accreditation**

## Courses you cannot do by distance

UGC does not allow professional programmes that need regular practical training to be offered by distance or online mode. These include:

- Engineering and technology
- Medicine, dental, pharmacy, nursing and paramedical courses
- Law and architecture
- Agriculture and similar practice-based programmes

If anyone offers these "by distance", treat it as a warning sign.

## ODL vs online — what is the difference?

- **ODL (distance)** — printed or digital study material, contact classes at study centres, exams at centres
- **Online** — live and recorded classes, digital study material, and exams conducted online or at designated centres
- Both lead to a **degree of the same value** when the university is approved

## What it costs

Distance and online programmes cost a fraction of regular fees. For example, at **Mangalayatan University** (NAAC A+), the distance BA is about **₹4,800 per year** and the B.Com about **₹7,000 per year**, plus small registration and exam fees. Check the **Courses & Fees** page of each university on our website for current figures.

## How CareerOptics helps

We offer admission guidance for distance and online **BA, B.Sc, B.Com, BBA, BCA, MBA, MCA, PGDCA and B.Lib / B.LIS** through approved universities including **Mata Tripurari Sundari University**, **Mangalayatan University (Aligarh)** and **Vivekananda Global University** — with help on course selection, documents and the full admission process.

Call **8252532179** to find the right programme for your schedule and budget.`,
  },
];

export { AUTHOR, BANNER };
