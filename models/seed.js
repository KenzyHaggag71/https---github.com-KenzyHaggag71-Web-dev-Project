const bcrypt = require('bcryptjs');
const User = require('./User');
const Internship = require('./Internship');

const DEFAULT_INTERNSHIPS = [
  {
    title: 'Software Engineering Intern',
    company: 'Vodafone Egypt',
    category: 'Computer Science',
    location: 'Smart Village, Giza',
    duration: '12 weeks',
    stipend: 'EGP 4,500/mo',
    price: 4500,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Join Vodafone Egypt\'s tech team and work on internal software systems, APIs, and digital transformation initiatives.',
    icon: 'fas fa-mobile-alt',
    link: 'https://careers.vodafone.com.eg',
    skills: ['Java', 'Spring Boot', 'REST APIs', 'SQL'],
    postedDate: '2026-01-15'
  },
  {
    title: 'Frontend Development Intern',
    company: 'Instabug',
    category: 'Computer Science',
    location: 'New Cairo, Cairo',
    duration: '10 weeks',
    stipend: 'EGP 5,000/mo',
    price: 5000,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Build and improve Instabug\'s web dashboard used by thousands of developers worldwide. Work with React and modern CSS.',
    icon: 'fas fa-bug',
    link: 'https://instabug.com/careers',
    skills: ['React', 'TypeScript', 'CSS', 'Git'],
    postedDate: '2026-01-20'
  },
  {
    title: 'Backend Engineering Intern',
    company: 'Paymob',
    category: 'Computer Science',
    location: 'Remote',
    duration: '12 weeks',
    stipend: 'EGP 4,000/mo',
    price: 4000,
    type: 'Paid',
    workMode: 'Remote',
    description: 'Work on Paymob\'s payment processing backend, contributing to APIs that handle millions of transactions across Egypt and the region.',
    icon: 'fas fa-credit-card',
    link: 'https://paymob.com/en/careers',
    skills: ['Node.js', 'MongoDB', 'REST APIs', 'Python'],
    postedDate: '2026-02-01'
  },
  {
    title: 'Data Science Intern',
    company: 'Swvl',
    category: 'Computer Science',
    location: 'Maadi, Cairo',
    duration: '12 weeks',
    stipend: 'EGP 4,800/mo',
    price: 4800,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Analyze ridership data, build predictive models, and help optimize route planning and pricing strategies.',
    icon: 'fas fa-bus',
    link: 'https://swvl.com/careers',
    skills: ['Python', 'Pandas', 'Machine Learning', 'SQL'],
    postedDate: '2026-01-25'
  },
  {
    title: 'UI/UX Design Intern',
    company: 'Breadfast',
    category: 'Arts & Design',
    location: 'Remote',
    duration: '8 weeks',
    stipend: 'EGP 3,500/mo',
    price: 3500,
    type: 'Paid',
    workMode: 'Remote',
    description: 'Design user-friendly interfaces for Breadfast\'s grocery delivery app. Work closely with product and engineering teams.',
    icon: 'fas fa-paint-brush',
    link: 'https://breadfast.com/careers',
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
    postedDate: '2026-02-05'
  },
  {
    title: 'Civil Engineering Intern',
    company: 'Orascom Construction',
    category: 'Engineering',
    location: 'New Administrative Capital, Cairo',
    duration: '12 weeks',
    stipend: 'EGP 3,800/mo',
    price: 3800,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Assist in major infrastructure projects across Egypt. Gain hands-on experience in project management and structural analysis.',
    icon: 'fas fa-hard-hat',
    link: 'https://orascomconstruction.com/careers',
    skills: ['AutoCAD', 'Structural Analysis', 'Project Management'],
    postedDate: '2026-01-18'
  },
  {
    title: 'Finance & Investment Intern',
    company: 'Commercial International Bank (CIB)',
    category: 'Business',
    location: 'Downtown, Cairo',
    duration: '10 weeks',
    stipend: 'EGP 5,500/mo',
    price: 5500,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Rotate across CIB\'s corporate banking and investment divisions. Analyze financial statements and assist with client portfolios.',
    icon: 'fas fa-university',
    link: 'https://cibeg.com/en/about-cib/careers',
    skills: ['Excel', 'Financial Modeling', 'Bloomberg', 'Reporting'],
    postedDate: '2026-01-10'
  },
  {
    title: 'Marketing & Content Intern',
    company: 'Jumia Egypt',
    category: 'Mass Communication',
    location: 'Remote',
    duration: '8 weeks',
    stipend: 'EGP 2,800/mo',
    price: 2800,
    type: 'Paid',
    workMode: 'Remote',
    description: 'Create engaging content for Jumia Egypt\'s social media channels and assist in campaign planning and performance tracking.',
    icon: 'fas fa-shopping-cart',
    link: 'https://group.jumia.com/careers',
    skills: ['Copywriting', 'Social Media', 'Analytics', 'Canva'],
    postedDate: '2026-02-10'
  },
  {
    title: 'Architecture & Design Intern',
    company: 'Dar Al-Handasah',
    category: 'Architecture',
    location: 'Mohandessin, Giza',
    duration: '12 weeks',
    stipend: 'EGP 4,200/mo',
    price: 4200,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Work on large-scale architectural projects across Egypt and the Middle East. Collaborate with senior architects on design and documentation.',
    icon: 'fas fa-drafting-compass',
    link: 'https://dar.com/careers',
    skills: ['Revit', 'AutoCAD', 'SketchUp', 'Rendering'],
    postedDate: '2026-01-22'
  },
  {
    title: 'Legal Research Intern',
    company: 'Zulficar & Partners Law Firm',
    category: 'Law',
    location: 'Zamalek, Cairo',
    duration: '10 weeks',
    stipend: 'EGP 3,000/mo',
    price: 3000,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Assist senior lawyers with legal research, contract drafting, and case preparation in one of Egypt\'s top law firms.',
    icon: 'fas fa-gavel',
    link: 'https://zulficarpartners.com',
    skills: ['Legal Research', 'Contract Drafting', 'Arabic', 'Writing'],
    postedDate: '2026-01-28'
  },
  {
    title: 'Clinical Pharmacy Intern',
    company: 'Cleopatra Hospital',
    category: 'Pharmacy',
    location: 'Heliopolis, Cairo',
    duration: '12 weeks',
    stipend: 'EGP 2,500/mo',
    price: 2500,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Gain clinical experience in a leading Egyptian hospital. Work alongside pharmacists on patient medication management and drug dispensing.',
    icon: 'fas fa-pills',
    link: 'https://cleoclinic.com.eg',
    skills: ['Clinical Pharmacy', 'Patient Care', 'Drug Interaction'],
    postedDate: '2026-02-03'
  },

  // AI
  {
    title: 'AI Research Intern',
    company: 'Huawei Egypt R&D Center',
    category: 'Computer Science',
    location: 'Smart Village, Giza',
    duration: '12 weeks',
    stipend: 'EGP 6,000/mo',
    price: 6000,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Work on applied AI research projects including NLP and computer vision. Collaborate with senior researchers on real product challenges.',
    icon: 'fas fa-brain',
    link: 'https://huawei.com/en/careers',
    skills: ['Python', 'TensorFlow', 'NLP', 'Deep Learning'],
    postedDate: '2026-02-10'
  },
  {
    title: 'Machine Learning Intern',
    company: 'Capiter',
    category: 'Computer Science',
    location: 'Remote',
    duration: '10 weeks',
    stipend: 'EGP 4,500/mo',
    price: 4500,
    type: 'Paid',
    workMode: 'Remote',
    description: 'Build and deploy ML models to optimize supply chain predictions and demand forecasting for Egypt\'s B2B e-commerce platform.',
    icon: 'fas fa-robot',
    link: 'https://capiter.com/careers',
    skills: ['Python', 'Scikit-learn', 'Pandas', 'SQL'],
    postedDate: '2026-01-30'
  },
  {
    title: 'AI Product Intern',
    company: 'Microsoft Egypt',
    category: 'Computer Science',
    location: 'Smart Village, Giza',
    duration: '12 weeks',
    stipend: 'EGP 7,000/mo',
    price: 7000,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Work on integrating Azure AI services into Microsoft\'s regional product offerings. Bridge AI research and real-world applications.',
    icon: 'fab fa-microsoft',
    link: 'https://careers.microsoft.com',
    skills: ['Azure AI', 'Python', 'Prompt Engineering', 'APIs'],
    postedDate: '2026-02-01'
  },

  // Software Development
  {
    title: 'Mobile Development Intern',
    company: 'Fawry',
    category: 'Computer Science',
    location: 'Smart Village, Giza',
    duration: '12 weeks',
    stipend: 'EGP 4,200/mo',
    price: 4200,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Develop features for Fawry\'s mobile payment app used by millions of Egyptians. Work with Flutter and native Android/iOS.',
    icon: 'fas fa-wallet',
    link: 'https://fawry.com/careers',
    skills: ['Flutter', 'Dart', 'Android', 'REST APIs'],
    postedDate: '2026-01-18'
  },
  {
    title: 'Full Stack Development Intern',
    company: 'Bosta',
    category: 'Computer Science',
    location: 'New Cairo, Cairo',
    duration: '10 weeks',
    stipend: 'EGP 4,800/mo',
    price: 4800,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Build full-stack features for Bosta\'s logistics platform. Own end-to-end features from database to UI.',
    icon: 'fas fa-truck',
    link: 'https://bosta.co/careers',
    skills: ['Node.js', 'React', 'MongoDB', 'Docker'],
    postedDate: '2026-02-08'
  },
  {
    title: 'DevOps Intern',
    company: 'Orange Egypt',
    category: 'Computer Science',
    location: 'Remote',
    duration: '12 weeks',
    stipend: 'EGP 3,800/mo',
    price: 3800,
    type: 'Paid',
    workMode: 'Remote',
    description: 'Support Orange Egypt\'s infrastructure team with CI/CD pipelines, containerization, and cloud deployments.',
    icon: 'fas fa-server',
    link: 'https://careers.orange.com/en',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Linux'],
    postedDate: '2026-01-25'
  },

  // Engineering
  {
    title: 'Electrical Engineering Intern',
    company: 'Siemens Egypt',
    category: 'Engineering',
    location: 'Obour City, Cairo',
    duration: '12 weeks',
    stipend: 'EGP 4,000/mo',
    price: 4000,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Work on industrial automation and power distribution projects. Get hands-on experience with PLCs and SCADA systems.',
    icon: 'fas fa-bolt',
    link: 'https://siemens.com/global/en/company/jobs.html',
    skills: ['PLC', 'SCADA', 'AutoCAD Electrical', 'Troubleshooting'],
    postedDate: '2026-01-20'
  },
  {
    title: 'Petroleum Engineering Intern',
    company: 'Egyptian General Petroleum Corporation (EGPC)',
    category: 'Engineering',
    location: 'Nasr City, Cairo',
    duration: '12 weeks',
    stipend: 'EGP 4,500/mo',
    price: 4500,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Rotate across EGPC\'s reservoir, drilling, and production departments. Gain exposure to Egypt\'s oil and gas sector.',
    icon: 'fas fa-oil-can',
    link: 'https://egpc.com.eg',
    skills: ['Reservoir Simulation', 'Drilling', 'Petrel', 'Data Analysis'],
    postedDate: '2026-01-12'
  },
  {
    title: 'Mechatronics Engineering Intern',
    company: 'Valeo Egypt',
    category: 'Engineering',
    location: 'Cairo Festival City, Cairo',
    duration: '12 weeks',
    stipend: 'EGP 5,200/mo',
    price: 5200,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Work on automotive embedded systems and sensor integration at one of Egypt\'s leading automotive tech manufacturers.',
    icon: 'fas fa-cogs',
    link: 'https://valeo.com/en/careers',
    skills: ['Embedded C', 'MATLAB', 'CAN Bus', 'PCB Design'],
    postedDate: '2026-02-05'
  },

  // Mass Communication
  {
    title: 'Digital Journalism Intern',
    company: 'Al-Masry Al-Youm',
    category: 'Mass Communication',
    location: 'Downtown, Cairo',
    duration: '8 weeks',
    stipend: 'EGP 2,200/mo',
    price: 2200,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Write, edit, and publish digital news content. Learn newsroom workflows and investigative reporting under senior journalists.',
    icon: 'fas fa-newspaper',
    link: 'https://almasryalyoum.com',
    skills: ['Writing', 'Arabic', 'Reporting', 'SEO'],
    postedDate: '2026-01-22'
  },
  {
    title: 'Video Production Intern',
    company: 'MBC Masr',
    category: 'Mass Communication',
    location: 'Media Production City, Giza',
    duration: '10 weeks',
    stipend: 'EGP 2,800/mo',
    price: 2800,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Assist in production of TV segments and digital video content. Work with editing software and on-set crews.',
    icon: 'fas fa-video',
    link: 'https://mbc.net/ar/corporate/careers',
    skills: ['Premiere Pro', 'After Effects', 'Storytelling', 'Camera Operation'],
    postedDate: '2026-01-28'
  },
  {
    title: 'Public Relations Intern',
    company: 'Weber Shandwick Egypt',
    category: 'Mass Communication',
    location: 'Remote',
    duration: '8 weeks',
    stipend: 'EGP 2,500/mo',
    price: 2500,
    type: 'Paid',
    workMode: 'Remote',
    description: 'Support PR campaigns for major Egyptian and regional brands. Draft press releases, manage media lists, and track coverage.',
    icon: 'fas fa-bullhorn',
    link: 'https://webershandwick.com/work-at-weber',
    skills: ['PR Writing', 'Media Relations', 'Excel', 'Communication'],
    postedDate: '2026-02-12'
  },

  // Law
  {
    title: 'Corporate Law Intern',
    company: 'Matouk Bassiouny & Hennawy',
    category: 'Law',
    location: 'Garden City, Cairo',
    duration: '10 weeks',
    stipend: 'EGP 3,200/mo',
    price: 3200,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Work with lawyers on corporate transactions, mergers, and regulatory compliance for Egypt\'s top full-service law firm.',
    icon: 'fas fa-balance-scale',
    link: 'https://matoukbassiouny.com/careers',
    skills: ['Legal Drafting', 'Corporate Law', 'Research', 'Arabic & English'],
    postedDate: '2026-01-15'
  },
  {
    title: 'Intellectual Property Intern',
    company: 'TIPA Law Firm',
    category: 'Law',
    location: 'Dokki, Giza',
    duration: '8 weeks',
    stipend: 'EGP 2,800/mo',
    price: 2800,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Assist in trademark registration, patent filing, and IP enforcement cases across Egypt and North Africa.',
    icon: 'fas fa-trademark',
    link: 'https://tipalaw.com',
    skills: ['IP Law', 'Legal Research', 'Filing', 'Documentation'],
    postedDate: '2026-02-03'
  },

  // Psychology
  {
    title: 'Clinical Psychology Intern',
    company: 'Behman Hospital',
    category: 'Science',
    location: 'Helwan, Cairo',
    duration: '12 weeks',
    stipend: 'EGP 2,000/mo',
    price: 2000,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Work under licensed psychologists on patient assessments, group therapy sessions, and clinical documentation at Egypt\'s oldest psychiatric hospital.',
    icon: 'fas fa-brain',
    link: 'https://behman.com',
    skills: ['Psychological Assessment', 'Case Notes', 'Empathy', 'DSM-5'],
    postedDate: '2026-01-20'
  },
  {
    title: 'HR & Organizational Psychology Intern',
    company: 'Egabi Solutions',
    category: 'Business',
    location: 'Remote',
    duration: '10 weeks',
    stipend: 'EGP 2,500/mo',
    price: 2500,
    type: 'Paid',
    workMode: 'Remote',
    description: 'Apply organizational psychology principles in HR processes including talent assessment, employee engagement surveys, and onboarding design.',
    icon: 'fas fa-users',
    link: 'https://egabi.com/careers',
    skills: ['HR', 'Psychometrics', 'Survey Design', 'Excel'],
    postedDate: '2026-02-06'
  },

  // Business
  {
    title: 'Business Development Intern',
    company: 'Maxab',
    category: 'Business',
    location: 'New Cairo, Cairo',
    duration: '10 weeks',
    stipend: 'EGP 4,000/mo',
    price: 4000,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Support Maxab\'s expansion strategy across Egyptian markets. Research new verticals, build pitch decks, and assist in partner negotiations.',
    icon: 'fas fa-chart-bar',
    link: 'https://maxab.io/careers',
    skills: ['Market Research', 'PowerPoint', 'Excel', 'Communication'],
    postedDate: '2026-01-25'
  },
  {
    title: 'Supply Chain Intern',
    company: 'Americana Group Egypt',
    category: 'Business',
    location: 'Obour City, Cairo',
    duration: '12 weeks',
    stipend: 'EGP 3,500/mo',
    price: 3500,
    type: 'Paid',
    workMode: 'On-site',
    description: 'Work in one of Egypt\'s largest food companies, gaining exposure to procurement, logistics, and inventory management operations.',
    icon: 'fas fa-boxes',
    link: 'https://americana-food.com/careers',
    skills: ['Supply Chain', 'ERP', 'Excel', 'Operations'],
    postedDate: '2026-02-08'
  },
  {
    title: 'Entrepreneurship & Startup Intern',
    company: 'Flat6Labs Cairo',
    category: 'Business',
    location: 'AUC Avenue, New Cairo',
    duration: '8 weeks',
    stipend: 'EGP 3,000/mo',
    price: 3000,
    type: 'Paid',
    workMode: 'Hybrid',
    description: 'Work at Egypt\'s top startup accelerator. Support portfolio startups with research, pitch preparation, and growth strategies.',
    icon: 'fas fa-rocket',
    link: 'https://flat6labs.com/careers',
    skills: ['Startup Ecosystem', 'Research', 'Pitching', 'Business Modeling'],
    postedDate: '2026-01-30'
  }
];

async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    const internshipCount = await Internship.countDocuments();

    const activeCompanyNames = await Internship.distinct('company');

    await User.deleteMany({
      role: 'company',
      $and: [
        { companyName: { $in: ['Goldman Sachs', 'Google'] } },
        { companyName: { $nin: activeCompanyNames } }
      ]
    });

    if (userCount === 0) {
      console.log('Seeding default users...');
      const hash = (pwd) => bcrypt.hashSync(pwd, 10);

      await User.create([
        {
          name: 'Admin User',
          email: 'admin@admin.com',
          password: hash('admin123'),
          role: 'admin',
          status: 'approved'
        },
        {
          name: 'Microsoft Corp',
          email: 'microsoft@company.com',
          password: hash('company123'),
          role: 'company',
          status: 'approved',
          companyName: 'Microsoft',
          industry: 'Technology',
          description: 'Leading technology company',
          website: 'https://microsoft.com',
          profile: { avatar: '', bio: '' }
        },
        {
          name: 'John Doe',
          email: 'john@stanford.edu',
          password: hash('user123'),
          role: 'user',
          status: 'active',
          year: 2,
          profile: {
            fullName: 'John Doe',
            university: 'Stanford University',
            major: 'Computer Science',
            year: 2,
            skills: ['Python', 'JavaScript']
          },
          takenInternships: []
        },
        {
          name: 'Jane Smith',
          email: 'jane@mit.edu',
          password: hash('user123'),
          role: 'user',
          status: 'active',
          year: 1,
          profile: {
            fullName: 'Jane Smith',
            university: 'MIT',
            major: 'Engineering',
            year: 1,
            skills: ['CAD', 'MATLAB']
          },
          takenInternships: []
        },
        {
          name: 'Mentor User',
          email: 'mentor@university.edu',
          password: hash('mentor123'),
          role: 'mentor',
          status: 'approved',
          year: 3,
          profile: {
            fullName: 'Mentor User',
            university: 'UC Berkeley',
            major: 'Computer Science',
            year: 3,
            skills: ['Python', 'Java']
          },
          takenInternships: []
        }
      ]);

      console.log('   Created 5 default users');
    }

    if (internshipCount === 0) {
      console.log('Seeding default internships...');
      await Internship.insertMany(DEFAULT_INTERNSHIPS);
      console.log('   Created ' + DEFAULT_INTERNSHIPS.length + ' default internships');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

module.exports = seedDatabase;
