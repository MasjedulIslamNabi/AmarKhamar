import { FarmData } from '../types/farm';

export const initialFarmData: FarmData = {
  farmName: "Amar Khamar Agro & Dairy",
  updatedAt: new Date().toISOString(),
  cattle: [
    {
      id: "cow-1",
      tagNumber: "AK-101",
      breed: "Brahman",
      gender: "Bull",
      weight: 645,
      source: "Purchased",
      purchaseDate: "2026-03-15",
      purchasePrice: 165000,
      status: "Active",
      notes: "High-pedigree American Brahman bull. Excellent feed conversion and docile temperament.",
      weightRecords: [
        { id: "w-1-1", date: "2026-03-15", weight: 520, notes: "Arrival weight" },
        { id: "w-1-2", date: "2026-05-15", weight: 565, notes: "Post-deworming check" },
        { id: "w-1-3", date: "2026-07-20", weight: 605, notes: "Fattening ration started" },
        { id: "w-1-4", date: "2026-10-10", weight: 645, notes: "Pre-Eid fattening assessment" }
      ],
      healthRecords: [
        {
          id: "h-1-1",
          cowId: "cow-1",
          type: "Vaccine",
          title: "FMD (Foot and Mouth Disease)",
          medicineName: "Aftovax Bivalent",
          dosage: "3ml Subcutaneous",
          date: "2026-04-10",
          nextBoosterDate: "2026-10-28",
          administeredBy: "Dr. Rafiqul Islam, DVM",
          notes: "Routine semi-annual vaccination"
        },
        {
          id: "h-1-2",
          cowId: "cow-1",
          type: "Treatment",
          title: "Broad Spectrum Deworming",
          medicineName: "Albendazole Oral Bolus",
          dosage: "2 Bolus",
          date: "2026-05-12",
          administeredBy: "Dr. Rafiqul Islam, DVM",
          notes: "Quarterly preventative parasite control"
        }
      ]
    },
    {
      id: "cow-2",
      tagNumber: "AK-102",
      breed: "Sahiwal",
      gender: "Cow",
      weight: 450,
      source: "Born on Farm",
      purchaseDate: "2024-11-05",
      purchasePrice: 0,
      status: "Active",
      notes: "Prime dairy cow in second lactation. Produces 16L milk daily with 4.5% fat.",
      weightRecords: [
        { id: "w-2-1", date: "2026-02-10", weight: 420 },
        { id: "w-2-2", date: "2026-06-15", weight: 440 },
        { id: "w-2-3", date: "2026-10-01", weight: 450 }
      ],
      healthRecords: [
        {
          id: "h-2-1",
          cowId: "cow-2",
          type: "Vaccine",
          title: "Anthrax Spore Vaccine",
          medicineName: "Anthrax Vaccine (DLS)",
          dosage: "1ml Subcutaneous",
          date: "2026-06-01",
          nextBoosterDate: "2027-06-01",
          administeredBy: "Dr. Rafiqul Islam, DVM"
        },
        {
          id: "h-2-2",
          cowId: "cow-2",
          type: "Routine Checkup",
          title: "Post-Calving Reproductive Exam",
          date: "2026-07-15",
          administeredBy: "Dr. Rafiqul Islam, DVM",
          notes: "Uterine involution complete, healthy cycle detected."
        }
      ]
    },
    {
      id: "cow-3",
      tagNumber: "AK-103",
      breed: "Holstein Friesian",
      gender: "Cow",
      weight: 520,
      source: "Purchased",
      purchaseDate: "2025-08-20",
      purchasePrice: 195000,
      status: "Active",
      notes: "Commercial dairy producer. Average 22L/day. Requires cool misting in summer.",
      weightRecords: [
        { id: "w-3-1", date: "2026-01-15", weight: 490 },
        { id: "w-3-2", date: "2026-06-10", weight: 510 },
        { id: "w-3-3", date: "2026-09-25", weight: 520 }
      ],
      healthRecords: [
        {
          id: "h-3-1",
          cowId: "cow-3",
          type: "Vaccine",
          title: "Black Quarter (BQ)",
          medicineName: "Chauvovax",
          dosage: "2ml Intramuscular",
          date: "2026-05-18",
          nextBoosterDate: "2026-11-18",
          administeredBy: "Dr. Rafiqul Islam, DVM"
        }
      ]
    },
    {
      id: "cow-4",
      tagNumber: "AK-104",
      breed: "Red Sindhi",
      gender: "Bull",
      weight: 580,
      source: "Purchased",
      purchaseDate: "2026-02-12",
      purchasePrice: 140000,
      status: "Active",
      notes: "Heat-tolerant native bull. Hardy and disease-resistant.",
      weightRecords: [
        { id: "w-4-1", date: "2026-02-12", weight: 470 },
        { id: "w-4-2", date: "2026-06-20", weight: 530 },
        { id: "w-4-3", date: "2026-10-15", weight: 580 }
      ],
      healthRecords: [
        {
          id: "h-4-1",
          cowId: "cow-4",
          type: "Vaccine",
          title: "Lumpy Skin Disease (LSD)",
          medicineName: "Lumpyvac",
          dosage: "2ml Subcutaneous",
          date: "2026-03-20",
          nextBoosterDate: "2027-03-20",
          administeredBy: "Dr. Rafiqul Islam, DVM"
        }
      ]
    },
    {
      id: "cow-5",
      tagNumber: "AK-105",
      breed: "Sahiwal",
      gender: "Calf",
      weight: 135,
      source: "Born on Farm",
      purchaseDate: "2026-05-14",
      purchasePrice: 0,
      status: "Active",
      notes: "Heifer calf out of AK-102. High potential replacement heifer.",
      weightRecords: [
        { id: "w-5-1", date: "2026-05-14", weight: 32, notes: "Birth weight" },
        { id: "w-5-2", date: "2026-07-14", weight: 75, notes: "Weaning milestone" },
        { id: "w-5-3", date: "2026-10-14", weight: 135, notes: "Starter concentrate grower" }
      ],
      healthRecords: [
        {
          id: "h-5-1",
          cowId: "cow-5",
          type: "Routine Checkup",
          title: "Ear Tagging & Microchip",
          date: "2026-05-20",
          administeredBy: "Kabir Hossain",
          notes: "Applied visual tag AK-105"
        }
      ]
    }
  ],
  feed: [
    {
      id: "feed-1",
      date: "2026-10-01",
      feedType: "Concentrates",
      quantity: 1200,
      cost: 48000,
      notes: "High-protein wheat bran, mustard cake & corn mash mix (40 Taka/kg)"
    },
    {
      id: "feed-2",
      date: "2026-10-08",
      feedType: "Grass",
      quantity: 3500,
      cost: 21000,
      notes: "Fresh Napier grass harvested from local contract plot (6 Taka/kg)"
    },
    {
      id: "feed-3",
      date: "2026-10-15",
      feedType: "Straw",
      quantity: 1500,
      cost: 13500,
      notes: "Dry paddy straw bundles (9 Taka/kg)"
    },
    {
      id: "feed-4",
      date: "2026-10-22",
      feedType: "Supplements",
      quantity: 80,
      cost: 16000,
      notes: "Calcium booster, dicalcium phosphate & chelated mineral mixture"
    }
  ],
  employees: [
    {
      id: "emp-1",
      name: "Kabir Hossain",
      role: "Farm Supervisor",
      baseSalary: 22000,
      joinDate: "2024-01-15",
      phone: "+880 1711-234567",
      status: "Active",
      payments: [
        { id: "p-1-1", month: "2026-08", amount: 22000, paymentDate: "2026-09-02", status: "Paid" },
        { id: "p-1-2", month: "2026-09", amount: 22000, paymentDate: "2026-10-02", status: "Paid" },
        { id: "p-1-3", month: "2026-10", amount: 22000, paymentDate: "2026-10-25", status: "Paid" }
      ]
    },
    {
      id: "emp-2",
      name: "Mokbul Mia",
      role: "Senior Herdsman & Milker",
      baseSalary: 16000,
      joinDate: "2024-06-01",
      phone: "+880 1822-987654",
      status: "Active",
      payments: [
        { id: "p-2-1", month: "2026-08", amount: 16000, paymentDate: "2026-09-02", status: "Paid" },
        { id: "p-2-2", month: "2026-09", amount: 16000, paymentDate: "2026-10-02", status: "Paid" },
        { id: "p-2-3", month: "2026-10", amount: 16000, paymentDate: "2026-10-25", status: "Paid" }
      ]
    },
    {
      id: "emp-3",
      name: "Sohel Rana",
      role: "Feed & Fodder Handler",
      baseSalary: 14000,
      joinDate: "2025-03-10",
      phone: "+880 1933-456789",
      status: "Active",
      payments: [
        { id: "p-3-1", month: "2026-08", amount: 14000, paymentDate: "2026-09-02", status: "Paid" },
        { id: "p-3-2", month: "2026-09", amount: 14000, paymentDate: "2026-10-02", status: "Paid" },
        { id: "p-3-3", month: "2026-10", amount: 14000, paymentDate: "2026-10-28", status: "Pending" }
      ]
    }
  ],
  sales: [
    {
      id: "sale-1",
      cowId: "cow-sold-1",
      tagNumber: "AK-088",
      breed: "Brahman Cross",
      purchasePrice: 120000,
      salePrice: 195000,
      buyerName: "Al-Amin Agro Traders",
      buyerContact: "+880 1712-001122",
      date: "2026-06-12",
      profitOrLoss: 75000,
      notes: "Sold for Qurbani market. Weight at sale: 610 kg."
    },
    {
      id: "sale-2",
      cowId: "cow-sold-2",
      tagNumber: "AK-092",
      breed: "Mirka",
      purchasePrice: 110000,
      salePrice: 172000,
      buyerName: "Haji Nurul Islam",
      buyerContact: "+880 1819-334455",
      date: "2026-06-14",
      profitOrLoss: 62000,
      notes: "Prime fattened bull. 14 months on farm."
    }
  ]
};
