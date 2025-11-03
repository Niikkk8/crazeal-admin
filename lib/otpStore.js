// OTP Store using Firestore for production persistence
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const OTP_COLLECTION = 'admin_otp_sessions';

export const otpStore = {
  async set(email, data) {
    try {
      await setDoc(doc(db, OTP_COLLECTION, email), {
        otp: data.otp,
        expiresAt: data.expiresAt,
        attempts: data.attempts || 0,
        createdAt: Date.now()
      });
      console.log(`OTP stored in Firestore for ${email}`);
      return true;
    } catch (error) {
      console.error('Error storing OTP:', error);
      return false;
    }
  },

  async get(email) {
    try {
      const docRef = doc(db, OTP_COLLECTION, email);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if expired
        if (Date.now() > data.expiresAt) {
          await this.delete(email);
          return null;
        }
        
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error getting OTP:', error);
      return null;
    }
  },

  async delete(email) {
    try {
      await deleteDoc(doc(db, OTP_COLLECTION, email));
      console.log(`OTP deleted from Firestore for ${email}`);
      return true;
    } catch (error) {
      console.error('Error deleting OTP:', error);
      return false;
    }
  },

  async update(email, data) {
    try {
      const current = await this.get(email);
      if (!current) return false;
      
      await setDoc(doc(db, OTP_COLLECTION, email), {
        ...current,
        ...data
      });
      return true;
    } catch (error) {
      console.error('Error updating OTP:', error);
      return false;
    }
  }
};

// Clean up expired OTPs periodically (only in development)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(async () => {
    console.log('Running OTP cleanup...');
    // This is just for development - in production, use Firebase TTL or Cloud Functions
  }, 10 * 60 * 1000); // Every 10 minutes
}
