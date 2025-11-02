# User Data Collection System - Crazeal

## Table of Contents
1. [Overview](#overview)
2. [Data Collection Flow](#data-collection-flow)
3. [Data Structure](#data-structure)
4. [Authentication Methods](#authentication-methods)
5. [Key Components](#key-components)
6. [Storage Architecture](#storage-architecture)
7. [API Endpoints](#api-endpoints)
8. [Security & Privacy](#security--privacy)

---

## Overview

Crazeal is a creative community platform that collects user profile data to connect artists, designers, and creative professionals worldwide. The system uses a multi-step onboarding process combined with optional profile editing to gather comprehensive user information.

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, Framer Motion
- **Authentication**: Firebase Authentication (Email/Password, Google OAuth)
- **Database**: Cloud Firestore (NoSQL)
- **Image Storage**: ImageKit
- **UI Components**: Material-UI, react-select, Lucide Icons

---

## Data Collection Flow

### 1. Entry Points

Users can enter the system through three primary paths:

#### **A. Home Page → Form Builder**
- **Path**: `/` → `/form`
- **Component**: `app/page.jsx` → `app/form/page.jsx`
- **Description**: New users click "Claim your spot" on the landing page

#### **B. Direct Registration**
- **Path**: `/auth/register`
- **Component**: `app/auth/register/page.jsx`
- **Description**: Traditional registration form with minimal required fields

#### **C. Login (Existing Users)**
- **Path**: `/auth/login`
- **Component**: `app/auth/login/page.jsx`
- **Description**: Returning users access their existing profiles

### 2. Multi-Step Profile Builder

The primary data collection happens through a 7-step profile builder form located at `/form`:

#### **Step 0: Basic Identity**
```javascript
{
  creativeName: String // User's display name
}
```
**Component**: `app/form/page.jsx` (lines 743-756)

#### **Step 1: Location**
```javascript
{
  location: String // Free-text city, country format
}
```
**Component**: `app/form/page.jsx` (lines 757-770)
- Uses free-text input for flexibility
- Example: "Berlin, Germany"

#### **Step 2: Creative Specializations & Hobbies**
```javascript
{
  specialization: Array<{value: String, label: String}>,
  hobbies: Array<{value: String, label: String}>
}
```
**Component**: `app/form/page.jsx` (lines 771-810)
- **Specializations** (Professional): 19 options including UI/UX, Photography, Animation, etc.
- **Hobbies** (Personal): 14 options including Reading, Gaming, Traveling, etc.
- Uses `react-select` multi-select component

#### **Step 3: Bio & Life Movie Title**
```javascript
{
  bio: String, // Creative story (multiline textarea)
  movieTitle: String // Fun "life as a movie" question
}
```
**Component**: `app/form/page.jsx` (lines 811-848)

#### **Step 4: Social Links (Optional)**
```javascript
{
  socialLinks: {
    linkedin: String,
    github: String,
    behance: String,
    instagram: String,
    portfolio: String
  }
}
```
**Component**: `app/form/page.jsx` (lines 849-933)
- All fields are optional
- Incremental add functionality with save/cancel options

#### **Step 5: Visual Identity**
```javascript
{
  avatar: String, // URL to profile picture (ImageKit)
  bannerImage: String, // URL to banner image (ImageKit)
  bannerColor: String // Hex color if no banner image
}
```
**Component**: `app/form/page.jsx` (lines 934-1018)
- Avatar: Circular profile picture
- Banner: 1200x400px recommended
- Color options: Glacier (#adcbed), Raspberry (#eb355b), Admiral (#1e3770), Mango (#f3ba37), Lagoon (#a9e0c9)

#### **Step 6: Preview & Completion**
**Component**: `app/form/page.jsx` (lines 1019-1161)
- Shows live preview of profile card
- No new data collected
- Final review before submission

### 3. Authentication Step

After completing the profile form, users must authenticate:

#### **Email/Password Signup**
```javascript
{
  name: String,
  email: String,
  password: String // min 6 characters
}
```
**Component**: `app/form/page.jsx` (lines 229-264)

#### **Google OAuth**
- Automatically retrieves name, email, and avatar from Google account
- **Component**: `app/form/page.jsx` (lines 266-301)

### 4. Profile Editing

After initial creation, users can edit their profiles:

**Path**: `/profile`
**Component**: `app/profile/page.jsx`

The edit modal has 4 tabs:
1. **Basic Info**: name, location, bio, movieTitle
2. **Professional**: specializations, hobbies
3. **Social Links**: all social media connections
4. **Appearance**: avatar, banner image/color

---

## Data Structure

### Complete User Profile Schema

```typescript
interface UserProfile {
  // Identity
  name: string;                      // Required
  email: string;                     // Required (from auth)
  avatar: string;                    // URL (ImageKit)
  
  // Location
  location: string;                  // Required
  
  // Professional Info
  creativeFields: Array<{            // Previously 'specialization'
    value: string;
    label: string;
  }>;
  specialization: Array<{            // Backward compatibility
    value: string;
    label: string;
  }>;
  
  // Personal
  hobbies: Array<{
    value: string;
    label: string;
  }>;
  bio: string;                       // Required
  movieTitle: string;                // Optional creative question
  
  // Visual
  bannerImage: string;               // URL (ImageKit)
  bannerColor: string;               // Hex color (default: '#adcbed')
  fontStyle: string;                 // Currently fixed to 'font-poppins'
  
  // Social Links (all optional)
  socialLinks: {
    linkedin: string;
    github: string;
    behance: string;
    instagram: string;
    portfolio: string;
  };
  
  // Metadata
  id: string;                        // Firebase UID
  createdAt: Date;
  updatedAt: Date;
}
```

### Field Validation Rules

| Field | Required | Min Length | Max Length | Format |
|-------|----------|------------|------------|--------|
| name | ✅ | 1 | - | String |
| email | ✅ | - | - | Valid email |
| password | ✅ | 6 | - | String |
| location | ✅ | 1 | - | String |
| bio | ✅ | 1 | - | String |
| specialization | ✅ | 1 item | - | Array |
| movieTitle | ⚠️ Recommended | - | - | String |
| All others | ❌ | - | - | - |

---

## Authentication Methods

### 1. Email/Password Authentication

**Implementation**: `firebase.js` (lines 29-34)

```javascript
// Registration
signupWithEmailPassword(email, password)
  → createUserWithEmailAndPassword(auth, email, password)
  → Returns UserCredential

// Login
loginWithEmailPassword(email, password)
  → signInWithEmailAndPassword(auth, email, password)
  → Returns UserCredential
```

### 2. Google OAuth

**Implementation**: `firebase.js` (lines 37-39)

```javascript
signInWithGoogle()
  → signInWithPopup(auth, googleProvider)
  → Returns UserCredential with:
     - displayName
     - email
     - photoURL
```

**Auto-population Flow**:
1. User clicks "Continue with Google"
2. Google popup authenticates
3. System checks for existing profile: `getUserProfile(user.uid)`
4. If no profile: Creates with Google data (name, email, avatar)
5. If profile exists: Logs in directly

### 3. Session Management

**Implementation**: `firebase.js` (lines 45-52)

```javascript
getCurrentUser()
  → Returns Promise<User | null>
  → Uses onAuthStateChanged listener
```

**Protection Flow**:
- Profile page checks authentication on mount
- If no user: Redirects to `/form`
- If user but no profile: Opens edit modal immediately
- If user with complete profile: Displays profile

---

## Key Components

### 1. FormSteps Component (`components/FormSteps.jsx`)

**Purpose**: Legacy multi-step form component (Note: Appears unused in current implementation)

**Steps**:
0. Creative name input
1. Country/city selection (uses `country-state-city` library)
2. Creative fields selection (8 options)
3. Experience level (Beginner/Intermediate/Advanced/Professional)
4. Biggest struggle (textarea)
5. Collaboration barriers (6 options)
6. Interest in platform (Yes/No)
7. Welcome screen

**Note**: This component seems to be from an earlier version and is not actively used in the current `/form` route.

### 2. Profile Builder (`app/form/page.jsx`)

**Lines**: 1-1262
**Key Features**:
- 7-step wizard with validation
- Progress bar tracking
- Real-time preview
- Authentication integration
- Image upload handling
- Profile data persistence

**State Management**:
```javascript
const [activeStep, setActiveStep] = useState(0);
const [profile, setProfile] = useState({...});
const [avatarPreview, setAvatarPreview] = useState(null);
const [userId, setUserId] = useState(null);
const [isAuthenticated, setIsAuthenticated] = useState(false);
```

### 3. Profile Page (`app/profile/page.jsx`)

**Lines**: 1-1264
**Key Features**:
- Profile display card
- Edit modal with tabbed interface
- Real-time save to Firestore
- Image upload to ImageKit
- "Meet other creators" section
- Profile link copying

**Edit Sections**:
1. Basic Info (name, location, bio, movieTitle)
2. Specialization (professional skills, hobbies)
3. Social Links (5 platforms)
4. Appearance (avatar, banner, colors)

### 4. Registration Page (`app/auth/register/page.jsx`)

**Lines**: 1-294
**Key Features**:
- Minimal registration form (name, email, password)
- Google OAuth integration
- Creates basic profile with defaults
- Redirects to `/creators` after success

**Default Profile Data**:
```javascript
{
  name,
  email,
  creativeFields: [],
  hobbies: [],
  bio: "",
  location: "",
  socialLinks: {...},
  bannerColor: '#adcbed',
  createdAt: new Date()
}
```

### 5. Creators Directory (`app/creators/page.jsx`)

**Lines**: 1-356
**Key Features**:
- Paginated creator list (9 per page)
- Real-time search (300ms debounce)
- Infinite scroll with Intersection Observer
- Search across: name, location, creative fields, hobbies, bio
- Filters out current user

---

## Storage Architecture

### 1. Cloud Firestore Structure

```
firestore
└── users (collection)
    └── {userId} (document)
        ├── name: string
        ├── email: string
        ├── avatar: string (ImageKit URL)
        ├── location: string
        ├── creativeFields: array
        ├── specialization: array
        ├── hobbies: array
        ├── bio: string
        ├── movieTitle: string
        ├── bannerImage: string (ImageKit URL)
        ├── bannerColor: string
        ├── socialLinks: map
        ├── createdAt: timestamp
        └── updatedAt: timestamp
```

**Key Operations**:

#### Create Profile
```javascript
createUserProfile(userId, profileData)
  → setDoc(doc(db, "users", userId), sanitizedData)
```
**Location**: `firebase.js` (lines 82-127)

#### Get Profile
```javascript
getUserProfile(userId)
  → getDoc(doc(db, "users", userId))
  → Returns profile data or null
```
**Location**: `firebase.js` (lines 129-138)

#### Update Profile
```javascript
updateUserProfile(userId, profileData)
  → updateDoc(doc(db, "users", userId), sanitizedData)
  → Adds updatedAt timestamp
```
**Location**: `firebase.js` (lines 140-159)

#### Get All Profiles
```javascript
getAllProfiles()
  → getDocs(collection(db, "users"))
  → Returns array of {id, ...data}
```
**Location**: `firebase.js` (lines 161-168)

#### Paginated Profiles (with Search)
```javascript
getPaginatedProfiles(limit, lastDoc, searchTerm)
  → Returns {profiles, lastVisible, hasMore}
  → Searches: name, location, fields, hobbies, bio
```
**Location**: `firebase.js` (lines 211-279)

### 2. ImageKit Storage

**Configuration**: `firebase.js` (lines 282-286)

```javascript
{
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
  authenticationEndpoint: '/api/imagekit/auth'
}
```

**Folder Structure**:
```
imagekit
├── avatars/
│   └── {userId}_avatar_{timestamp}.{ext}
└── banners/
    └── {userId}_banner_{timestamp}.{ext}
```

**Upload Flow**:

1. **Client requests auth parameters**
   ```
   GET /api/imagekit/auth
   → Returns {signature, expire, token}
   ```
   **Location**: `app/api/imagekit/auth/route.js` (lines 4-25)

2. **Client uploads to ImageKit**
   ```javascript
   uploadImage(userId, file, type)
     → Fetches auth params
     → Creates FormData with signature
     → POST to https://upload.imagekit.io/api/v1/files/upload
     → Returns image URL
     → Updates Firestore with URL
   ```
   **Location**: `firebase.js` (lines 289-338)

3. **URL stored in Firestore**
   - Avatar: `profile.avatar`
   - Banner: `profile.bannerImage`

---

## API Endpoints

### Internal API Routes

#### 1. ImageKit Authentication
- **Endpoint**: `/api/imagekit/auth`
- **Method**: GET
- **Purpose**: Generate secure upload credentials
- **Response**:
  ```json
  {
    "signature": "...",
    "expire": 1234567890,
    "token": "..."
  }
  ```
- **Implementation**: `app/api/imagekit/auth/route.js`

### Firebase Functions (Client-side SDK)

All Firestore operations use the Firebase JavaScript SDK directly from the client:

```javascript
// Authentication
auth.signInWithEmailAndPassword()
auth.createUserWithEmailAndPassword()
auth.signInWithPopup()
auth.signOut()

// Firestore
db.collection("users").doc(userId).set()
db.collection("users").doc(userId).get()
db.collection("users").doc(userId).update()
db.collection("users").getDocs()
```

---

## Security & Privacy

### 1. Data Sanitization

**Implementation**: `firebase.js` (lines 54-79)

```javascript
sanitizeForFirestore(data)
  → Removes undefined values
  → Handles null values
  → Recursively cleans nested objects
  → Prevents Firestore errors
```

### 2. Authentication Requirements

| Route | Auth Required | Redirect on Fail |
|-------|---------------|------------------|
| `/` | ❌ | - |
| `/form` | ❌ | - |
| `/auth/login` | ❌ | - |
| `/auth/register` | ❌ | - |
| `/profile` | ✅ | → `/form` |
| `/profile/[id]` | ❌ | - |
| `/creators` | ❌ | - |

### 3. Firestore Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Anyone can read public profiles
      allow read: if true;
      
      // Only authenticated users can create their own profile
      allow create: if request.auth != null 
                    && request.auth.uid == userId;
      
      // Only profile owners can update their own data
      allow update: if request.auth != null 
                    && request.auth.uid == userId;
      
      // Only profile owners can delete their profile
      allow delete: if request.auth != null 
                    && request.auth.uid == userId;
    }
  }
}
```

### 4. Environment Variables Required

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# ImageKit Configuration
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=
```

### 5. Data Privacy Considerations

**Personal Data Collected**:
- ✅ Name (public)
- ✅ Email (private, for authentication only)
- ✅ Location (public)
- ✅ Bio (public)
- ✅ Profile pictures (public)
- ✅ Social media links (public)
- ✅ Professional skills (public)
- ✅ Hobbies (public)

**Not Collected**:
- ❌ Phone numbers
- ❌ Physical addresses
- ❌ Payment information
- ❌ Analytics/tracking beyond Firebase
- ❌ Third-party cookies

**User Control**:
- Users can edit all information anytime
- Profile visibility is always public (by design - community platform)
- Email is never displayed publicly

---

## Data Flow Diagrams

### Complete User Registration Flow

```
┌─────────────────┐
│   Landing Page  │
│   (app/page.jsx)│
└────────┬────────┘
         │ Click "Claim your spot"
         ↓
┌─────────────────────────────────────────────────┐
│  Profile Builder (/form)                        │
│  (app/form/page.jsx)                            │
│                                                  │
│  Step 0: Name          → profile.name           │
│  Step 1: Location      → profile.location       │
│  Step 2: Fields        → profile.specialization │
│  Step 3: Bio           → profile.bio            │
│  Step 4: Social Links  → profile.socialLinks    │
│  Step 5: Images        → profile.avatar/banner  │
│  Step 6: Preview       → (no data)              │
└────────┬────────────────────────────────────────┘
         │ Click "Complete Profile"
         ↓
┌─────────────────────────────────────────────────┐
│  Authentication Step                            │
│                                                  │
│  Option A: Email/Password                       │
│    → signupWithEmailPassword()                  │
│    → createUserProfile()                        │
│                                                  │
│  Option B: Google OAuth                         │
│    → signInWithGoogle()                         │
│    → Auto-fill name, email, avatar              │
│    → createUserProfile()                        │
└────────┬────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────┐
│  Firestore Storage                              │
│  Collection: "users"                            │
│  Document: {userId}                             │
│    - All profile fields                         │
│    - createdAt timestamp                        │
└────────┬────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────┐
│  Redirect to Profile                            │
│  /profile (app/profile/page.jsx)                │
│    - Display profile card                       │
│    - Show "Meet other creators"                 │
└─────────────────────────────────────────────────┘
```

### Image Upload Flow

```
┌──────────────┐
│  User selects│
│   image file │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│  handleAvatarChange() or             │
│  handleBannerImageChange()           │
│  (app/form/page.jsx or profile)      │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  uploadImage(userId, file, type)     │
│  (firebase.js)                       │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Fetch auth params from              │
│  /api/imagekit/auth                  │
│                                       │
│  Returns: {signature, expire, token} │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  POST to ImageKit API                │
│  https://upload.imagekit.io/...      │
│                                       │
│  FormData:                           │
│    - file                            │
│    - publicKey                       │
│    - signature                       │
│    - expire                          │
│    - token                           │
│    - fileName                        │
│    - folder (avatars/ or banners/)   │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  ImageKit returns URL                │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  updateUserProfile(userId, {         │
│    avatar: url OR                    │
│    bannerImage: url                  │
│  })                                  │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Firestore updated                   │
│  Local state updated                 │
│  UI shows new image                  │
└──────────────────────────────────────┘
```

### Profile Edit Flow

```
┌──────────────┐
│ /profile     │
│ (logged in)  │
└──────┬───────┘
       │ Click "Edit Profile"
       ↓
┌──────────────────────────────────────┐
│  Edit Modal Opens                    │
│  (isEditing = true)                  │
│                                       │
│  Tabs:                               │
│  1. Basic Info                       │
│  2. Specialization                   │
│  3. Social Links                     │
│  4. Appearance                       │
└──────┬───────────────────────────────┘
       │ User makes changes
       │ (updates tempProfile state)
       ↓
┌──────────────────────────────────────┐
│  Click "Save Changes"                │
│  handleSaveProfile()                 │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Data Sanitization                   │
│  - Clean arrays                      │
│  - Sync specialization/creativeFields│
│  - Format social links               │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Check existing profile              │
│  getUserProfile(userId)              │
└──────┬───────────────────────────────┘
       │
       ├─ Exists → updateUserProfile()
       │
       └─ Not exists → createUserProfile()
       │
       ↓
┌──────────────────────────────────────┐
│  Firestore Updated                   │
│  updatedAt timestamp added           │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Local state updated                 │
│  setProfile(updatedProfile)          │
│  setTempProfile(updatedProfile)      │
│  setIsEditing(false)                 │
│                                       │
│  Show success animation (confetti)   │
└──────────────────────────────────────┘
```

---

## Summary

The Crazeal platform uses a comprehensive yet user-friendly data collection system:

1. **Flexible Entry**: Users can register minimally or go through a detailed profile builder
2. **Progressive Disclosure**: Data is collected step-by-step to avoid overwhelming users
3. **Optional Fields**: Only essential fields are required; users can add details later
4. **Visual Identity**: Strong emphasis on visual presentation (avatar, banner)
5. **Real-time Updates**: All changes sync immediately to Firestore
6. **Search & Discovery**: Collected data enables powerful creator discovery features
7. **Privacy-Conscious**: Minimal personal data, user control over all information

The system balances between gathering useful information for community building while respecting user privacy and reducing friction in the onboarding process.