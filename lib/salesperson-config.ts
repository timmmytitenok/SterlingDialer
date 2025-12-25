// Salesperson Configuration
// Add new salespeople here with their Cal.com event details

export interface SalespersonConfig {
  slug: string;
  name: string;
  title: string;
  description: string;
  image?: string; // Optional profile image
  calEventTypeId?: string; // Cal.com event type ID (add when available)
  calApiKey?: string; // Cal.com API key (add when available, or use env variable)
  isActive: boolean; // Set to true when Cal.com is configured
  timeSlots?: { display: string; hour: number; minute: number }[]; // Custom time slots
  timezone: string; // Salesperson's timezone (e.g., 'America/New_York', 'America/Los_Angeles')
}

export const salespeople: Record<string, SalespersonConfig> = {
  wardy: {
    slug: 'wardy',
    name: 'Wardy',
    title: 'Senior Sales Consultant',
    description: 'Schedule a free consultation with Wardy to learn how Sterling AI can transform your insurance business.',
    image: '/team/wardy.png',
    calEventTypeId: '4241182',
    calApiKey: process.env.WARDY_CAL_API_KEY || 'cal_live_b1a3def14790850edca137de6660e62f', // Fallback for local dev
    isActive: true,
    timezone: 'America/Los_Angeles', // PST - Wardy is in California
    // Custom time slots (optional - if undefined, uses default 12-5pm)
    timeSlots: undefined,
  },
  
  // Example: Add more salespeople
  // john: {
  //   slug: 'john',
  //   name: 'John Smith',
  //   title: 'Account Executive',
  //   description: 'Book a call with John to discuss your insurance needs.',
  //   calEventTypeId: '1234567',
  //   calApiKey: process.env.JOHN_CAL_API_KEY,
  //   isActive: true,
  // },
};

// Default time slots (12 PM to 5 PM)
export const DEFAULT_TIME_SLOTS = [
  { display: '12:00 PM', hour: 12, minute: 0 },
  { display: '12:30 PM', hour: 12, minute: 30 },
  { display: '1:00 PM', hour: 13, minute: 0 },
  { display: '1:30 PM', hour: 13, minute: 30 },
  { display: '2:00 PM', hour: 14, minute: 0 },
  { display: '2:30 PM', hour: 14, minute: 30 },
  { display: '3:00 PM', hour: 15, minute: 0 },
  { display: '3:30 PM', hour: 15, minute: 30 },
  { display: '4:00 PM', hour: 16, minute: 0 },
  { display: '4:30 PM', hour: 16, minute: 30 },
  { display: '5:00 PM', hour: 17, minute: 0 },
];

export function getSalesperson(slug: string): SalespersonConfig | undefined {
  return salespeople[slug.toLowerCase()];
}

export function getAllSalespeople(): SalespersonConfig[] {
  return Object.values(salespeople);
}

