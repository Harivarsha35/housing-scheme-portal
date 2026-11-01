const express = require('express');
const router = express.Router();

const schemes = [
  {
    id: 'pmay-urban', name: 'PM Housing Scheme – Urban',
    fullName: 'Pradhan Mantri Awas Yojana – Urban (City Housing for All)',
    description: 'Affordable housing for middle income families living in cities and towns.',
    subsidy: '₹2,67,280', 
    category: ['Middle Income (₹6L - ₹12L)', 'Higher Middle (₹12L - ₹18L)'],
    maxIncome: 1800000, minIncome: 600001,
    area: 'Urban', icon: 'city',
    eligibility: [
      'Must not own a permanent house anywhere in India',
      'Annual family income above ₹6 Lakh (MIG-I / MIG-II)',
      'First-time home buyer preference',
      'Aadhaar card mandatory',
      'Must be Indian citizen'
    ],
    documents: ['Aadhaar Card','Income Certificate','Bank Statement (6 months)','Property Documents','Passport Photo'],
    benefits: { subsidy: '₹2.67 Lakh', loanLimit: '₹12 Lakh', tenure: '20 Years', interestRate: '6.5% p.a.' }
  },
  {
    id: 'pmay-gramin', name: 'PM Housing Scheme – Rural',
    fullName: 'Pradhan Mantri Awas Yojana – Gramin (Village Housing for All)',
    description: 'Housing assistance for rural poor families to build a strong permanent house with basic amenities.',
    subsidy: '₹1,20,000 – ₹1,30,000', 
    category: ['Village Poor Families', 'Homeless / BPL Ration Card'],
    maxIncome: 500000, minIncome: 0,
    area: 'Rural', icon: 'home',
    eligibility: [
      'Must reside in rural area',
      'Annual family income up to ₹5 Lakh',
      'Landless or homeless households priority',
      'SC/ST, minority families priority',
      'Not availed any other housing scheme'
    ],
    documents: ['Aadhaar Card','BPL Certificate','Land Documents','Bank Account Details','Caste Certificate (if applicable)'],
    benefits: { assistance: '₹1.20–1.30 Lakh', toilet: '₹12,000 (MGNREGS)', labourer: '90-95 days MGNREGS' }
  },
  {
    id: 'sc-st', name: 'SC / ST Special Housing Grant',
    fullName: 'Special Housing Assistance Scheme for Scheduled Caste & Scheduled Tribe Families',
    description: 'Dedicated housing grant for SC and ST families to build or improve their home across all states.',
    subsidy: '₹1,50,000', 
    category: ['Scheduled Caste (SC)', 'Scheduled Tribe (ST)'],
    maxIncome: 900000, area: 'All Areas', icon: 'shield-alt',
    eligibility: [
      'Must belong to SC or ST community',
      'Valid caste certificate required',
      'Annual income below ₹9 Lakh',
      'No permanent dwelling',
      'Priority to BPL families'
    ],
    documents: ['Aadhaar Card','Caste Certificate','Income Certificate','Residential Certificate','Bank Passbook'],
    benefits: { grant: '₹1.5 Lakh', additionalSupport: 'Technical assistance for construction', loanSubsidy: '3% interest subsidy' }
  },
  {
    id: 'senior', name: 'Senior Citizen Affordable Housing',
    fullName: 'Housing Assistance Scheme for Senior Citizens (Age 60+)',
    description: 'Subsidized housing with care services for Indian citizens aged 60 and above who need a safe home.',
    subsidy: 'Subsidized Rent', 
    category: ['Senior Citizens (Age 60+)'],
    area: 'Urban & Semi-Urban', icon: 'user-friends',
    eligibility: [
      'Age 60 years or above',
      'Indian citizen',
      'Annual income below ₹5 Lakh',
      'No adequate housing facility',
      'Priority to widowed/divorced senior citizens'
    ],
    documents: ['Aadhaar Card','Age Proof','Income Certificate','Medical Certificate','Bank Details'],
    benefits: { rent: '25% below market rate', maintenance: 'Covered', careServices: 'Basic health care access' }
  }
];

router.get('/', (req, res) => res.json({ success: true, schemes }));
router.get('/:id', (req, res) => {
  const scheme = schemes.find(s => s.id === req.params.id);
  if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found.' });
  res.json({ success: true, scheme });
});

module.exports = router;
