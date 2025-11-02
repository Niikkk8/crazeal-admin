// Firebase configuration and initialization for Admin Dashboard
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Data sanitization helper
const sanitizeForFirestore = (data) => {
  const sanitized = {};
  for (const key in data) {
    if (data[key] !== undefined) {
      if (data[key] === null) {
        sanitized[key] = null;
      } else if (Array.isArray(data[key])) {
        sanitized[key] = data[key].filter(item => item !== undefined);
      } else if (typeof data[key] === 'object' && data[key] !== null && !(data[key] instanceof Date)) {
        sanitized[key] = sanitizeForFirestore(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }
  }
  return sanitized;
};

// ============================================
// AUTHENTICATION FUNCTIONS (Admin Only)
// ============================================

export const loginWithEmailPassword = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logout = async () => {
  return await signOut(auth);
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// ============================================
// USER PROFILE FUNCTIONS (Read/Update/Delete Only)
// ============================================

export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const sanitizedData = sanitizeForFirestore({
      ...profileData,
      updatedAt: new Date(),
    });
    
    await updateDoc(doc(db, "users", userId), sanitizedData);
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: error.message };
  }
};

export const deleteUserProfile = async (userId) => {
  try {
    await deleteDoc(doc(db, "users", userId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting user profile:", error);
    return { success: false, error: error.message };
  }
};

export const getAllProfiles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const profiles = [];
    querySnapshot.forEach((doc) => {
      profiles.push({ id: doc.id, ...doc.data() });
    });
    return profiles;
  } catch (error) {
    console.error("Error getting all profiles:", error);
    return [];
  }
};

// ============================================
// ADMIN ANALYTICS FUNCTIONS
// ============================================

export const getAnalyticsData = async () => {
  try {
    const profiles = await getAllProfiles();
    
    // Calculate analytics
    const totalUsers = profiles.length;
    
    // Users by creative fields
    const creativeFieldsMap = {};
    const hobbiesMap = {};
    const locationMap = {};
    const signupsByMonth = {};
    
    profiles.forEach(profile => {
      // Creative fields analysis
      const fields = profile.creativeFields || profile.specialization || [];
      fields.forEach(field => {
        const fieldName = field.label || field.value || field;
        if (fieldName) {
          creativeFieldsMap[fieldName] = (creativeFieldsMap[fieldName] || 0) + 1;
        }
      });
      
      // Hobbies analysis
      const userHobbies = profile.hobbies || [];
      userHobbies.forEach(hobby => {
        const hobbyName = hobby.label || hobby.value || hobby;
        if (hobbyName) {
          hobbiesMap[hobbyName] = (hobbiesMap[hobbyName] || 0) + 1;
        }
      });
      
      // Location analysis
      if (profile.location) {
        locationMap[profile.location] = (locationMap[profile.location] || 0) + 1;
      }
      
      // Signups by month
      if (profile.createdAt) {
        const date = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        signupsByMonth[monthYear] = (signupsByMonth[monthYear] || 0) + 1;
      }
    });
    
    // Convert maps to arrays for charts
    const creativeFieldsData = Object.entries(creativeFieldsMap)
      .map(([name, count]) => ({ name, count, percentage: ((count / totalUsers) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);
    
    const hobbiesData = Object.entries(hobbiesMap)
      .map(([name, count]) => ({ name, count, percentage: ((count / totalUsers) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);
    
    const locationData = Object.entries(locationMap)
      .map(([name, count]) => ({ name, count, percentage: ((count / totalUsers) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 locations
    
    const signupsOverTime = Object.entries(signupsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    // Recent users
    const recentUsers = profiles
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 10);
    
    // Users with/without profiles
    const usersWithCompleteProfiles = profiles.filter(p => 
      p.bio && p.location && (p.creativeFields?.length > 0 || p.specialization?.length > 0)
    ).length;
    
    const usersWithSocialLinks = profiles.filter(p => {
      const links = p.socialLinks || {};
      return Object.values(links).some(link => link && link.trim() !== '');
    }).length;
    
    return {
      totalUsers,
      usersWithCompleteProfiles,
      usersWithSocialLinks,
      profileCompletionRate: ((usersWithCompleteProfiles / totalUsers) * 100).toFixed(1),
      creativeFieldsData,
      hobbiesData,
      locationData,
      signupsOverTime,
      recentUsers,
    };
  } catch (error) {
    console.error("Error getting analytics data:", error);
    return null;
  }
};

export const searchUsers = async (searchTerm, filters = {}) => {
  try {
    let profiles = await getAllProfiles();
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      profiles = profiles.filter(profile => {
        const name = (profile.name || '').toLowerCase();
        const email = (profile.email || '').toLowerCase();
        const location = (profile.location || '').toLowerCase();
        const bio = (profile.bio || '').toLowerCase();
        
        const fields = (profile.creativeFields || profile.specialization || [])
          .map(f => (f.label || f.value || f).toLowerCase())
          .join(' ');
        
        const hobbies = (profile.hobbies || [])
          .map(h => (h.label || h.value || h).toLowerCase())
          .join(' ');
        
        return name.includes(term) || 
               email.includes(term) || 
               location.includes(term) || 
               bio.includes(term) || 
               fields.includes(term) || 
               hobbies.includes(term);
      });
    }
    
    // Apply creative field filter
    if (filters.creativeField) {
      profiles = profiles.filter(profile => {
        const fields = profile.creativeFields || profile.specialization || [];
        return fields.some(f => {
          const fieldName = f.label || f.value || f;
          return fieldName === filters.creativeField;
        });
      });
    }
    
    // Apply location filter
    if (filters.location) {
      profiles = profiles.filter(profile => 
        profile.location === filters.location
      );
    }
    
    // Apply date range filter
    if (filters.dateFrom) {
      profiles = profiles.filter(profile => {
        if (!profile.createdAt) return false;
        const date = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
        return date >= new Date(filters.dateFrom);
      });
    }
    
    if (filters.dateTo) {
      profiles = profiles.filter(profile => {
        if (!profile.createdAt) return false;
        const date = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
        return date <= new Date(filters.dateTo);
      });
    }
    
    // Apply sorting
    if (filters.sortBy) {
      profiles.sort((a, b) => {
        const direction = filters.sortOrder === 'desc' ? -1 : 1;
        
        if (filters.sortBy === 'name') {
          return direction * (a.name || '').localeCompare(b.name || '');
        } else if (filters.sortBy === 'email') {
          return direction * (a.email || '').localeCompare(b.email || '');
        } else if (filters.sortBy === 'location') {
          return direction * (a.location || '').localeCompare(b.location || '');
        } else if (filters.sortBy === 'createdAt') {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return direction * (dateA - dateB);
        }
        return 0;
      });
    }
    
    return profiles;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};

export { auth, db };

