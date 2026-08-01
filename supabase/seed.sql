-- CareerOptics — v1 seed data (PRD §14)
--
-- ⚠ THE COLLEGE METRICS BELOW ARE PLACEHOLDER DEMO VALUES.
-- Institution names are real so the site is testable end to end, but every
-- NAAC grade, NIRF rank, package figure, fee, seat count and rating here is
-- invented for development. Replace all of it with verified data from the
-- partner list before production (see PRD §17 launch checklist) — publishing
-- invented accreditation or placement numbers about a named institution is
-- both a legal and a trust problem.
--
-- Idempotent: safe to re-run. Slugs are the natural key.

begin;

-- ─────────────────────────────────────────────────────────────
-- States & UTs (36)
-- ─────────────────────────────────────────────────────────────
insert into states (name, slug) values
  ('Andhra Pradesh','andhra-pradesh'),
  ('Arunachal Pradesh','arunachal-pradesh'),
  ('Assam','assam'),
  ('Bihar','bihar'),
  ('Chhattisgarh','chhattisgarh'),
  ('Goa','goa'),
  ('Gujarat','gujarat'),
  ('Haryana','haryana'),
  ('Himachal Pradesh','himachal-pradesh'),
  ('Jharkhand','jharkhand'),
  ('Karnataka','karnataka'),
  ('Kerala','kerala'),
  ('Madhya Pradesh','madhya-pradesh'),
  ('Maharashtra','maharashtra'),
  ('Manipur','manipur'),
  ('Meghalaya','meghalaya'),
  ('Mizoram','mizoram'),
  ('Nagaland','nagaland'),
  ('Odisha','odisha'),
  ('Punjab','punjab'),
  ('Rajasthan','rajasthan'),
  ('Sikkim','sikkim'),
  ('Tamil Nadu','tamil-nadu'),
  ('Telangana','telangana'),
  ('Tripura','tripura'),
  ('Uttar Pradesh','uttar-pradesh'),
  ('Uttarakhand','uttarakhand'),
  ('West Bengal','west-bengal'),
  ('Andaman and Nicobar Islands','andaman-and-nicobar-islands'),
  ('Chandigarh','chandigarh'),
  ('Dadra and Nagar Haveli and Daman and Diu','dadra-and-nagar-haveli-and-daman-and-diu'),
  ('Delhi','delhi'),
  ('Jammu and Kashmir','jammu-and-kashmir'),
  ('Ladakh','ladakh'),
  ('Lakshadweep','lakshadweep'),
  ('Puducherry','puducherry')
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Cities (120) — Bihar-weighted, matching the primary market
-- ─────────────────────────────────────────────────────────────
insert into cities (state_id, name, slug)
select s.id, v.name, v.slug
from (values
  -- Bihar (20)
  ('bihar','Patna','patna'),
  ('bihar','Gaya','gaya'),
  ('bihar','Bhagalpur','bhagalpur'),
  ('bihar','Muzaffarpur','muzaffarpur'),
  ('bihar','Darbhanga','darbhanga'),
  ('bihar','Purnia','purnia'),
  ('bihar','Ara','ara'),
  ('bihar','Begusarai','begusarai'),
  ('bihar','Katihar','katihar'),
  ('bihar','Munger','munger'),
  ('bihar','Chapra','chapra'),
  ('bihar','Bettiah','bettiah'),
  ('bihar','Motihari','motihari'),
  ('bihar','Saharsa','saharsa'),
  ('bihar','Sasaram','sasaram'),
  ('bihar','Hajipur','hajipur'),
  ('bihar','Dehri','dehri'),
  ('bihar','Siwan','siwan'),
  ('bihar','Bihar Sharif','bihar-sharif'),
  ('bihar','Nawada','nawada'),
  -- Uttar Pradesh (10)
  ('uttar-pradesh','Lucknow','lucknow'),
  ('uttar-pradesh','Kanpur','kanpur'),
  ('uttar-pradesh','Varanasi','varanasi'),
  ('uttar-pradesh','Prayagraj','prayagraj'),
  ('uttar-pradesh','Agra','agra'),
  ('uttar-pradesh','Meerut','meerut'),
  ('uttar-pradesh','Noida','noida'),
  ('uttar-pradesh','Ghaziabad','ghaziabad'),
  ('uttar-pradesh','Gorakhpur','gorakhpur'),
  ('uttar-pradesh','Aligarh','aligarh'),
  -- Delhi (1)
  ('delhi','New Delhi','new-delhi'),
  -- Maharashtra (8)
  ('maharashtra','Mumbai','mumbai'),
  ('maharashtra','Pune','pune'),
  ('maharashtra','Nagpur','nagpur'),
  ('maharashtra','Nashik','nashik'),
  ('maharashtra','Chhatrapati Sambhajinagar','chhatrapati-sambhajinagar'),
  ('maharashtra','Thane','thane'),
  ('maharashtra','Kolhapur','kolhapur'),
  ('maharashtra','Navi Mumbai','navi-mumbai'),
  -- Karnataka (6)
  ('karnataka','Bengaluru','bengaluru'),
  ('karnataka','Mysuru','mysuru'),
  ('karnataka','Mangaluru','mangaluru'),
  ('karnataka','Hubballi','hubballi'),
  ('karnataka','Belagavi','belagavi'),
  ('karnataka','Manipal','manipal'),
  -- Tamil Nadu (7)
  ('tamil-nadu','Chennai','chennai'),
  ('tamil-nadu','Coimbatore','coimbatore'),
  ('tamil-nadu','Madurai','madurai'),
  ('tamil-nadu','Tiruchirappalli','tiruchirappalli'),
  ('tamil-nadu','Salem','salem'),
  ('tamil-nadu','Vellore','vellore'),
  ('tamil-nadu','Erode','erode'),
  -- Telangana (4)
  ('telangana','Hyderabad','hyderabad'),
  ('telangana','Warangal','warangal'),
  ('telangana','Karimnagar','karimnagar'),
  ('telangana','Nizamabad','nizamabad'),
  -- Andhra Pradesh (5)
  ('andhra-pradesh','Visakhapatnam','visakhapatnam'),
  ('andhra-pradesh','Vijayawada','vijayawada'),
  ('andhra-pradesh','Guntur','guntur'),
  ('andhra-pradesh','Tirupati','tirupati'),
  ('andhra-pradesh','Nellore','nellore'),
  -- West Bengal (5)
  ('west-bengal','Kolkata','kolkata'),
  ('west-bengal','Howrah','howrah'),
  ('west-bengal','Durgapur','durgapur'),
  ('west-bengal','Siliguri','siliguri'),
  ('west-bengal','Kharagpur','kharagpur'),
  -- Jharkhand (5)
  ('jharkhand','Ranchi','ranchi'),
  ('jharkhand','Jamshedpur','jamshedpur'),
  ('jharkhand','Dhanbad','dhanbad'),
  ('jharkhand','Bokaro Steel City','bokaro-steel-city'),
  ('jharkhand','Deoghar','deoghar'),
  -- Rajasthan (5)
  ('rajasthan','Jaipur','jaipur'),
  ('rajasthan','Jodhpur','jodhpur'),
  ('rajasthan','Udaipur','udaipur'),
  ('rajasthan','Kota','kota'),
  ('rajasthan','Ajmer','ajmer'),
  -- Madhya Pradesh (5)
  ('madhya-pradesh','Bhopal','bhopal'),
  ('madhya-pradesh','Indore','indore'),
  ('madhya-pradesh','Gwalior','gwalior'),
  ('madhya-pradesh','Jabalpur','jabalpur'),
  ('madhya-pradesh','Ujjain','ujjain'),
  -- Gujarat (5)
  ('gujarat','Ahmedabad','ahmedabad'),
  ('gujarat','Surat','surat'),
  ('gujarat','Vadodara','vadodara'),
  ('gujarat','Rajkot','rajkot'),
  ('gujarat','Gandhinagar','gandhinagar'),
  -- Punjab (5)
  ('punjab','Ludhiana','ludhiana'),
  ('punjab','Amritsar','amritsar'),
  ('punjab','Jalandhar','jalandhar'),
  ('punjab','Patiala','patiala'),
  ('punjab','Mohali','mohali'),
  -- Haryana (5)
  ('haryana','Gurugram','gurugram'),
  ('haryana','Faridabad','faridabad'),
  ('haryana','Panipat','panipat'),
  ('haryana','Hisar','hisar'),
  ('haryana','Ambala','ambala'),
  -- Kerala (4)
  ('kerala','Kochi','kochi'),
  ('kerala','Thiruvananthapuram','thiruvananthapuram'),
  ('kerala','Kozhikode','kozhikode'),
  ('kerala','Thrissur','thrissur'),
  -- Odisha (4)
  ('odisha','Bhubaneswar','bhubaneswar'),
  ('odisha','Cuttack','cuttack'),
  ('odisha','Rourkela','rourkela'),
  ('odisha','Sambalpur','sambalpur'),
  -- Assam (3)
  ('assam','Guwahati','guwahati'),
  ('assam','Silchar','silchar'),
  ('assam','Dibrugarh','dibrugarh'),
  -- Chhattisgarh (3)
  ('chhattisgarh','Raipur','raipur'),
  ('chhattisgarh','Bhilai','bhilai'),
  ('chhattisgarh','Bilaspur','bilaspur'),
  -- Uttarakhand (3)
  ('uttarakhand','Dehradun','dehradun'),
  ('uttarakhand','Haridwar','haridwar'),
  ('uttarakhand','Roorkee','roorkee'),
  -- Himachal Pradesh (2)
  ('himachal-pradesh','Shimla','shimla'),
  ('himachal-pradesh','Solan','solan'),
  -- Jammu and Kashmir (2)
  ('jammu-and-kashmir','Srinagar','srinagar'),
  ('jammu-and-kashmir','Jammu','jammu'),
  -- Single-city states/UTs (3)
  ('goa','Panaji','panaji'),
  ('chandigarh','Chandigarh','chandigarh-city'),
  ('puducherry','Puducherry','puducherry-city')
) as v(state_slug, name, slug)
join states s on s.slug = v.state_slug
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Streams (10)
-- ─────────────────────────────────────────────────────────────
insert into streams (name, slug, icon, description, sort_order, is_featured) values
  ('Engineering','engineering','cpu','B.Tech, M.Tech, diploma and computer application programmes across every branch.',1,true),
  ('Management','management','briefcase','MBA, BBA and PGDM programmes with finance, marketing and HR specialisations.',2,true),
  ('Medical','medical','stethoscope','MBBS, BDS, AYUSH, pharmacy and nursing programmes across India.',3,true),
  ('Commerce','commerce','calculator','B.Com, M.Com and professional accounting routes such as CA, CMA and CS.',4,true),
  ('Science','science','flask-conical','B.Sc and M.Sc programmes in physics, chemistry, maths and biotechnology.',5,true),
  ('Arts','arts','palette','BA, MA, psychology and mass communication programmes.',6,true),
  ('Law','law','scale','LLB, LLM and five-year integrated law programmes.',7,true),
  ('Agriculture','agriculture','sprout','B.Sc Agriculture, agricultural engineering and allied programmes.',8,true),
  ('Design','design','pen-tool','Design, fine arts and architecture programmes.',9,true),
  ('Education','education','graduation-cap','B.Ed, M.Ed and elementary teacher training programmes.',10,false)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Courses (60)
-- ─────────────────────────────────────────────────────────────
insert into courses (name, short_name, slug, stream_id, level, duration_months,
                     eligibility, description, avg_fee_min, avg_fee_max, career_scope, is_featured)
select v.name, v.short_name, v.slug, s.id, v.level::level_enum, v.duration,
       v.eligibility, v.description, v.fee_min, v.fee_max, v.career, v.featured
from (values
  -- Engineering (9)
  ('Bachelor of Technology','B.Tech','b-tech','engineering','ug',48,'10+2 with Physics, Chemistry and Mathematics, minimum 50% aggregate','Four-year undergraduate engineering degree offered across all major branches.',80000,400000,'Software engineer, core engineer, analyst, GATE/PSU roles, higher study abroad.',true),
  ('Master of Technology','M.Tech','m-tech','engineering','pg',24,'B.E./B.Tech in a relevant branch with a valid GATE score','Two-year postgraduate specialisation in an engineering discipline.',60000,300000,'R&D engineer, specialist roles, academia, PSU technical cadre.',true),
  ('Bachelor of Engineering','B.E.','be','engineering','ug',48,'10+2 with Physics, Chemistry and Mathematics','Four-year engineering degree, equivalent to B.Tech at many universities.',80000,350000,'Core and IT engineering roles across industry.',false),
  ('Diploma in Engineering (Polytechnic)','Diploma','diploma-engineering','engineering','diploma',36,'Class 10 pass with Science and Mathematics','Three-year practical engineering diploma with lateral entry into B.Tech.',20000,90000,'Junior engineer, technician, lateral entry to second-year B.Tech.',true),
  ('B.Tech Computer Science and Engineering','B.Tech CSE','b-tech-cse','engineering','ug',48,'10+2 with PCM, minimum 50% aggregate','Computing-focused B.Tech covering algorithms, systems, AI and software engineering.',100000,450000,'Software developer, data engineer, ML engineer, product roles.',true),
  ('B.Tech Mechanical Engineering','B.Tech ME','b-tech-mechanical','engineering','ug',48,'10+2 with PCM, minimum 50% aggregate','Design, thermal and manufacturing engineering.',80000,350000,'Design engineer, production engineer, automotive and PSU roles.',false),
  ('B.Tech Civil Engineering','B.Tech CE','b-tech-civil','engineering','ug',48,'10+2 with PCM, minimum 50% aggregate','Structures, transportation, geotechnical and construction engineering.',75000,320000,'Site engineer, structural designer, government engineering services.',false),
  ('Bachelor of Computer Applications','BCA','bca','engineering','ug',36,'10+2 in any stream with Mathematics or Computer Science preferred','Three-year computer applications degree covering programming and databases.',45000,180000,'Software developer, web developer, MCA and MBA progression.',true),
  ('Master of Computer Applications','MCA','mca','engineering','pg',24,'Graduation with Mathematics at 10+2 or degree level','Two-year postgraduate computer applications programme.',60000,250000,'Software engineer, systems analyst, IT consultant.',true),
  -- Management (7)
  ('Master of Business Administration','MBA','mba','management','pg',24,'Bachelor degree with 50% aggregate and a valid CAT/MAT/XAT score','Two-year management degree with functional specialisations.',150000,2500000,'Consultant, analyst, brand manager, operations and finance leadership.',true),
  ('Bachelor of Business Administration','BBA','bba','management','ug',36,'10+2 in any stream with 50% aggregate','Three-year undergraduate management degree.',60000,400000,'Business analyst, sales and marketing executive, MBA progression.',true),
  ('Post Graduate Diploma in Management','PGDM','pgdm','management','pg',24,'Bachelor degree with a valid entrance score','AICTE-approved two-year management diploma, industry-aligned curriculum.',300000,2400000,'Consulting, banking, FMCG and technology management roles.',false),
  ('Executive MBA','Executive MBA','executive-mba','management','pg',18,'Bachelor degree with 2+ years of full-time work experience','Management degree designed for working professionals.',300000,1800000,'Mid-career transition into leadership and general management.',false),
  ('MBA Finance','MBA Finance','mba-finance','management','pg',24,'Bachelor degree with 50% aggregate and a valid entrance score','MBA specialising in corporate finance, markets and risk.',150000,2200000,'Investment banking, corporate finance, equity research, treasury.',false),
  ('MBA Marketing','MBA Marketing','mba-marketing','management','pg',24,'Bachelor degree with 50% aggregate and a valid entrance score','MBA specialising in brand, sales and digital marketing.',150000,2200000,'Brand manager, digital marketing lead, sales strategy roles.',false),
  ('Bachelor of Business Management','BBM','bbm','management','ug',36,'10+2 in any stream','Undergraduate business management degree.',55000,300000,'Operations, HR and marketing executive roles.',false),
  -- Medical (10)
  ('Bachelor of Medicine and Bachelor of Surgery','MBBS','mbbs','medical','ug',66,'10+2 with Physics, Chemistry, Biology and a qualifying NEET UG score','Five-and-a-half-year medical degree including a one-year rotating internship.',50000,2500000,'Doctor, resident, MD/MS specialisation, public health service.',true),
  ('Doctor of Medicine','MD','md','medical','doctorate',36,'MBBS with a valid NEET PG score and completed internship','Three-year postgraduate medical specialisation.',100000,3000000,'Consultant physician, specialist practice, academia.',false),
  ('Bachelor of Dental Surgery','BDS','bds','medical','ug',60,'10+2 with PCB and a qualifying NEET UG score','Five-year dental degree including internship.',100000,900000,'Dental surgeon, private practice, MDS specialisation.',true),
  ('Master of Dental Surgery','MDS','mds','medical','pg',36,'BDS with a valid NEET MDS score','Three-year dental specialisation.',200000,1800000,'Specialist dental practice, academia.',false),
  ('Bachelor of Ayurvedic Medicine and Surgery','BAMS','bams','medical','ug',66,'10+2 with PCB and a qualifying NEET UG score','Ayurvedic medicine degree with internship.',80000,700000,'Ayurvedic practitioner, AYUSH services, wellness industry.',false),
  ('Bachelor of Homeopathic Medicine and Surgery','BHMS','bhms','medical','ug',66,'10+2 with PCB and a qualifying NEET UG score','Homeopathic medicine degree with internship.',70000,600000,'Homeopathic practitioner, AYUSH services.',false),
  ('Bachelor of Pharmacy','B.Pharm','b-pharm','medical','ug',48,'10+2 with Physics, Chemistry and Biology or Mathematics','Four-year pharmacy degree.',60000,300000,'Pharmacist, drug inspector, clinical research, pharma industry.',true),
  ('Master of Pharmacy','M.Pharm','m-pharm','medical','pg',24,'B.Pharm with 55% aggregate, GPAT preferred','Two-year pharmacy specialisation.',80000,350000,'Formulation scientist, regulatory affairs, quality assurance.',false),
  ('B.Sc Nursing','B.Sc Nursing','bsc-nursing','medical','ug',48,'10+2 with PCB, minimum 45% aggregate','Four-year professional nursing degree.',50000,300000,'Staff nurse, nurse practitioner, hospital administration, overseas nursing.',true),
  ('General Nursing and Midwifery','GNM','gnm','medical','diploma',36,'10+2 in any stream, PCB preferred','Three-year nursing diploma with clinical training.',40000,150000,'Staff nurse, community health worker.',false),
  -- Commerce (6)
  ('Bachelor of Commerce','B.Com','b-com','commerce','ug',36,'10+2 in Commerce or any stream','Three-year commerce degree covering accounting, tax and business law.',25000,150000,'Accountant, audit assistant, banking, CA/CS progression.',true),
  ('Master of Commerce','M.Com','m-com','commerce','pg',24,'B.Com or equivalent with 50% aggregate','Two-year advanced commerce degree.',30000,150000,'Finance analyst, lecturer, taxation specialist.',false),
  ('B.Com (Honours)','B.Com Hons','b-com-hons','commerce','ug',36,'10+2 with Commerce, typically 60%+ aggregate','Specialised, research-oriented commerce degree.',35000,200000,'Financial analyst, consulting, postgraduate progression.',true),
  ('CA Foundation','CA Foundation','ca-foundation','commerce','certificate',8,'10+2 pass, registered with ICAI','Entry level of the Chartered Accountancy qualification.',15000,60000,'Progression to CA Intermediate and articleship.',false),
  ('Cost and Management Accountant','CMA','cma','commerce','certificate',36,'10+2 pass, registered with ICMAI','Professional cost and management accounting qualification.',50000,120000,'Cost accountant, financial controller, internal audit.',false),
  ('Company Secretary Executive','CS Executive','cs-executive','commerce','certificate',18,'Graduation or CSEET qualified','Second stage of the Company Secretary qualification.',30000,90000,'Company secretary, compliance and governance roles.',false),
  -- Science (6)
  ('Bachelor of Science','B.Sc','b-sc','science','ug',36,'10+2 with Science subjects','Three-year science degree with a choice of majors.',20000,120000,'Lab analyst, research assistant, teaching, M.Sc progression.',true),
  ('Master of Science','M.Sc','m-sc','science','pg',24,'B.Sc in a relevant subject with 50% aggregate','Two-year postgraduate science degree.',30000,180000,'Research associate, scientist, lecturer, PhD progression.',true),
  ('B.Sc Physics','B.Sc Physics','bsc-physics','science','ug',36,'10+2 with Physics and Mathematics','Undergraduate physics degree.',20000,110000,'Research, data analysis, teaching, technical roles.',false),
  ('B.Sc Chemistry','B.Sc Chemistry','bsc-chemistry','science','ug',36,'10+2 with Chemistry','Undergraduate chemistry degree.',20000,110000,'Quality control, pharma labs, research, teaching.',false),
  ('B.Sc Biotechnology','B.Sc Biotechnology','bsc-biotechnology','science','ug',36,'10+2 with Biology and Chemistry','Undergraduate biotechnology degree.',40000,200000,'Biotech labs, clinical research, pharma R&D.',false),
  ('M.Sc Physics','M.Sc Physics','msc-physics','science','pg',24,'B.Sc with Physics as a major','Postgraduate physics degree.',30000,150000,'Research, academia, scientific computing.',false),
  -- Arts (6)
  ('Bachelor of Arts','BA','ba','arts','ug',36,'10+2 in any stream','Three-year humanities degree with a choice of majors.',15000,120000,'Civil services, teaching, media, social sector, MA progression.',true),
  ('Master of Arts','MA','ma','arts','pg',24,'Bachelor degree in a relevant subject','Two-year postgraduate humanities degree.',20000,150000,'Lecturer, researcher, policy and development roles.',false),
  ('BA English','BA English','ba-english','arts','ug',36,'10+2 in any stream','Undergraduate degree in English literature and language.',18000,120000,'Content, publishing, teaching, communications.',false),
  ('MA English','MA English','ma-english','arts','pg',24,'BA with English as a major','Postgraduate degree in English literature.',20000,140000,'Lecturer, editor, content strategist.',false),
  ('BA Psychology','BA Psychology','ba-psychology','arts','ug',36,'10+2 in any stream','Undergraduate psychology degree.',30000,200000,'Counsellor (with PG), HR, research, clinical progression.',false),
  ('Bachelor of Journalism and Mass Communication','BJMC','bjmc','arts','ug',36,'10+2 in any stream','Undergraduate journalism and media production degree.',40000,250000,'Reporter, content producer, PR, digital media.',true),
  -- Law (4)
  ('Bachelor of Legislative Law','LLB','llb','law','ug',36,'Graduation in any discipline with 45% aggregate','Three-year law degree for graduates.',30000,300000,'Advocate, corporate legal, judiciary preparation.',true),
  ('Master of Laws','LLM','llm','law','pg',12,'LLB or equivalent with 50% aggregate','One-year postgraduate law specialisation.',40000,300000,'Legal specialist, academia, policy roles.',false),
  ('BA LLB (Hons)','BA LLB','ba-llb','law','ug',60,'10+2 with 45% aggregate and a valid CLAT/LSAT score','Five-year integrated law degree.',80000,600000,'Litigation, corporate law, judicial services.',true),
  ('BBA LLB (Hons)','BBA LLB','bba-llb','law','ug',60,'10+2 with 45% aggregate and a valid entrance score','Five-year integrated management and law degree.',90000,650000,'Corporate counsel, compliance, commercial litigation.',false),
  -- Agriculture (4)
  ('B.Sc Agriculture','B.Sc Ag','bsc-agriculture','agriculture','ug',48,'10+2 with PCB or Agriculture, minimum 50% aggregate','Four-year professional agriculture degree.',40000,250000,'Agriculture officer, agri-input companies, banking agri-cadre, farming enterprise.',true),
  ('M.Sc Agriculture','M.Sc Ag','msc-agriculture','agriculture','pg',24,'B.Sc Agriculture with 55% aggregate','Two-year agriculture specialisation.',50000,200000,'Research, extension services, agri-business management.',false),
  ('B.Tech Agricultural Engineering','B.Tech Ag Engg','b-tech-agricultural-engineering','agriculture','ug',48,'10+2 with PCM or PCB','Engineering applied to farm machinery, irrigation and post-harvest systems.',60000,250000,'Agricultural engineer, irrigation projects, food processing.',false),
  ('Diploma in Agriculture','Diploma Ag','diploma-agriculture','agriculture','diploma',24,'Class 10 pass with Science','Two-year practical agriculture diploma.',20000,80000,'Agriculture assistant, farm supervisor, lateral entry to B.Sc Ag.',false),
  -- Design (5)
  ('Bachelor of Design','B.Des','b-des','design','ug',48,'10+2 in any stream with a valid design entrance score','Four-year design degree across fashion, product and communication design.',150000,800000,'Product designer, UX designer, fashion designer.',true),
  ('Master of Design','M.Des','m-des','design','pg',24,'Bachelor degree with a design portfolio and entrance score','Two-year postgraduate design specialisation.',200000,900000,'Senior designer, design strategist, design research.',false),
  ('Bachelor of Fine Arts','BFA','bfa','design','ug',48,'10+2 in any stream, portfolio or aptitude test','Four-year fine arts degree.',60000,300000,'Artist, illustrator, art director, animation.',false),
  ('Bachelor of Architecture','B.Arch','b-arch','design','ug',60,'10+2 with Mathematics and a valid NATA/JEE Paper 2 score','Five-year professional architecture degree, COA recognised.',150000,700000,'Architect, urban designer, interior and landscape practice.',true),
  ('Diploma in Fashion Design','Diploma Fashion','diploma-fashion-design','design','diploma',12,'10+2 in any stream','One-year practical fashion design diploma.',50000,200000,'Assistant designer, boutique enterprise, merchandising.',false),
  -- Education (3)
  ('Bachelor of Education','B.Ed','b-ed','education','pg',24,'Graduation with 50% aggregate','Two-year professional teacher training degree, NCTE recognised.',40000,200000,'School teacher, TGT/PGT recruitment, education administration.',true),
  ('Master of Education','M.Ed','m-ed','education','pg',24,'B.Ed with 50% aggregate','Two-year postgraduate education degree.',50000,200000,'Teacher educator, curriculum designer, education research.',false),
  ('Diploma in Elementary Education','D.El.Ed','d-el-ed','education','diploma',24,'10+2 with 50% aggregate','Two-year primary teacher training diploma.',30000,120000,'Primary school teacher, CTET progression.',false)
) as v(name, short_name, slug, stream_slug, level, duration, eligibility, description, fee_min, fee_max, career, featured)
join streams s on s.slug = v.stream_slug
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Colleges (25) — Bihar-weighted. ALL METRICS ARE DEMO VALUES.
-- ─────────────────────────────────────────────────────────────
insert into colleges (name, slug, short_name, city_id, address, type, established_year,
                      naac_grade, nirf_rank, approvals, highest_package, average_package,
                      total_students, campus_size, facilities, about, admission_process,
                      why_choose, rating, review_count, website, is_featured)
select v.name, v.slug, v.short_name, ci.id, v.address, v.type::college_type, v.est,
       v.naac, v.nirf, v.approvals::text[], v.high_pkg, v.avg_pkg, v.students, v.campus,
       v.facilities::text[], v.about, v.admission, v.why, v.rating, 0, v.website, v.featured
from (values
  ('Indian Institute of Technology Patna','iit-patna','IIT Patna','patna','Bihta, Patna, Bihar 801106','central',2008,'A++',41,'{UGC,AICTE,AIU}',5400000,1980000,3200,'501 acres','{Hostel,Library,Sports Complex,Research Labs,Wi-Fi Campus,Medical Centre,Cafeteria}','An Institute of National Importance offering undergraduate, postgraduate and doctoral programmes in engineering and sciences.','Admission through JEE Advanced for B.Tech and GATE for M.Tech, followed by JoSAA/COAP counselling.','Institute of National Importance, strong research output and consistent core-engineering placements.',4.6,'https://www.iitp.ac.in',true),
  ('National Institute of Technology Patna','nit-patna','NIT Patna','patna','Ashok Rajpath, Patna, Bihar 800005','central',1886,'A',56,'{UGC,AICTE,NBA,AIU}',4300000,1250000,4100,'35 acres','{Hostel,Library,Sports Complex,Auditorium,Wi-Fi Campus,Medical Centre}','One of the oldest engineering institutions in India, offering B.Tech, M.Tech and PhD programmes.','JEE Main followed by JoSAA counselling for B.Tech; GATE for M.Tech.','Legacy engineering campus in the heart of Patna with strong alumni and recruiter base.',4.4,'https://www.nitp.ac.in',true),
  ('Patna University','patna-university','PU','patna','Ashok Rajpath, Patna, Bihar 800005','state',1917,'B++',null,'{UGC,AIU,NCTE}',1200000,420000,22000,'Multiple campuses','{Hostel,Central Library,Sports Ground,Auditorium,Research Centre}','Bihar''s oldest university, offering arts, science, commerce and professional programmes across constituent colleges.','Merit-based admission through the university''s common admission portal; entrance test for select programmes.','Historic state university with the widest programme choice in Patna at government fee levels.',4.1,'https://www.patnauniversity.ac.in',true),
  ('Chanakya National Law University','cnlu-patna','CNLU','patna','Nyaya Nagar, Mithapur, Patna, Bihar 800001','state',2006,'A',null,'{UGC,BCI,AIU}',1800000,860000,900,'25 acres','{Hostel,Moot Court,Law Library,Sports Complex,Wi-Fi Campus}','A National Law University offering five-year integrated law degrees and LLM programmes.','Admission through CLAT for BA LLB and LLM.','Bihar''s premier law school with an active moot court culture and litigation placements.',4.3,'https://www.cnlu.ac.in',true),
  ('All India Institute of Medical Sciences Patna','aiims-patna','AIIMS Patna','patna','Phulwarisharif, Patna, Bihar 801507','central',2012,'A',null,'{UGC,AIU}',null,null,1500,'126 acres','{Hostel,Teaching Hospital,Library,Research Labs,Sports Complex}','An apex medical institute offering MBBS, MD/MS, nursing and paramedical programmes with an attached teaching hospital.','MBBS admission through NEET UG; postgraduate admission through NEET PG.','Central government medical institute with a large teaching hospital and subsidised fees.',4.7,'https://www.aiimspatna.edu.in',true),
  ('Birla Institute of Technology Mesra, Patna Campus','bit-mesra-patna','BIT Patna','patna','BIT Colony, Patna, Bihar 800014','deemed',2006,'A',null,'{UGC,AICTE,NBA}',1800000,720000,1200,'12 acres','{Hostel,Library,Computer Labs,Sports Ground,Wi-Fi Campus}','An off-campus centre of BIT Mesra offering engineering and computer application programmes.','JEE Main score followed by institute counselling for B.Tech; institute test for MCA.','Deemed university brand with an established recruiter network, located in Patna.',4.0,'https://www.bitmesra.ac.in',false),
  ('Muzaffarpur Institute of Technology','mit-muzaffarpur','MIT Muzaffarpur','muzaffarpur','Muzaffarpur, Bihar 842003','government',1954,'B+',null,'{AICTE,UGC}',900000,410000,1800,'54 acres','{Hostel,Library,Workshop,Sports Ground}','A government engineering college affiliated to Bihar Engineering University offering core B.Tech branches.','Admission through JEE Main and Bihar state counselling (UGEAC).','Long-established government engineering college with low fees in north Bihar.',3.9,'https://www.mitmuzaffarpur.org',false),
  ('Bihar Agricultural University','bihar-agricultural-university','BAU Sabour','bhagalpur','Sabour, Bhagalpur, Bihar 813210','state',2010,'A',null,'{UGC,ICAR}',1100000,520000,3000,'450 acres','{Hostel,Research Farms,Library,Labs,Sports Ground}','A state agricultural university offering B.Sc Agriculture, agricultural engineering and postgraduate research programmes.','Admission through BCECE agriculture stream and ICAR AIEEA.','ICAR-accredited agricultural university with extensive research farms and extension programmes.',4.2,'https://www.bausabour.ac.in',true),
  ('Lalit Narayan Mithila University','lnmu-darbhanga','LNMU','darbhanga','Kameshwaranagar, Darbhanga, Bihar 846004','state',1972,'B',null,'{UGC,AIU,NCTE}',600000,280000,45000,'200 acres','{Hostel,Central Library,Sports Ground,Auditorium}','A state university serving the Mithila region with arts, science, commerce and education programmes across affiliated colleges.','Merit-based admission through the university portal; entrance test for professional programmes.','Largest programme footprint in north Bihar with government fee levels.',3.8,'https://www.lnmu.ac.in',false),
  ('Gaya College','gaya-college','Gaya College','gaya','Rampur, Gaya, Bihar 823001','government',1945,'B+',null,'{UGC,AIU}',500000,240000,12000,'40 acres','{Hostel,Library,Sports Ground,Computer Lab}','A constituent college of Magadh University offering arts, science and commerce programmes.','Merit-based admission through the Magadh University admission portal.','Established government college in Gaya with affordable fees and a wide subject choice.',3.7,'https://www.gayacollege.ac.in',false),
  ('Indian Institute of Technology Delhi','iit-delhi','IIT Delhi','new-delhi','Hauz Khas, New Delhi 110016','central',1961,'A++',2,'{UGC,AICTE,AIU}',8000000,2600000,9500,'320 acres','{Hostel,Central Library,Sports Complex,Research Parks,Incubation Centre,Medical Centre}','An Institute of National Importance and one of India''s highest-ranked engineering institutions.','JEE Advanced for B.Tech, GATE for M.Tech, followed by JoSAA/COAP counselling.','Top-ranked engineering institute with the strongest placement and research ecosystem in north India.',4.8,'https://home.iitd.ac.in',true),
  ('University of Delhi','university-of-delhi','DU','new-delhi','Benito Juarez Marg, South Campus, New Delhi 110021','central',1922,'A++',6,'{UGC,AIU,NCTE,BCI}',3000000,850000,132000,'Multiple campuses','{Hostel,Central Library,Sports Complex,Auditorium,Health Centre}','A central university with a large network of colleges offering arts, commerce, science, law and professional programmes.','Undergraduate admission through CUET UG followed by CSAS counselling.','India''s most sought-after central university for BA, B.Com and B.Sc programmes.',4.5,'https://www.du.ac.in',true),
  ('Indian Institute of Technology Bombay','iit-bombay','IIT Bombay','mumbai','Powai, Mumbai, Maharashtra 400076','central',1958,'A++',3,'{UGC,AICTE,AIU}',9000000,2350000,11000,'550 acres','{Hostel,Central Library,Sports Complex,Research Labs,Incubation Centre}','An Institute of National Importance offering engineering, design, management and science programmes.','JEE Advanced for B.Tech, GATE for M.Tech, UCEED for B.Des.','Consistently among India''s top three engineering institutes for placements and research.',4.8,'https://www.iitb.ac.in',true),
  ('Indian Institute of Management Ahmedabad','iim-ahmedabad','IIM Ahmedabad','ahmedabad','Vastrapur, Ahmedabad, Gujarat 380015','autonomous',1961,'A++',1,'{UGC,AIU}',11000000,3400000,1300,'106 acres','{Hostel,Library,Sports Complex,Auditorium,Wi-Fi Campus}','India''s top-ranked management institute, offering the flagship two-year MBA and doctoral programmes.','Admission through CAT followed by written test and personal interview.','India''s highest-ranked B-school with the strongest consulting and finance placements.',4.9,'https://www.iima.ac.in',true),
  ('Vellore Institute of Technology','vit-vellore','VIT','vellore','Tiruvalam Road, Katpadi, Vellore, Tamil Nadu 632014','deemed',1984,'A++',11,'{UGC,AICTE,NBA,AIU}',8800000,940000,38000,'372 acres','{Hostel,Library,Sports Complex,Auditorium,Wi-Fi Campus,Medical Centre}','A deemed university known for large-scale engineering, science and management programmes.','Admission through VITEEE for B.Tech; VITMEE for postgraduate programmes.','Very high placement volume and a strong recruiter base for IT roles.',4.4,'https://vit.ac.in',true),
  ('SRM Institute of Science and Technology','srm-chennai','SRMIST','chennai','Kattankulathur, Chennai, Tamil Nadu 603203','deemed',1985,'A++',13,'{UGC,AICTE,NBA,AIU}',5200000,780000,52000,'250 acres','{Hostel,Library,Sports Complex,Teaching Hospital,Wi-Fi Campus}','A large deemed university offering engineering, medicine, management and science programmes.','Admission through SRMJEEE for B.Tech; NEET for medical programmes.','Wide programme choice with strong industry tie-ups and campus infrastructure.',4.2,'https://www.srmist.edu.in',false),
  ('Manipal Academy of Higher Education','manipal-mahe','MAHE','manipal','Madhav Nagar, Manipal, Karnataka 576104','deemed',1953,'A++',4,'{UGC,AICTE,NBA,AIU}',5500000,1050000,28000,'600 acres','{Hostel,Library,Teaching Hospital,Sports Complex,Wi-Fi Campus}','A deemed university with a strong reputation in health sciences, engineering and management.','Admission through MET for engineering and NEET for medical programmes.','Health sciences leadership with an international student community.',4.5,'https://www.manipal.edu',true),
  ('Lovely Professional University','lpu-jalandhar','LPU','jalandhar','Jalandhar-Delhi GT Road, Phagwara, Punjab 144411','private',2005,'A++',null,'{UGC,AICTE,NBA,BCI,NCTE,AIU}',6400000,720000,30000,'600 acres','{Hostel,Library,Sports Complex,Auditorium,Wi-Fi Campus,Shopping Complex}','A large private university offering more than 200 programmes across engineering, management, agriculture and design.','Admission through LPUNEST scholarship-cum-entrance test.','Very broad programme catalogue with scholarship-linked admission — a common choice for Bihar students moving north.',4.0,'https://www.lpu.in',true),
  ('Amity University Noida','amity-noida','Amity','noida','Sector 125, Noida, Uttar Pradesh 201313','private',2005,'A+',null,'{UGC,AICTE,BCI,NCTE,AIU}',5400000,680000,35000,'60 acres','{Hostel,Library,Sports Complex,Auditorium,Wi-Fi Campus}','A private university offering engineering, management, law and media programmes in the NCR.','Admission through the Amity entrance test or board merit with an interview.','NCR location with strong internship access and a large industry network.',3.9,'https://www.amity.edu',false),
  ('Christ University','christ-university','Christ','bengaluru','Hosur Road, Bengaluru, Karnataka 560029','deemed',1969,'A++',null,'{UGC,AICTE,BCI,NCTE,AIU}',2400000,620000,22000,'25 acres','{Hostel,Library,Sports Complex,Auditorium,Wi-Fi Campus}','A deemed university known for commerce, management, psychology and media programmes.','Admission through the Christ University Entrance Test, skill assessment and interview.','Among the strongest destinations in India for B.Com, BBA and psychology programmes.',4.4,'https://christuniversity.in',true),
  ('Symbiosis International University','symbiosis-pune','SIU','pune','Lavale, Mulshi, Pune, Maharashtra 412115','deemed',2002,'A++',null,'{UGC,AICTE,BCI,AIU}',4200000,980000,26000,'300 acres','{Hostel,Library,Sports Complex,Auditorium,Wi-Fi Campus}','A deemed university offering management, law, liberal arts and media programmes across institutes.','Admission through SET, SLAT and SNAP depending on the programme.','Strong management and law brand with an international student mix.',4.3,'https://www.siu.edu.in',false),
  ('Malaviya National Institute of Technology Jaipur','mnit-jaipur','MNIT Jaipur','jaipur','JLN Marg, Jaipur, Rajasthan 302017','central',1963,'A',46,'{UGC,AICTE,NBA,AIU}',5400000,1420000,5000,'317 acres','{Hostel,Library,Sports Complex,Research Labs,Wi-Fi Campus}','An Institute of National Importance offering engineering, architecture and management programmes.','JEE Main followed by JoSAA counselling; GATE for M.Tech.','Strong NIT with an established architecture school and core-sector placements.',4.3,'https://www.mnit.ac.in',false),
  ('Jamia Millia Islamia','jamia-millia-islamia','JMI','new-delhi','Jamia Nagar, Okhla, New Delhi 110025','central',1920,'A++',3,'{UGC,AICTE,BCI,NCTE,AIU}',2500000,720000,20000,'239 acres','{Hostel,Central Library,Sports Complex,Auditorium,Health Centre}','A central university offering engineering, humanities, law, media and education programmes.','Admission through CUET UG and the university''s own entrance tests.','Central university fees with a very strong mass communication and architecture reputation.',4.4,'https://www.jmi.ac.in',false),
  ('Kalinga Institute of Industrial Technology','kiit-bhubaneswar','KIIT','bhubaneswar','Patia, Bhubaneswar, Odisha 751024','deemed',1992,'A++',20,'{UGC,AICTE,NBA,BCI,AIU}',6300000,860000,35000,'36 acres','{Hostel,Library,Teaching Hospital,Sports Complex,Wi-Fi Campus}','A deemed university offering engineering, medicine, law and management programmes on a single large campus.','Admission through KIITEE for engineering; NEET for medical programmes.','Popular eastern-India destination for Bihar and Jharkhand students, with high placement volume.',4.3,'https://kiit.ac.in',true),
  ('Chandigarh University','chandigarh-university','CU','mohali','NH-95, Gharuan, Mohali, Punjab 140413','private',2012,'A+',null,'{UGC,AICTE,NBA,BCI,AIU}',5400000,840000,30000,'250 acres','{Hostel,Library,Sports Complex,Auditorium,Wi-Fi Campus,Incubation Centre}','A private university offering engineering, management, law, design and pharmacy programmes.','Admission through CUCET scholarship-cum-entrance test.','Fast-growing private university with heavy recruiter footfall and scholarship options.',4.1,'https://www.cuchd.in',false)
) as v(name, slug, short_name, city_slug, address, type, est, naac, nirf, approvals,
       high_pkg, avg_pkg, students, campus, facilities, about, admission, why, rating, website, featured)
join cities ci on ci.slug = v.city_slug
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- College ↔ course mapping (demo fees and seats)
-- ─────────────────────────────────────────────────────────────
insert into college_courses (college_id, course_id, fee_per_year, total_fee, duration_months, seats, eligibility)
select co.id, cu.id, v.fee_year, v.fee_year * (v.duration / 12), v.duration, v.seats, v.eligibility
from (values
  ('iit-patna','b-tech',250000,48,120,'JEE Advanced qualified'),
  ('iit-patna','b-tech-cse',250000,48,90,'JEE Advanced qualified'),
  ('iit-patna','m-tech',150000,24,60,'B.Tech with a valid GATE score'),
  ('nit-patna','b-tech',180000,48,150,'JEE Main qualified, JoSAA counselling'),
  ('nit-patna','b-tech-civil',180000,48,110,'JEE Main qualified, JoSAA counselling'),
  ('nit-patna','b-arch',175000,60,40,'JEE Main Paper 2 qualified'),
  ('patna-university','b-com',12000,36,480,'10+2 with Commerce or any stream'),
  ('patna-university','ba',9000,36,900,'10+2 in any stream'),
  ('patna-university','b-sc',14000,36,600,'10+2 with Science'),
  ('patna-university','llb',22000,36,120,'Graduation with 45% aggregate'),
  ('cnlu-patna','ba-llb',180000,60,120,'CLAT qualified'),
  ('cnlu-patna','llm',150000,12,40,'LLB with 50% aggregate'),
  ('aiims-patna','mbbs',6000,66,125,'NEET UG qualified'),
  ('aiims-patna','bsc-nursing',12000,48,60,'NEET UG or institute test, PCB at 10+2'),
  ('bit-mesra-patna','b-tech-cse',315000,48,60,'JEE Main score, institute counselling'),
  ('bit-mesra-patna','mca',180000,24,60,'Graduation with Mathematics'),
  ('mit-muzaffarpur','b-tech',72000,48,120,'JEE Main, UGEAC counselling'),
  ('mit-muzaffarpur','b-tech-mechanical',72000,48,90,'JEE Main, UGEAC counselling'),
  ('bihar-agricultural-university','bsc-agriculture',48000,48,180,'BCECE agriculture stream'),
  ('bihar-agricultural-university','msc-agriculture',52000,24,80,'B.Sc Agriculture with 55%'),
  ('bihar-agricultural-university','b-tech-agricultural-engineering',60000,48,60,'BCECE, PCM at 10+2'),
  ('lnmu-darbhanga','ba',7000,36,1200,'10+2 in any stream'),
  ('lnmu-darbhanga','b-ed',60000,24,100,'Graduation with 50% aggregate'),
  ('lnmu-darbhanga','m-com',11000,24,120,'B.Com with 50% aggregate'),
  ('gaya-college','b-com',8000,36,400,'10+2 in any stream'),
  ('gaya-college','b-sc',10000,36,360,'10+2 with Science'),
  ('iit-delhi','b-tech-cse',250000,48,120,'JEE Advanced qualified'),
  ('iit-delhi','m-tech',160000,24,80,'B.Tech with a valid GATE score'),
  ('university-of-delhi','b-com-hons',22000,36,500,'CUET UG, CSAS counselling'),
  ('university-of-delhi','ba-english',18000,36,400,'CUET UG, CSAS counselling'),
  ('university-of-delhi','b-sc',24000,36,450,'CUET UG, CSAS counselling'),
  ('iit-bombay','b-tech-cse',250000,48,120,'JEE Advanced qualified'),
  ('iit-bombay','b-des',250000,48,30,'UCEED qualified'),
  ('iim-ahmedabad','mba',1300000,24,400,'CAT, written test and interview'),
  ('iim-ahmedabad','executive-mba',1900000,18,150,'CAT/GMAT with work experience'),
  ('vit-vellore','b-tech-cse',198000,48,600,'VITEEE qualified'),
  ('vit-vellore','bca',110000,36,180,'10+2 with Mathematics or Computer Science'),
  ('vit-vellore','mba',250000,24,120,'CAT/MAT/VITMEE score'),
  ('srm-chennai','b-tech',250000,48,700,'SRMJEEE qualified'),
  ('srm-chennai','mbbs',2450000,66,150,'NEET UG qualified'),
  ('srm-chennai','b-pharm',180000,48,100,'10+2 with PCB or PCM'),
  ('manipal-mahe','mbbs',1900000,66,250,'NEET UG qualified'),
  ('manipal-mahe','bds',700000,60,100,'NEET UG qualified'),
  ('manipal-mahe','b-tech-cse',400000,48,300,'MET qualified'),
  ('lpu-jalandhar','b-tech',180000,48,900,'LPUNEST or JEE Main score'),
  ('lpu-jalandhar','bba',140000,36,400,'10+2 in any stream, LPUNEST'),
  ('lpu-jalandhar','bsc-agriculture',150000,48,240,'10+2 with PCB or Agriculture'),
  ('lpu-jalandhar','b-des',200000,48,120,'LPUNEST design aptitude test'),
  ('amity-noida','bba',280000,36,300,'Amity entrance test or board merit'),
  ('amity-noida','bjmc',260000,36,180,'Amity entrance test or board merit'),
  ('amity-noida','b-tech-cse',330000,48,360,'Amity entrance test or JEE Main'),
  ('christ-university','b-com-hons',165000,36,420,'CUET (Christ) and interview'),
  ('christ-university','bba',180000,36,360,'CUET (Christ) and interview'),
  ('christ-university','ba-psychology',175000,36,180,'CUET (Christ) and interview'),
  ('symbiosis-pune','mba',1200000,24,300,'SNAP qualified'),
  ('symbiosis-pune','ba-llb',400000,60,240,'SLAT qualified'),
  ('mnit-jaipur','b-tech',160000,48,200,'JEE Main, JoSAA counselling'),
  ('mnit-jaipur','b-arch',160000,60,40,'JEE Main Paper 2 qualified'),
  ('jamia-millia-islamia','bjmc',35000,36,60,'CUET UG or JMI entrance test'),
  ('jamia-millia-islamia','b-arch',60000,60,40,'JMI entrance test with NATA'),
  ('jamia-millia-islamia','ba-llb',40000,60,120,'JMI entrance test'),
  ('kiit-bhubaneswar','b-tech',350000,48,800,'KIITEE qualified'),
  ('kiit-bhubaneswar','mbbs',2200000,66,200,'NEET UG qualified'),
  ('kiit-bhubaneswar','bba',260000,36,240,'KIITEE or board merit'),
  ('chandigarh-university','b-tech-cse',220000,48,600,'CUCET qualified'),
  ('chandigarh-university','mba',240000,24,300,'CUCET, CAT or MAT score'),
  ('chandigarh-university','b-pharm',190000,48,120,'10+2 with PCB or PCM')
) as v(college_slug, course_slug, fee_year, duration, seats, eligibility)
join colleges co on co.slug = v.college_slug
join courses  cu on cu.slug = v.course_slug
on conflict (college_id, course_id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Exams (12)
-- ─────────────────────────────────────────────────────────────
insert into exams (name, slug, conducting_body, level, mode, exam_date,
                   application_start, application_end, eligibility, pattern, official_url)
values
  ('JEE Main','jee-main','National Testing Agency','ug','Computer based test','2027-01-24','2026-11-01','2026-11-30','10+2 with Physics, Chemistry and Mathematics','90 questions across Physics, Chemistry and Mathematics; 300 marks; 3 hours.','https://jeemain.nta.nic.in'),
  ('JEE Advanced','jee-advanced','IIT (rotating host)','ug','Computer based test','2027-05-16','2027-04-20','2027-05-01','Top 2.5 lakh JEE Main qualifiers','Two compulsory papers of 3 hours each covering Physics, Chemistry and Mathematics.','https://jeeadv.ac.in'),
  ('NEET UG','neet-ug','National Testing Agency','ug','Pen and paper','2027-05-02','2027-02-01','2027-03-07','10+2 with Physics, Chemistry and Biology, minimum 50% for general category','180 questions; 720 marks; 3 hours 20 minutes.','https://neet.nta.nic.in'),
  ('NEET PG','neet-pg','National Board of Examinations','pg','Computer based test','2027-06-15','2027-04-05','2027-04-25','MBBS with a completed internship','200 questions; 800 marks; 3 hours 30 minutes.','https://nbe.edu.in'),
  ('CAT','cat','Indian Institutes of Management','pg','Computer based test','2026-11-29','2026-08-01','2026-09-15','Bachelor degree with 50% aggregate','VARC, DILR and QA sections; 2 hours.','https://iimcat.ac.in'),
  ('MAT','mat','All India Management Association','pg','CBT, IBT and PBT','2026-12-06','2026-10-01','2026-11-25','Bachelor degree in any discipline','200 objective questions across 5 sections; 2 hours 30 minutes.','https://mat.aima.in'),
  ('CLAT','clat','Consortium of National Law Universities','ug','Pen and paper','2026-12-06','2026-07-01','2026-10-31','10+2 with 45% aggregate for UG programmes','120 comprehension-based questions; 2 hours.','https://consortiumofnlus.ac.in'),
  ('GATE','gate','IIT (rotating host)','pg','Computer based test','2027-02-06','2026-08-24','2026-10-10','Bachelor degree in engineering, technology or science','65 questions; 100 marks; 3 hours.','https://gate.iitk.ac.in'),
  ('CUET UG','cuet-ug','National Testing Agency','ug','Computer based test','2027-05-08','2027-02-01','2027-03-15','10+2 pass from a recognised board','Domain subjects, language and general test; hybrid mode.','https://cuet.nta.nic.in'),
  ('BCECE','bcece','Bihar Combined Entrance Competitive Examination Board','ug','Pen and paper','2027-04-25','2027-02-10','2027-03-20','10+2 with relevant subjects; Bihar domicile for state quota','Objective paper in Physics, Chemistry, Biology, Mathematics and Agriculture.','https://bceceboard.bihar.gov.in'),
  ('NIFT Entrance Exam','nift-entrance','National Institute of Fashion Technology','ug','Computer based test and studio test','2027-02-07','2026-11-15','2026-12-31','10+2 for B.Des and B.FTech programmes','CAT and GAT papers followed by a situation test for design programmes.','https://nift.ac.in'),
  ('UGC NET','ugc-net','National Testing Agency','pg','Computer based test','2026-12-20','2026-10-05','2026-11-05','Postgraduate degree with 55% aggregate','Paper 1 teaching aptitude and Paper 2 subject specific; 3 hours.','https://ugcnet.nta.ac.in')
on conflict (slug) do nothing;

insert into exam_courses (exam_id, course_id)
select e.id, c.id
from (values
  ('jee-main','b-tech'),('jee-main','b-tech-cse'),('jee-main','b-tech-mechanical'),
  ('jee-main','b-tech-civil'),('jee-main','be'),('jee-main','b-arch'),
  ('jee-advanced','b-tech'),('jee-advanced','b-tech-cse'),
  ('neet-ug','mbbs'),('neet-ug','bds'),('neet-ug','bams'),('neet-ug','bhms'),('neet-ug','bsc-nursing'),
  ('neet-pg','md'),
  ('cat','mba'),('cat','pgdm'),('cat','executive-mba'),('cat','mba-finance'),('cat','mba-marketing'),
  ('mat','mba'),('mat','pgdm'),
  ('clat','ba-llb'),('clat','bba-llb'),('clat','llm'),
  ('gate','m-tech'),
  ('cuet-ug','ba'),('cuet-ug','b-com'),('cuet-ug','b-com-hons'),('cuet-ug','b-sc'),
  ('cuet-ug','ba-english'),('cuet-ug','ba-psychology'),
  ('bcece','bsc-agriculture'),('bcece','b-pharm'),('bcece','diploma-engineering'),
  ('nift-entrance','b-des'),('nift-entrance','diploma-fashion-design'),
  ('ugc-net','ma'),('ugc-net','m-sc'),('ugc-net','m-com')
) as v(exam_slug, course_slug)
join exams   e on e.slug = v.exam_slug
join courses c on c.slug = v.course_slug
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- Testimonials (8) — names and figures are illustrative
-- ─────────────────────────────────────────────────────────────
insert into testimonials (student_name, company, package_lpa, course, city, college_id, quote, sort_order)
select v.student_name, v.company, v.package_lpa, v.course, v.city, co.id, v.quote, v.sort_order
from (values
  ('Rohit Kumar','Tata Consultancy Services',7.2,'B.Tech CSE','Patna','nit-patna','I had no idea how JoSAA choice filling worked. The counsellor sat with me for an hour and I ended up with my first preference branch.',1),
  ('Priya Sharma','Apollo Hospitals',9.5,'B.Sc Nursing','Muzaffarpur','aiims-patna','Coming from a small town, I did not know nursing had this many routes. The team explained every option before I filled the form.',2),
  ('Aman Raj','Infosys',6.8,'MCA','Gaya','bit-mesra-patna','I was about to drop a year. CareerOptics found me an MCA seat that fit my budget and I am placed now.',3),
  ('Sneha Gupta','Deloitte',11.0,'B.Com Hons','Darbhanga','christ-university','My parents wanted me to stay close to home. The counsellor helped convince them with placement data, and Bengaluru worked out.',4),
  ('Vikash Singh','Larsen & Toubro',8.4,'B.Tech Civil','Ara','nit-patna','The fee comparison sheet they shared saved my family almost two lakh rupees over four years.',5),
  ('Kajal Kumari','ICICI Bank',7.5,'MBA Finance','Bhagalpur','symbiosis-pune','I got a scholarship I did not even know existed. That one phone call changed my whole plan.',6),
  ('Nitesh Anand','Amazon',14.2,'B.Tech CSE','Begusarai','kiit-bhubaneswar','Applied to six colleges through them in one week instead of running around for a month.',7),
  ('Ritu Priya','Bihar Agriculture Department',6.0,'B.Sc Agriculture','Purnia','bihar-agricultural-university','Nobody in my family had been to university. They walked me through BCECE counselling step by step.',8)
) as v(student_name, company, package_lpa, course, city, college_slug, quote, sort_order)
join colleges co on co.slug = v.college_slug
where not exists (select 1 from testimonials);

-- ─────────────────────────────────────────────────────────────
-- Home FAQs (6)
-- ─────────────────────────────────────────────────────────────
insert into faqs (question, answer, scope, sort_order)
select v.question, v.answer, v.scope, v.sort_order
from (values
  ('Is CareerOptics counselling free for students?','Yes. Our counselling, college shortlisting and application guidance are completely free for students and parents. We are paid by the universities we partner with, not by you.','home',1),
  ('Which courses can I apply for after 12th?','It depends on your stream. Science students commonly take B.Tech, MBBS, B.Sc, B.Pharm or B.Sc Nursing; Commerce students take B.Com, BBA or CA; Arts students take BA, BJMC or law. Use the College Finder and we will shortlist based on your marks, budget and preferred city.','home',2),
  ('Do you help with admission to government colleges too?','Yes. We guide students through state counselling such as BCECE and UGEAC as well as national processes like JoSAA and NEET, alongside private university admissions.','home',3),
  ('How soon will a counsellor contact me after I submit a form?','A counsellor typically calls within 24 hours on working days. If you prefer WhatsApp, mention it in the form and we will message you instead.','home',4),
  ('Can you help me arrange an education loan or scholarship?','We help you check eligibility for schemes such as the Bihar Student Credit Card, state scholarships and university merit waivers, and we explain the documents each one needs.','home',5),
  ('Do I have to pay any fee to CareerOptics to confirm a seat?','No. Every fee you pay goes directly to the college or university through its official channel. We never collect admission fees on a college''s behalf.','home',6)
) as v(question, answer, scope, sort_order)
where not exists (select 1 from faqs);

-- ─────────────────────────────────────────────────────────────
-- Hero banners (3) — image paths are placeholders until upload
-- ─────────────────────────────────────────────────────────────
insert into banners (title, image_url, image_mobile_url, cta_text, cta_url, sort_order, is_active)
select v.title, v.image_url, v.image_mobile_url, v.cta_text, v.cta_url, v.sort_order, true
from (values
  ('Find Your Right College in 2 Minutes','/seed/banners/hero-01.jpg','/seed/banners/hero-01-mobile.jpg','Start College Finder','/college-finder',1),
  ('Admissions Open 2026 — Talk to a Counsellor Free','/seed/banners/hero-02.jpg','/seed/banners/hero-02-mobile.jpg','Need Counselling','/contact',2),
  ('Bihar Student Credit Card — Up to ₹4 Lakh for Your Degree','/seed/banners/hero-03.jpg','/seed/banners/hero-03-mobile.jpg','Check Eligibility','/scholarships/bihar-student-credit-card',3)
) as v(title, image_url, image_mobile_url, cta_text, cta_url, sort_order)
where not exists (select 1 from banners);

-- ─────────────────────────────────────────────────────────────
-- Scholarship (1)
-- ─────────────────────────────────────────────────────────────
insert into scholarships (title, slug, state, content, image_url, meta_title, meta_description) values
  ('Bihar Student Credit Card Scheme','bihar-student-credit-card','Bihar',
   E'## What the scheme offers\n\nThe Bihar Student Credit Card Scheme provides an education loan of up to ₹4 lakh to students of Bihar who have passed Class 12 and secured admission to a recognised higher education course. The loan is guaranteed by the Bihar government through the Bihar State Education Finance Corporation.\n\n## Who is eligible\n\n- Permanent resident of Bihar\n- Passed Class 12 from a recognised board\n- Admitted to a recognised institution for a degree, diploma or approved professional course\n- Under 25 years of age at the time of application\n\n## Interest and repayment\n\nInterest is charged at a simple rate of 4% per annum, reduced to 1% for female, transgender and differently-abled students. Repayment begins after the course ends or once employment starts, whichever is earlier.\n\n## Documents you will need\n\nAadhaar card, Class 10 and 12 marksheets, admission letter, fee structure from the institution, residence certificate, bank account details, and passport-size photographs of the applicant and a co-applicant.\n\n## How to apply\n\nRegister on the Bihar Student Credit Card portal, complete the application, book a slot at your District Registration and Counselling Centre, and carry the original documents for verification. Our counsellors can help you assemble the paperwork and check whether your chosen course qualifies.',
   '/seed/scholarships/bihar-student-credit-card.jpg',
   'Bihar Student Credit Card 2026 — Eligibility, Documents and How to Apply',
   'Complete guide to the Bihar Student Credit Card Scheme: up to ₹4 lakh education loan at 4% interest, eligibility rules, required documents and the application process.')
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Gallery (6) & press releases (4)
-- ─────────────────────────────────────────────────────────────
insert into gallery (image_url, caption, event_date, sort_order)
select v.image_url, v.caption, v.event_date::date, v.sort_order
from (values
  ('/seed/gallery/counselling-camp-patna.jpg','Free counselling camp, Patna','2026-05-18',1),
  ('/seed/gallery/career-seminar-gaya.jpg','Career awareness seminar, Gaya','2026-04-22',2),
  ('/seed/gallery/campus-visit-kiit.jpg','Student campus visit, KIIT Bhubaneswar','2026-03-14',3),
  ('/seed/gallery/admission-desk-muzaffarpur.jpg','Admission help desk, Muzaffarpur','2026-06-02',4),
  ('/seed/gallery/scholarship-workshop.jpg','Bihar Student Credit Card workshop','2026-02-11',5),
  ('/seed/gallery/felicitation-ceremony.jpg','Felicitation of admitted students','2026-07-09',6)
) as v(image_url, caption, event_date, sort_order)
where not exists (select 1 from gallery);

insert into press_releases (publication, image_url, article_url, published_on)
select v.publication, v.image_url, v.article_url, v.published_on::date
from (values
  ('Hindustan','/seed/press/hindustan.jpg','https://www.livehindustan.com','2026-06-12'),
  ('Prabhat Khabar','/seed/press/prabhat-khabar.jpg','https://www.prabhatkhabar.com','2026-05-03'),
  ('Dainik Bhaskar','/seed/press/dainik-bhaskar.jpg','https://www.bhaskar.com','2026-04-19'),
  ('Dainik Jagran','/seed/press/dainik-jagran.jpg','https://www.jagran.com','2026-03-27')
) as v(publication, image_url, article_url, published_on)
where not exists (select 1 from press_releases);

-- ─────────────────────────────────────────────────────────────
-- Settings
-- ─────────────────────────────────────────────────────────────
insert into settings (key, value) values
  ('lead_notification', '{"email_enabled": true, "whatsapp_enabled": false}'::jsonb),
  ('seed_data', '{"demo_metrics": true, "note": "College metrics are placeholder values pending verification against the partner list."}'::jsonb)
on conflict (key) do nothing;

commit;
