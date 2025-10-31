# Calendar Settings Guide

## Overview
The Calendar Settings page allows users to manage their Cal.com integration and customize how the appointments calendar is displayed.

## Features

### 1. **Cal.com Integration**
- Direct link to [Cal.com Bookings](https://app.cal.com/bookings/upcoming)
- Opens in a new tab for easy access to manage:
  - Upcoming bookings
  - Availability settings
  - Calendar integrations
  - Event types

### 2. **Calendar Display Hours**
Users can customize the visible time range on their Appointments page calendar.

**Settings:**
- **Start Hour**: The earliest hour displayed on the calendar (0-23)
- **End Hour**: The latest hour displayed on the calendar (1-24)

**Default Settings:**
- Start: 8 AM
- End: 8 PM

**Examples:**
- **Early bird**: 6 AM - 6 PM
- **Standard business**: 9 AM - 5 PM
- **Late night**: 10 AM - 10 PM
- **24-hour view**: 12 AM - 11 PM

## How It Works

### Database Schema
```sql
CREATE TABLE calendar_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  start_hour INTEGER DEFAULT 7,
  end_hour INTEGER DEFAULT 21,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### API Endpoints

**GET** `/api/calendar-settings/get`
- Fetches user's calendar settings
- Returns default values (8 AM - 8 PM) if none exist

**POST** `/api/calendar-settings/update`
- Updates user's calendar settings
- Validates hour range (end > start, 0-24 range)
- Upserts settings (creates or updates)

### Calendar Integration

1. **Appointments Page** fetches calendar settings on load
2. Settings are passed to **AppointmentCalendar** component
3. Calendar dynamically generates hour slots based on settings
4. Changes take effect immediately after saving

## User Flow

1. Navigate to **Settings → Calendar**
2. View current calendar display hours
3. Adjust **Start Hour** and **End Hour** dropdowns
4. See live preview of time range
5. Click **Save Calendar Hours**
6. Visit **Appointments** page to see updated calendar view

## Benefits

- ✅ **Personalized View**: Focus on your actual working hours
- ✅ **Reduced Clutter**: Hide irrelevant time slots
- ✅ **Better UX**: Easier to scan and manage appointments
- ✅ **Flexible**: Change settings anytime to match schedule

## Technical Notes

- Settings are per-user (stored in database)
- Changes persist across sessions
- Calendar automatically updates on page load
- No need to refresh after saving settings
- Validation ensures end hour > start hour
- Hours displayed in 12-hour format (AM/PM) for readability

## Navigation

Access Calendar Settings:
- **Dashboard → Settings → Calendar**
- Or directly at `/dashboard/settings/calendar`

Access Cal.com Bookings:
- Click **"Open Cal.com Bookings"** button
- External link: https://app.cal.com/bookings/upcoming

