import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { initialFarmData } from '../data/seedData';
import { Cattle, Employee, FarmData, FeedEntry, HealthRecord, Language, Payment, Sale, WeightRecord } from '../types/farm';
import { translations } from '../i18n/translations';
import { resetWhatsAppDispatchData } from '../services/whatsappGatewayService';
import { toast } from 'sonner';

interface FarmContextType {
  data: FarmData;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  addCattle: (cattle: Omit<Cattle, 'id' | 'weightRecords' | 'healthRecords'>) => void;
  updateCattle: (id: string, updates: Partial<Cattle>) => void;
  deleteCattle: (id: string) => void;
  addWeightRecord: (cowId: string, record: Omit<WeightRecord, 'id'>) => void;
  addHealthRecord: (cowId: string, record: Omit<HealthRecord, 'id'>) => void;
  sellCattle: (cowId: string, saleData: { salePrice: number; buyerName: string; buyerContact?: string; date: string; notes?: string }) => void;
  addFeedEntry: (entry: Omit<FeedEntry, 'id'>) => void;
  deleteFeedEntry: (id: string) => void;
  addEmployee: (emp: Omit<Employee, 'id' | 'payments'>) => void;
  updateEmployee: (empId: string, updates: Partial<Employee>) => void;
  deleteEmployee: (empId: string) => void;
  recordPayment: (empId: string, payment: Omit<Payment, 'id'>) => void;
  exportJson: () => void;
  restoreJson: (importedData: FarmData) => void;
  resetToDemo: () => void;
  factoryResetAllData: () => void;
}

const LOCAL_STORAGE_KEY = 'amar_khamar_farm_data_v1';
const LOCAL_STORAGE_LANG = 'amar_khamar_lang';

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_LANG) as Language) || 'en';
  });

  const [data, setData] = useState<FarmData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parsing errors
    }
    return initialFarmData;
  });

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoadRef = useRef(true);

  const t = translations[language];

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LOCAL_STORAGE_LANG, lang);
  };

  // Sync to local storage immediately (Zero Data Loss)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Local storage full or private mode
    }
  }, [data]);

  // Firestore Real-Time Synchronization
  useEffect(() => {
    if (!user) {
      setSyncStatus('offline');
      return;
    }

    const docPath = `users/${user.uid}/farmData/current`;
    const docRef = doc(db, 'users', user.uid, 'farmData', 'current');

    // Subscribe to remote document updates
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as FarmData;
          if (remoteData && remoteData.cattle) {
            setData((prev) => {
              // Only overwrite if remote is newer or first load
              if (isFirstLoadRef.current) {
                isFirstLoadRef.current = false;
                return { ...remoteData, userId: user.uid };
              }
              return prev;
            });
          }
          setSyncStatus('synced');
        } else {
          // Document does not exist yet for new user, seed initial data
          isFirstLoadRef.current = false;
          saveToFirestore(data);
        }
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.GET, docPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Debounced Auto-Save to Firestore (1.5 seconds)
  const saveToFirestore = (updatedData: FarmData) => {
    if (!user) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSyncStatus('syncing');

    debounceTimerRef.current = setTimeout(async () => {
      const docPath = `users/${user.uid}/farmData/current`;
      try {
        const payload: FarmData = {
          ...updatedData,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid, 'farmData', 'current'), payload);
        setSyncStatus('synced');
      } catch (error) {
        setSyncStatus('error');
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }, 1500);
  };

  const mutateData = (updater: (prev: FarmData) => FarmData) => {
    setData((prev) => {
      const next = updater(prev);
      saveToFirestore(next);
      return next;
    });
  };

  const addCattle = (cattleInput: Omit<Cattle, 'id' | 'weightRecords' | 'healthRecords'>) => {
    const id = `cow-${Date.now()}`;
    const initialWeightRecord: WeightRecord = {
      id: `w-${Date.now()}`,
      date: cattleInput.purchaseDate || new Date().toISOString().split('T')[0],
      weight: cattleInput.weight,
      notes: "Initial registration weight"
    };

    const newCattle: Cattle = {
      ...cattleInput,
      id,
      status: 'Active',
      weightRecords: [initialWeightRecord],
      healthRecords: []
    };

    mutateData((prev) => ({
      ...prev,
      cattle: [newCattle, ...prev.cattle]
    }));
    toast.success(t.cattleAdded);
  };

  const updateCattle = (id: string, updates: Partial<Cattle>) => {
    mutateData((prev) => ({
      ...prev,
      cattle: prev.cattle.map((c) => (c.id === id ? { ...c, ...updates } : c))
    }));
    toast.success(t.cattleUpdated);
  };

  const deleteCattle = (id: string) => {
    mutateData((prev) => ({
      ...prev,
      cattle: prev.cattle.filter((c) => c.id !== id)
    }));
    toast.info(t.cattleDeleted);
  };

  const addWeightRecord = (cowId: string, record: Omit<WeightRecord, 'id'>) => {
    const newRecord: WeightRecord = {
      ...record,
      id: `w-${Date.now()}`
    };

    mutateData((prev) => ({
      ...prev,
      cattle: prev.cattle.map((c) => {
        if (c.id === cowId) {
          const records = [...(c.weightRecords || []), newRecord].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          return {
            ...c,
            weight: record.weight, // Update latest current weight
            weightRecords: records
          };
        }
        return c;
      })
    }));
    toast.success(t.weightLogged);
  };

  const addHealthRecord = (cowId: string, record: Omit<HealthRecord, 'id'>) => {
    const newRecord: HealthRecord = {
      ...record,
      id: `h-${Date.now()}`
    };

    mutateData((prev) => ({
      ...prev,
      cattle: prev.cattle.map((c) => {
        if (c.id === cowId) {
          return {
            ...c,
            healthRecords: [newRecord, ...(c.healthRecords || [])]
          };
        }
        return c;
      })
    }));
    toast.success(t.healthLogged);
  };

  const sellCattle = (
    cowId: string,
    saleData: { salePrice: number; buyerName: string; buyerContact?: string; date: string; notes?: string }
  ) => {
    const targetCow = data.cattle.find((c) => c.id === cowId);
    if (!targetCow) return;

    const purchasePrice = targetCow.purchasePrice || 0;
    const profitOrLoss = saleData.salePrice - purchasePrice;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      cowId,
      tagNumber: targetCow.tagNumber,
      breed: targetCow.breed,
      purchasePrice,
      salePrice: saleData.salePrice,
      buyerName: saleData.buyerName,
      buyerContact: saleData.buyerContact,
      date: saleData.date,
      profitOrLoss,
      notes: saleData.notes
    };

    mutateData((prev) => ({
      ...prev,
      cattle: prev.cattle.map((c) => (c.id === cowId ? { ...c, status: 'Sold' as const } : c)),
      sales: [newSale, ...prev.sales]
    }));

    toast.success(t.cattleSoldSuccess);
  };

  const addFeedEntry = (entry: Omit<FeedEntry, 'id'>) => {
    const newFeed: FeedEntry = {
      ...entry,
      id: `feed-${Date.now()}`
    };

    mutateData((prev) => ({
      ...prev,
      feed: [newFeed, ...prev.feed]
    }));
    toast.success(t.feedLogged);
  };

  const deleteFeedEntry = (id: string) => {
    mutateData((prev) => ({
      ...prev,
      feed: prev.feed.filter((f) => f.id !== id)
    }));
  };

  const addEmployee = (emp: Omit<Employee, 'id' | 'payments'>) => {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
      payments: []
    };

    mutateData((prev) => ({
      ...prev,
      employees: [newEmp, ...prev.employees]
    }));
    toast.success(t.employeeAdded);
  };

  const updateEmployee = (empId: string, updates: Partial<Employee>) => {
    mutateData((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === empId ? { ...e, ...updates } : e))
    }));
    toast.success(language === 'bn' ? 'কর্মীর তথ্য সফলভাবে আপডেট হয়েছে' : 'Employee details updated');
  };

  const deleteEmployee = (empId: string) => {
    mutateData((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== empId)
    }));
    toast.success(language === 'bn' ? 'কর্মী অপসারিত হয়েছে' : 'Employee removed');
  };

  const recordPayment = (empId: string, payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...payment,
      id: `pay-${Date.now()}`
    };

    mutateData((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => {
        if (e.id === empId) {
          return {
            ...e,
            payments: [newPayment, ...e.payments]
          };
        }
        return e;
      })
    }));
    toast.success(t.paymentRecorded);
  };

  const exportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `amar_khamar_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const restoreJson = (importedData: FarmData) => {
    if (!importedData.cattle || !importedData.feed) {
      toast.error(t.invalidFile);
      return;
    }
    mutateData(() => importedData);
    toast.success(t.dataRestored);
  };

  const resetToDemo = () => {
    resetWhatsAppDispatchData('demo');
    mutateData(() => ({
      ...initialFarmData,
      updatedAt: new Date().toISOString()
    }));
    toast.success(
      language === 'bn'
        ? 'খামারের ডাটা সফলভাবে ডিফল্ট ডেমো রেকর্ডে রিসেট করা হয়েছে'
        : t.demoLoaded
    );
  };

  const factoryResetAllData = () => {
    resetWhatsAppDispatchData('wipe');
    mutateData((prev) => ({
      userId: prev.userId || 'guest',
      farmName: prev.farmName || 'Amar Khamar',
      cattle: [],
      feed: [],
      employees: [],
      sales: [],
      updatedAt: new Date().toISOString()
    }));
    toast.success(
      language === 'bn'
        ? 'সম্পূর্ণ ফ্যাক্টরি রিসেট সম্পন্ন হয়েছে — সকল রেকর্ড মুছে ফেলা হয়েছে।'
        : 'Master Factory Reset complete — all farm records, ledgers, and dispatch logs wiped.'
    );
  };

  return (
    <FarmContext.Provider
      value={{
        data,
        syncStatus,
        language,
        setLanguage,
        t,
        addCattle,
        updateCattle,
        deleteCattle,
        addWeightRecord,
        addHealthRecord,
        sellCattle,
        addFeedEntry,
        deleteFeedEntry,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        recordPayment,
        exportJson,
        restoreJson,
        resetToDemo,
        factoryResetAllData
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}
