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
}

export const salespeople: Record<string, SalespersonConfig> = {
  labron: {
    slug: 'labron',
    name: 'LaBron',
    title: 'Senior Sales Consultant',
    description: 'Schedule a free consultation with LaBron to learn how Sterling AI can transform your insurance business.',
    image: undefined, // Add image path like '/images/team/labron.jpg'
    calEventTypeId: undefined, // Add Cal.com event type ID when available
    calApiKey: undefined, // Add Cal.com API key when available (or use process.env.LABRON_CAL_API_KEY)
    isActive: false, // Set to true once Cal.com is configured
    // Custom time slots for LaBron (optional - if undefined, uses default 12-5pm)
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

