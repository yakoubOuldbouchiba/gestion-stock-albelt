# Client Management System - Quick Start Guide

## 🚀 Getting Started

### Accessing the Client Management Module

1. **Login** to the ALBEL application with Admin credentials
2. **Navigate** to **Configuration** section in the sidebar
3. **Click** on **Clients** menu item (new icon: Contact)

---

## 📋 Main Operations

### 1. Creating a New Client

**Step-by-Step:**

1. Click **"+ Add Client"** button
2. Fill in **Client Name** (required)
3. Add **Description** (optional)
4. Click **"Add"** for Phone Numbers:
   - Enter phone number
   - Select phone type (Mobile/Landline/Other)
   - Check "Main Phone" if this is primary contact
   - Click **Add** button
5. Add **Email Addresses**:
   - Enter email address
   - Select email type (Business/Personal/Other)
   - Check "Main Email" if this is primary contact
   - Click **Add** button
6. Add **Addresses**:
   - Enter street address
   - Enter city, postal code (optional)
   - Select country (default: DZ)
   - Select address type (Business/Billing/Shipping/Other)
   - Check "Main Address" if primary
   - Click **Add** button
7. Add **Representatives** (optional):
   - Enter representative name
   - Enter position/title (optional)
   - Enter phone number (optional)
   - Enter email address (optional)
   - Check "Primary" if main contact
   - Click **Add** button
8. Click **"Create Client"** to save

### 2. Viewing Client Details

1. **Browse** the clients list
2. **Hover** over a client card to see:
   - Client name
   - Primary phone number (📞)
   - Primary email address (📧)
   - Edit and Delete buttons
3. **Click** the down arrow (▼) button to expand and see:
   - All phone numbers
   - All email addresses
   - All addresses
   - All representatives with their details

### 3. Editing a Client

1. **Click** the **Edit** button (pencil icon) on desired client
2. **Modify** any information:
   - Basic info (name, description, status)
   - Phone numbers (add, edit, remove)
   - Email addresses (add, edit, remove)
   - Addresses (add, edit, remove)
   - Representatives (add, edit, remove)
3. Click **"Update Client"** to save changes

### 4. Searching Clients

1. **Use** the search box at the top
2. **Type** client name (searches as you type)
3. **View** filtered results
4. **Clear** search to see all clients again

### 5. Deactivating a Client

1. **Click** the **Delete** button (trash icon)
2. **Confirm** in the popup dialog
3. Client is **marked as inactive** but data is preserved
4. Inactive clients won't appear in the list by default

### 6. Data Structure

```
Client
├── Name (required)
├── Description (optional)
├── Status (Active/Inactive)
├── Phone Numbers (0 or more)
│   ├── Phone Number
│   ├── Type (Mobile/Landline/Other)
│   └── Is Main? (Yes/No)
├── Email Addresses (0 or more)
│   ├── Email Address
│   ├── Type (Business/Personal/Other)
│   └── Is Main? (Yes/No)
├── Addresses (0 or more)
│   ├── Street Address
│   ├── City
│   ├── Postal Code
│   ├── Country (default: DZ)
│   ├── Type (Business/Billing/Shipping/Other)
│   └── Is Main? (Yes/No)
└── Representatives (0 or more)
    ├── Name (required)
    ├── Position
    ├── Phone
    ├── Email
    └── Is Primary? (Yes/No)
```

---

## 🔍 Tips & Tricks

### Mark as "Main"
- You can mark **multiple** phone numbers as "Main"
- You can mark **multiple** emails as "Main"
- You can mark **multiple** addresses as "Main"
- This helps identify primary contact methods

### Best Practices
1. Always fill in at least **one main phone** and **one main email**
2. Set a **main address** for shipping/billing purposes
3. Mark **one representative as primary** contact person
4. Use **descriptive notes** for any special information

### Search Tips
- Search works with **partial names** (e.g., "ABC Company" can be found by typing "ABC" or "Company")
- Search is **case-insensitive**
- Search results update in **real-time** as you type

### Navigation
- The Clients menu appears only for **Admin users**
- Operator and Read-only users **cannot** access this section
- All operations are **logged** for audit purposes

---

## 📱 Mobile Usage

The Client Management page is **fully responsive**:
- ✅ Works on phones, tablets, and desktops
- ✅ Touch-friendly buttons and inputs
- ✅ Optimized form layouts for small screens
- ✅ Collapsible sections to save space

---

## ⚙️ API Integration

### For Developers

The Client Service is integrated with the REST API:

**Base URL**: `http://your-server:8080/api/clients`

### Common API Calls

```javascript
// Get all clients
GET /api/clients

// Get specific client
GET /api/clients/{id}

// Create client
POST /api/clients
Body: { name, description, phones[], emails[], addresses[], representatives[] }

// Update client
PUT /api/clients/{id}
Body: { name, description, isActive, phones[], ... }

// Search by name
GET /api/clients/search/name?name=pattern

// Get only active clients
GET /api/clients/active

// Add phone to client
POST /api/clients/{id}/phones
Body: { phoneNumber, isMain, phoneType, notes }

// Add email to client
POST /api/clients/{id}/emails
Body: { emailAddress, isMain, emailType, notes }

// Add address to client
POST /api/clients/{id}/addresses
Body: { streetAddress, city, postalCode, country, isMain, addressType }

// Add representative to client
POST /api/clients/{id}/representatives
Body: { name, position, phone, email, isPrimary }
```

---

## 🐛 Troubleshooting

### Problem: "Client not found"
**Solution**: Ensure the client ID is correct and client hasn't been deleted

### Problem: "Email format invalid"
**Solution**: Check email format - must be valid email (e.g., name@domain.com)

### Problem: Can't see Clients menu
**Solution**: You need Admin role. Login with Admin account

### Problem: Search not working
**Solution**: Clear cache (Ctrl+F5 or Cmd+Shift+R) and try again

### Problem: Changes not saved
**Solution**: Check internet connection and look for error messages at top of page

---

## 📞 Support

For issues or questions:
1. Check error messages displayed
2. Review the implementation documentation
3. Contact your system administrator
4. Check application logs for detailed error information

---

## 🎓 Examples

### Example 1: Company with Multiple Locations

```
Client Name: ACME Corporation
Main Phone: +213 21 123 4567
Main Email: info@acme.com

Locations:
1. Head Office (Main)
   - Address: 123 Business Street, Algiers
2. Branch Office
   - Address: 456 Commerce Road, Oran

Key Contact (Primary):
- Name: Ahmed Mostafa
- Position: Sales Director
- Phone: +213 555 1234
- Email: ahmed@acme.com
```

### Example 2: Supplier with Multiple Contacts

```
Client Name: XYZ Manufacturer
Main Phone: +213 98 765 4321
Main Email: sales@xyz.com

Phone Numbers:
1. +213 98 765 4321 (Mobile) - Main
2. +213 21 555 0000 (Landline)

Representatives:
1. Hassan Ali (Sales Manager) - Primary
   - Phone: +213 555 2222
2. Fatima Djamel (Operations Manager)
   - Phone: +213 555 3333
```

---

## ✅ Checklist Before Going Live

- ✅ Test creating a client with all fields
- ✅ Test editing client information
- ✅ Test searching for clients
- ✅ Test adding/removing phone numbers
- ✅ Test adding/removing emails
- ✅ Test adding/removing addresses
- ✅ Test adding/removing representatives
- ✅ Test deactivating a client
- ✅ Test on mobile device
- ✅ Verify all data is saved correctly

---

**Last Updated**: March 27, 2026  
**Version**: 1.0  
**Status**: ✅ Ready for Production
