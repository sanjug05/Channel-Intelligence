'use strict';
// ─── sampleData.js — Synthetic demo data (non-confidential) ───────────────────

const PARTNERS = [
  // ── North Zone ──────────────────────────────────────────────────────────────
  { id:1,  partnerCode:'NZ-DL-001', firmName:'Varun Enterprises Pvt Ltd',   partnerName:'Varun Gupta',       asm:'Rajesh Kumar', rm:'Suresh Mehta',      territory:'Delhi NCR',   zone:'North', city:'New Delhi',   state:'Delhi',         tier:'Tier 1', verificationStatus:'Verified',     verificationNotes:'All KYC cleared 12-Jan-2025. GST & trade license verified by compliance team.' },
  { id:2,  partnerCode:'NZ-DL-002', firmName:'Shalimar Trading Co',          partnerName:'Mohit Aggarwal',    asm:'Rajesh Kumar', rm:'Suresh Mehta',      territory:'Delhi NCR',   zone:'North', city:'Gurgaon',     state:'Haryana',       tier:'Tier 2', verificationStatus:'Pending',      verificationNotes:'Awaiting GST certificate re-submission since 03-Mar-2026. Reminder sent twice.' },
  { id:3,  partnerCode:'NZ-UP-003', firmName:'AgroTech Solutions Ltd',        partnerName:'Rakesh Yadav',      asm:'Rajesh Kumar', rm:'Poonam Verma',      territory:'UP West',     zone:'North', city:'Noida',       state:'Uttar Pradesh', tier:'Tier 2', verificationStatus:'Verified',     verificationNotes:'All documents verified 05-Feb-2025. Onboarded via ASM referral.' },
  { id:4,  partnerCode:'NZ-UP-004', firmName:'Krishna Commercial Corp',       partnerName:'Arvind Mishra',     asm:'Rajesh Kumar', rm:'Poonam Verma',      territory:'UP East',     zone:'North', city:'Lucknow',     state:'Uttar Pradesh', tier:'Tier 3', verificationStatus:'Under Review', verificationNotes:'Address proof discrepancy flagged 15-Apr-2026. RM following up.' },
  // ── South Zone ──────────────────────────────────────────────────────────────
  { id:5,  partnerCode:'SZ-KA-005', firmName:'Deccan Distributors Pvt Ltd',  partnerName:'Shrinivas Rao',     asm:'Meera Patel',  rm:'Kavita Reddy',      territory:'Karnataka N', zone:'South', city:'Bengaluru',   state:'Karnataka',     tier:'Tier 1', verificationStatus:'Verified',     verificationNotes:'Platinum-tier. All compliances cleared Jan-2025. Consistent top performer.' },
  { id:6,  partnerCode:'SZ-KA-006', firmName:'Southern Star Agencies',        partnerName:'Kiran Murthy',      asm:'Meera Patel',  rm:'Kavita Reddy',      territory:'Karnataka S', zone:'South', city:'Mysuru',      state:'Karnataka',     tier:'Tier 2', verificationStatus:'Verified',     verificationNotes:'Verified 20-Mar-2025. GST OK. Annual renewal due Nov-2026.' },
  { id:7,  partnerCode:'SZ-TN-007', firmName:'Chennai Prime Traders',         partnerName:'Sundaram Pillai',   asm:'Meera Patel',  rm:'Anand Subramanian', territory:'TN North',    zone:'South', city:'Chennai',     state:'Tamil Nadu',    tier:'Tier 1', verificationStatus:'Verified',     verificationNotes:'Long-term partner since 2019. All documents clear. No open issues.' },
  { id:8,  partnerCode:'SZ-TN-008', firmName:'Kovai Business Hub',            partnerName:'Muthukumar K.',     asm:'Meera Patel',  rm:'Anand Subramanian', territory:'TN South',    zone:'South', city:'Coimbatore',  state:'Tamil Nadu',    tier:'Tier 3', verificationStatus:'Rejected',     verificationNotes:'Rejected 10-Jan-2026. Forged trade license detected. Escalated to legal team.' },
  // ── West Zone ───────────────────────────────────────────────────────────────
  { id:9,  partnerCode:'WZ-MH-009', firmName:'Mumbai First Associates',       partnerName:'Nilesh Joshi',      asm:'Amit Singh',   rm:'Deepak Patil',      territory:'Mumbai Metro',zone:'West',  city:'Mumbai',      state:'Maharashtra',   tier:'Tier 1', verificationStatus:'Verified',     verificationNotes:'Top performer. All docs verified Jan-2025. Signed 3-year agreement.' },
  { id:10, partnerCode:'WZ-MH-010', firmName:'Pune Tech Distributors',        partnerName:'Sneha Kulkarni',    asm:'Amit Singh',   rm:'Deepak Patil',      territory:'Pune Belt',   zone:'West',  city:'Pune',        state:'Maharashtra',   tier:'Tier 2', verificationStatus:'Pending',      verificationNotes:'New onboarding. Docs submitted 01-Jun-2026. Awaiting RM review.' },
  { id:11, partnerCode:'WZ-GJ-011', firmName:'Ahmedabad Commerce Pvt Ltd',    partnerName:'Hitesh Shah',       asm:'Amit Singh',   rm:'Bhavana Mehta',     territory:'Gujarat N',   zone:'West',  city:'Ahmedabad',   state:'Gujarat',       tier:'Tier 1', verificationStatus:'Verified',     verificationNotes:'Verified Feb-2025. GST & trade license confirmed. Renewal tracking on schedule.' },
  { id:12, partnerCode:'WZ-GJ-012', firmName:'Surat Diamond Traders',         partnerName:'Ketan Vora',        asm:'Amit Singh',   rm:'Bhavana Mehta',     territory:'Gujarat S',   zone:'West',  city:'Surat',       state:'Gujarat',       tier:'Tier 2', verificationStatus:'Verified',     verificationNotes:'Verified Apr-2025. Strong local network, consistently high AIS lead conversion.' },
  // ── East Zone ───────────────────────────────────────────────────────────────
  { id:13, partnerCode:'EZ-WB-013', firmName:'Kolkata Central Agencies',      partnerName:'Soumen Das',        asm:'Priya Sharma', rm:'Subhash Mondal',    territory:'WB North',    zone:'East',  city:'Kolkata',     state:'West Bengal',   tier:'Tier 1', verificationStatus:'Verified',     verificationNotes:'Verified Jan-2025. Consistent performer. East zone anchor partner.' },
  { id:14, partnerCode:'EZ-WB-014', firmName:'Howrah Trade Links',            partnerName:'Piyali Ghosh',      asm:'Priya Sharma', rm:'Subhash Mondal',    territory:'WB South',    zone:'East',  city:'Howrah',      state:'West Bengal',   tier:'Tier 3', verificationStatus:'Pending',      verificationNotes:'Doc re-upload pending since Feb-2026. Two reminders sent. RM escalated to ASM.' },
  { id:15, partnerCode:'EZ-OD-015', firmName:'Bhubaneswar Retail Corp',       partnerName:'Sanjay Nayak',      asm:'Priya Sharma', rm:'Rina Dash',         territory:'Odisha',      zone:'East',  city:'Bhubaneswar', state:'Odisha',        tier:'Tier 2', verificationStatus:'Verified',     verificationNotes:'Verified Mar-2025. Strong rural penetration. Eligible for Tier 1 upgrade in Q3.' },
  { id:16, partnerCode:'EZ-JH-016', firmName:'Ranchi Business Solutions',     partnerName:'Rajiv Prasad',      asm:'Priya Sharma', rm:'Rina Dash',         territory:'Jharkhand',   zone:'East',  city:'Ranchi',      state:'Jharkhand',     tier:'Tier 3', verificationStatus:'Under Review', verificationNotes:'Address mismatch flagged during annual audit May-2026. Physical verification scheduled.' },
];

// Base monthly sales profiles (values in ₹)
const SALES_PROFILES = {
  'NZ-DL-001': { base:2800000, var:400000, obk:180000, ueob:120000, ais:45, worked:38, gen:28, crm:22 },
  'NZ-DL-002': { base:1600000, var:280000, obk:95000,  ueob:62000,  ais:30, worked:22, gen:15, crm:10 },
  'NZ-UP-003': { base:1900000, var:320000, obk:115000, ueob:76000,  ais:35, worked:28, gen:20, crm:16 },
  'NZ-UP-004': { base:1050000, var:190000, obk:62000,  ueob:40000,  ais:22, worked:15, gen:10, crm:7  },
  'SZ-KA-005': { base:3400000, var:480000, obk:225000, ueob:150000, ais:55, worked:48, gen:35, crm:28 },
  'SZ-KA-006': { base:2050000, var:310000, obk:132000, ueob:88000,  ais:38, worked:30, gen:22, crm:17 },
  'SZ-TN-007': { base:3100000, var:440000, obk:205000, ueob:138000, ais:50, worked:42, gen:32, crm:25 },
  'SZ-TN-008': { base:870000,  var:140000, obk:52000,  ueob:33000,  ais:18, worked:10, gen:6,  crm:4  },
  'WZ-MH-009': { base:4200000, var:580000, obk:285000, ueob:192000, ais:65, worked:58, gen:45, crm:36 },
  'WZ-MH-010': { base:1380000, var:240000, obk:82000,  ueob:54000,  ais:25, worked:18, gen:12, crm:9  },
  'WZ-GJ-011': { base:3650000, var:510000, obk:245000, ueob:163000, ais:60, worked:52, gen:40, crm:32 },
  'WZ-GJ-012': { base:2200000, var:340000, obk:148000, ueob:97000,  ais:40, worked:32, gen:24, crm:19 },
  'EZ-WB-013': { base:2550000, var:390000, obk:168000, ueob:112000, ais:48, worked:40, gen:30, crm:23 },
  'EZ-WB-014': { base:780000,  var:140000, obk:47000,  ueob:29000,  ais:15, worked:8,  gen:5,  crm:3  },
  'EZ-OD-015': { base:1720000, var:270000, obk:108000, ueob:71000,  ais:32, worked:26, gen:18, crm:14 },
  'EZ-JH-016': { base:1180000, var:210000, obk:72000,  ueob:47000,  ais:20, worked:12, gen:8,  crm:5  },
};

// Seasonal sales multipliers by month (Jan–Dec)
const SEASONAL = [0.87, 0.81, 0.94, 1.01, 1.04, 0.97, 0.92, 0.95, 1.04, 1.11, 1.17, 1.28];

// Deterministic LCG — produces consistent pseudo-random sequences per seed
function mkRng(seed) {
  let s = ((seed * 1664525) + 1013904223) >>> 0;
  return function () {
    s = ((s * 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function generateSalesData() {
  const rows = [];
  PARTNERS.forEach((p, pi) => {
    const prof = SALES_PROFILES[p.partnerCode];
    if (!prof) return;

    // ── 2025: all 12 months ────────────────────────────────────────────────
    for (let m = 1; m <= 12; m++) {
      const rng = mkRng(pi * 1000 + m + 2025000);
      const r1 = rng(), r2 = rng(), r3 = rng();
      const sales = Math.max(Math.round((prof.base + (r1 - 0.5) * prof.var * 2) * SEASONAL[m - 1]), 200000);
      rows.push({
        partnerCode: p.partnerCode, year: 2025, month: m,
        sales,
        obk:          Math.round(prof.obk  * (0.78 + r2 * 0.44)),
        ueob:         Math.round(prof.ueob * (0.78 + r2 * 0.44)),
        aisLeads:     Math.round(prof.ais    * (0.68 + r3 * 0.64)),
        leadsWorked:  Math.round(prof.worked * (0.68 + r3 * 0.64)),
        leadsGenerated: Math.round(prof.gen  * (0.68 + r3 * 0.64)),
        leadsCRM:     Math.round(prof.crm    * (0.68 + r3 * 0.64)),
      });
    }

    // ── 2026: Jan–Jun ──────────────────────────────────────────────────────
    for (let m = 1; m <= 6; m++) {
      const rng = mkRng(pi * 1000 + m + 2026000);
      const r1 = rng(), r2 = rng(), r3 = rng();
      const lyRow = rows.find(d => d.partnerCode === p.partnerCode && d.year === 2025 && d.month === m);
      const growthFactor = 1.055 + (r1 - 0.5) * 0.18;
      const sales = Math.max(Math.round((lyRow ? lyRow.sales : prof.base) * growthFactor), 200000);
      rows.push({
        partnerCode: p.partnerCode, year: 2026, month: m,
        sales,
        obk:          Math.round(prof.obk  * (0.82 + r2 * 0.44) * 1.04),
        ueob:         Math.round(prof.ueob * (0.82 + r2 * 0.44) * 1.04),
        aisLeads:     Math.round(prof.ais    * (0.68 + r3 * 0.64)),
        leadsWorked:  Math.round(prof.worked * (0.68 + r3 * 0.64)),
        leadsGenerated: Math.round(prof.gen  * (0.68 + r3 * 0.64)),
        leadsCRM:     Math.round(prof.crm    * (0.68 + r3 * 0.64)),
      });
    }
  });
  return rows;
}

const SALES_DATA = generateSalesData();
