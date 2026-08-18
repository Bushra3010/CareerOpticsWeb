/**
 * Navigation maps — PRD §4 routes, §5.1 header/footer content.
 * Course slugs here must match `courses.slug` in the seed.
 */

export type NavLink = { label: string; href: string; badge?: string };

/** Dark chip bar over the hero (§5.1 item 3). */
export const courseChips: NavLink[] = [
  { label: "All Courses", href: "/courses" },
  { label: "B.Tech", href: "/courses/b-tech" },
  { label: "MBA", href: "/courses/mba" },
  { label: "M.Tech", href: "/courses/m-tech" },
  { label: "MBBS", href: "/courses/mbbs" },
  { label: "B.Com", href: "/courses/b-com" },
  { label: "B.Sc", href: "/courses/b-sc" },
  { label: "B.Sc Nursing", href: "/courses/bsc-nursing" },
  { label: "BA", href: "/courses/ba" },
  { label: "BBA", href: "/courses/bba" },
  { label: "BCA", href: "/courses/bca" },
];

export const courseChipsTrailing: NavLink[] = [
  { label: "Study Abroad", href: "/contact" },
  { label: "Course Finder", href: "/college-finder", badge: "NEW" },
];

/** Primary destinations, also used by the mobile drawer. */
export const mainNav: NavLink[] = [
  { label: "Colleges", href: "/colleges" },
  { label: "Courses", href: "/courses" },
  { label: "Exams", href: "/exams" },
  { label: "Scholarships", href: "/scholarships" },
  { label: "College Finder", href: "/college-finder", badge: "NEW" },
  { label: "Blogs", href: "/blogs" },
];

export const levelNav: NavLink[] = [
  { label: "After 10th", href: "/after-10th" },
  { label: "After 12th", href: "/after-12th" },
  { label: "After Graduation", href: "/after-graduation" },
  { label: "After PG", href: "/after-pg" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Placements", href: "/placements" },
      { label: "Gallery", href: "/gallery" },
      { label: "Press Release", href: "/press-release" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Colleges", href: "/colleges" },
      { label: "Courses", href: "/courses" },
      { label: "Exams", href: "/exams" },
      { label: "Scholarships", href: "/scholarships" },
      { label: "College Finder", href: "/college-finder" },
      // The main nav only reaches /blogs through the mobile drawer, which is
      // lazy-loaded and so absent from the server HTML. Without this link the
      // blog is unreachable for a crawler.
      { label: "Blogs", href: "/blogs" },
    ],
  },
  {
    title: "Get Help",
    links: [
      { label: "Help & Support", href: "/help-support" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "News", href: "/news" },
    ],
  },
];

export const offices = [
  {
    city: "Arrah (Head Office)",
    address:
      "Near Kshatriya School Road, Bandhan Tola, Maharaja Hata, Nawada, Thana, Arrah, Bihar 802301",
  },
  {
    city: "Buxar",
    address: "Jeevika Office, Buniyadi Mod, Near DAV School, Buxar, Bihar",
  },
];

/** Query string for the footer's Google Maps embed. */
export const mapQuery =
  "Kshatriya School Road, Maharaja Hata, Nawada, Arrah, Bihar 802301";
