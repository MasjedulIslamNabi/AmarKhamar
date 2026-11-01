import { FarmData, Employee } from '../types/farm';

export type DispatchTemplateType = 'feed' | 'vaccine' | 'weighin' | 'salary' | 'emergency';

export interface DispatchOptions {
  language: 'en' | 'bn';
  recipientId?: string; // employee ID or empty for all
  customNote?: string;
  targetPaymentId?: string;
}

/**
 * Clean phone number into international format for WhatsApp / SMS
 */
export function formatPhoneNumberForMessaging(phone?: string): string {
  if (!phone) return '';
  // Remove non-numeric characters except +
  let cleaned = phone.replace(/[^0-9]/g, '');
  // If Bangladesh local format starting with 01
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '88' + cleaned;
  }
  return cleaned;
}

/**
 * Generate formatted dispatch message for WhatsApp and SMS
 */
export function generateDispatchMessage(
  templateType: DispatchTemplateType,
  data: FarmData,
  options: DispatchOptions
): string {
  const isBn = options.language === 'bn';
  const farmName = data.farmName || (isBn ? 'আমার খামার' : 'Amar Khamar Agro Farm');
  const dateStr = new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const activeCattle = data.cattle.filter((c) => c.status === 'Active');
  const bullCount = activeCattle.filter((c) => c.gender === 'Bull').length;
  const cowCount = activeCattle.filter((c) => c.gender === 'Cow').length;
  const calfCount = activeCattle.filter((c) => c.gender === 'Calf').length;

  const recipient: Employee | undefined = options.recipientId 
    ? data.employees.find((e) => e.id === options.recipientId)
    : undefined;

  switch (templateType) {
    case 'feed': {
      // Feed Ration calculation
      const concentrateKg = Math.round(bullCount * 2.5 + cowCount * 2.0 + calfCount * 0.8);
      const grassKg = Math.round(bullCount * 12 + cowCount * 15 + calfCount * 4);
      const strawKg = Math.round(bullCount * 4 + cowCount * 5 + calfCount * 1.5);

      if (isBn) {
        return (
          `*🌾 [${farmName}] - দৈনিক খাদ্য বণ্টন নির্দেশিকা*\n` +
          `তারিখ: ${dateStr}\n` +
          `${recipient ? `প্রাপক: *${recipient.name}* (${recipient.role})\n` : 'প্রাপক: সকল খামার কর্মী\n'}` +
          `-------------------------------\n` +
          `*পশুর সংখ্যা:* মোট ${activeCattle.length}টি (ষাঁড়: ${bullCount}, গাভী: ${cowCount}, বাছুর: ${calfCount})\n\n` +
          `*আজকের সুষম খাদ্য বরাদ্দ:*\n` +
          `• দানাদার মিশ্রণ: ${concentrateKg} কেজি (সকালে ও বিকেলে অর্ধেক করে)\n` +
          `• কাঁচা নেপিয়ার ঘাস: ${grassKg} কেজি (ভালোভাবে কুচি করে)\n` +
          `• শুকনো খড়: ${strawKg} কেজি (পরিষ্কার ঝাড়াই করা)\n` +
          `• মিনারেল ব্লক ও বিশুদ্ধ পানি: চাড়িতে সার্বক্ষণিক পর্যাপ্ত রাখুন\n\n` +
          `*বিশেষ সতর্কতা:*\n` +
          `খাওয়ানোর পূর্বে পাত্র পরিষ্কার করুন এবং কোনো পশু খাবার কম খেলে তাৎক্ষণিক জানান।\n` +
          `${options.customNote ? `\n*অতিরিক্ত নোট:* ${options.customNote}\n` : ''}` +
          `-------------------------------\n` +
          `- খামার ব্যবস্থাপনা কর্তৃপক্ষ`
        );
      }

      return (
        `*🌾 [${farmName}] - DAILY FEEDING & RATION DISPATCH*\n` +
        `Date: ${dateStr}\n` +
        `${recipient ? `Recipient: *${recipient.name}* (${recipient.role})\n` : 'Recipient: Barn Operations Team\n'}` +
        `-------------------------------\n` +
        `*Herd Count:* Total ${activeCattle.length} heads (Bulls: ${bullCount}, Dairy Cows: ${cowCount}, Calves: ${calfCount})\n\n` +
        `*Today's Nutrition Allocation:*\n` +
        `• Concentrate Ration: ${concentrateKg} kg (split 50/50 morning & evening)\n` +
        `• Fresh Green Fodder: ${grassKg} kg (chopped to 2-3 inch pieces)\n` +
        `• Paddy Straw: ${strawKg} kg (dry, mold-free)\n` +
        `• Mineral Salt Blocks & Clean Water: Ensure 24/7 ad libitum access\n\n` +
        `*Care Protocol:*\n` +
        `Scrub feed bunks prior to distribution. Immediately flag any off-feed cow.\n` +
        `${options.customNote ? `\n*Manager Note:* ${options.customNote}\n` : ''}` +
        `-------------------------------\n` +
        `- Farm Operations Management`
      );
    }

    case 'vaccine': {
      // Find upcoming boosters (next 30 days)
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(now.getDate() + 30);

      const dueCattle: { tag: string; title: string; date: string }[] = [];
      activeCattle.forEach((c) => {
        (c.healthRecords || []).forEach((h) => {
          if (h.type === 'Vaccine' && h.nextBoosterDate) {
            const b = new Date(h.nextBoosterDate);
            if (b <= thirtyDays) {
              dueCattle.push({
                tag: c.tagNumber,
                title: h.title,
                date: h.nextBoosterDate
              });
            }
          }
        });
      });

      const dueTagsList = dueCattle.length > 0 
        ? dueCattle.map(d => `• ট্যাগ #${d.tag}: ${d.title} (তারিখ: ${d.date})`).join('\n')
        : '• সকল গবাদিপশুর টিকা হালনাগাদ রয়েছে। কোনো জরুরি বুস্টার নেই।';

      const dueTagsListEn = dueCattle.length > 0 
        ? dueCattle.map(d => `• Tag #${d.tag}: ${d.title} (Due: ${d.date})`).join('\n')
        : '• All herd immunizations are currently up to date.';

      if (isBn) {
        return (
          `*💉 [${farmName}] - টিকা ও স্বাস্থ্য সতর্কবার্তা*\n` +
          `তারিখ: ${dateStr}\n` +
          `${recipient ? `প্রাপক: *${recipient.name}* (${recipient.role})\n` : 'প্রাপক: স্বাস্থ্য ও প্রাণিসম্পদ কর্মী\n'}` +
          `-------------------------------\n` +
          `*আসন্ন বুস্টার ও প্রতিরোধমূলক টিকা শিডিউল:*\n` +
          `${dueTagsList}\n\n` +
          `*প্রয়োজনীয় প্রস্তুতি:*\n` +
          `১. ভ্যাকসিন কোল্ড চেইন (২-৮°C) অক্ষুণ্ণ রাখুন।\n` +
          `২. ইনজেকশন দেওয়ার পূর্বে প্রতিটি সিরিঞ্জ জীবাণুমুক্ত করুন।\n` +
          `৩. টিকা দেওয়ার পর পশুর শরীরের তাপমাত্রা ও আচরণ পর্যবেক্ষণ করুন।\n` +
          `${options.customNote ? `\n*অতিরিক্ত নোট:* ${options.customNote}\n` : ''}` +
          `-------------------------------\n` +
          `- রেজিস্টার্ড ভেটেরিনারি কেয়ার টিম`
        );
      }

      return (
        `*💉 [${farmName}] - VACCINE & HEALTHCARE ALERT*\n` +
        `Date: ${dateStr}\n` +
        `${recipient ? `Recipient: *${recipient.name}* (${recipient.role})\n` : 'Recipient: Livestock Health Personnel\n'}` +
        `-------------------------------\n` +
        `*Upcoming Vaccine Booster Schedule (Next 30 Days):*\n` +
        `${dueTagsListEn}\n\n` +
        `*Mandatory Preparation:*\n` +
        `1. Maintain strict cold chain (2°C to 8°C) at all times.\n` +
        `2. Use individual sterile needles per animal.\n` +
        `3. Monitor animals for 4 hours post-vaccination for any adverse reaction.\n` +
        `${options.customNote ? `\n*Supervisor Instructions:* ${options.customNote}\n` : ''}` +
        `-------------------------------\n` +
        `- Veterinary & Biosecurity Unit`
      );
    }

    case 'weighin': {
      const topCattleTags = activeCattle.slice(0, 5).map(c => `#${c.tagNumber} (${c.breed})`).join(', ');

      if (isBn) {
        return (
          `*⚖️ [${farmName}] - ওজন পরিমাপ ও গ্রোথ লগ নির্দেশিকা*\n` +
          `তারিখ: ${dateStr}\n` +
          `${recipient ? `দায়িত্বপ্রাপ্ত: *${recipient.name}*\n` : 'দায়িত্বপ্রাপ্ত: খামার সহকারী\n'}` +
          `-------------------------------\n` +
          `*পরিমাপের লক্ষ্য:* সকালের খাবার দেওয়ার পূর্বে ডিজিটাল স্কেলে ওজন রেকর্ড করুন।\n\n` +
          `*আজকের প্রাধান্যপ্রাপ্ত গরু:* ${topCattleTags}\n\n` +
          `*কাজের ধাপ:*\n` +
          `১. স্কেল শূন্য (Tare: 0 kg) কিনা নিশ্চিত হোন।\n` +
          `২. শান্তভাবে গরুকে ওজন প্ল্যাটফর্মে আনুন।\n` +
          `৩. ডিজিটাল রিডিং স্থির হলে ওজন ও তারিখ খাতায় বা অ্যাপে এন্ট্রি করুন।\n` +
          `${options.customNote ? `\n*বিশেষ নির্দেশ:* ${options.customNote}\n` : ''}` +
          `-------------------------------\n` +
          `- উৎপাদন ও মোটাতাজাকরণ সুপারভাইজার`
        );
      }

      return (
        `*⚖️ [${farmName}] - HERD WEIGH-IN & SCALE AUDIT TASK*\n` +
        `Date: ${dateStr}\n` +
        `${recipient ? `Assigned To: *${recipient.name}*\n` : 'Assigned To: Senior Herdsman\n'}` +
        `-------------------------------\n` +
        `*Task:* Record fasting live body weights on the digital livestock scale prior to morning feeding.\n\n` +
        `*Priority Animals Today:* ${topCattleTags}\n\n` +
        `*Standard Operating Procedure:*\n` +
        `1. Tare digital platform to zero before each weighing.\n` +
        `2. Guide animal calmly onto the load bars.\n` +
        `3. Record stabilized digital weight in kg and log in Amar Khamar registry.\n` +
        `${options.customNote ? `\n*Special Notes:* ${options.customNote}\n` : ''}` +
        `-------------------------------\n` +
        `- Livestock Nutrition & Growth Unit`
      );
    }

    case 'salary': {
      // Selected employee and payment
      const emp = recipient || data.employees[0];
      const payment = emp?.payments?.[0];
      const salaryAmount = payment?.amount || emp?.baseSalary || 18000;
      const monthStr = payment?.month || new Date().toISOString().slice(0, 7);

      if (isBn) {
        return (
          `*💵 [${farmName}] - বেতন পরিশোধ নিশ্চিতকরণ রশিদ*\n` +
          `তারিখ: ${dateStr}\n` +
          `কর্মী: *${emp ? emp.name : 'সকল কর্মী'}*\n` +
          `পদবী: ${emp ? emp.role : 'খামার সহকারী'}\n` +
          `-------------------------------\n` +
          `*মাস:* ${monthStr}\n` +
          `*পরিশোধিত অর্থ:* ৳ ${salaryAmount.toLocaleString()} (টাকা)\n` +
          `*পরিশোধের মাধ্যম:* ব্যাংক / নগদ ক্যাশ হ্যান্ডওভার\n` +
          `*স্ট্যাটাস:* সফলভাবে পরিশোধিত (PAID)\n\n` +
          `খামারের উন্নয়ন ও পশুদের নিবেদিত পরিচর্যার জন্য আপনাকে ধন্যবাদ।\n` +
          `${options.customNote ? `\n*নোট:* ${options.customNote}\n` : ''}` +
          `-------------------------------\n` +
          `- খামার প্রশাসন ও হিসাব বিভাগ`
        );
      }

      return (
        `*💵 [${farmName}] - OFFICIAL SALARY DISBURSEMENT RECEIPT*\n` +
        `Date: ${dateStr}\n` +
        `Staff Member: *${emp ? emp.name : 'Staff Personnel'}*\n` +
        `Designation: ${emp ? emp.role : 'Farm Staff'}\n` +
        `-------------------------------\n` +
        `*Disbursement Month:* ${monthStr}\n` +
        `*Amount Paid:* ৳ ${salaryAmount.toLocaleString()} BDT\n` +
        `*Payment Status:* Disbursed & Verified (PAID)\n` +
        `*Method:* Official Farm Payroll Account\n\n` +
        `Thank you for your dedicated service to herd welfare and biosecurity.\n` +
        `${options.customNote ? `\n*Remarks:* ${options.customNote}\n` : ''}` +
        `-------------------------------\n` +
        `- Amar Khamar Accounts & Administration`
      );
    }

    case 'emergency': {
      if (isBn) {
        return (
          `*🚨 [${farmName}] - জরুরি খামার পর্যবেক্ষণ ও সতর্কতা*\n` +
          `তারিখ: ${dateStr}\n` +
          `${recipient ? `প্রাপক: *${recipient.name}*\n` : 'প্রাপক: সকল খামার কর্মী ও সুপারভাইজার\n'}` +
          `-------------------------------\n` +
          `*জরুরি নির্দেশনা:*\n` +
          `১. শেড নাম্বার বা আলাদা কোয়ারেন্টাইন খোপে সন্দেহভাজন গরুকে তাৎক্ষণিক পৃথক করুন।\n` +
          `২. খাদ্য ও পানির পাত্র আলাদা রাখুন যাতে অন্যান্য পশুতে কোনো রোগ না ছড়ায়।\n` +
          `৩. ভেটেরিনারি চিকিৎসকের পরামর্শ অনুযায়ী ওষুধ প্রয়োগ করুন।\n` +
          `${options.customNote ? `\n*পরিস্থিতির বিবরণ:* ${options.customNote}\n` : ''}` +
          `-------------------------------\n` +
          `জরুরি যোগাযোগের জন্য প্রস্তুত থাকুন।`
        );
      }

      return (
        `*🚨 [${farmName}] - URGENT BARN ALERT & BIOSECURITY NOTICE*\n` +
        `Date: ${dateStr}\n` +
        `${recipient ? `Recipient: *${recipient.name}*\n` : 'Recipient: All Barn Staff & Supervisors\n'}` +
        `-------------------------------\n` +
        `*Immediate Action Required:*\n` +
        `1. Immediately isolate the identified animal in the designated quarantine pen.\n` +
        `2. Disinfect the surrounding stall and sanitize watering troughs.\n` +
        `3. Do not mix feeding utensils with healthy cattle.\n` +
        `${options.customNote ? `\n*Urgent Details:* ${options.customNote}\n` : ''}` +
        `-------------------------------\n` +
        `Stand by for veterinary arrival and further instructions.`
      );
    }

    default:
      return `${farmName} - Farm Dispatch - ${dateStr}`;
  }
}

/**
 * Generate a WhatsApp deep-link URL
 */
export function getWhatsAppUrl(phone?: string, messageText: string = ''): string {
  const cleaned = formatPhoneNumberForMessaging(phone);
  const encodedText = encodeURIComponent(messageText);
  if (cleaned) {
    return `https://wa.me/${cleaned}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Generate an SMS deep-link URI
 */
export function getSmsUrl(phone?: string, messageText: string = ''): string {
  const cleaned = formatPhoneNumberForMessaging(phone);
  const encodedText = encodeURIComponent(messageText);
  return `sms:${cleaned}?body=${encodedText}`;
}
