// Shared OTP store for both send-otp and verify-otp routes
// In production, replace this with Redis or Firebase

// Use global to ensure the store persists across hot reloads in development
if (typeof global.otpStore === 'undefined') {
  global.otpStore = new Map();
  
  // Clean up expired OTPs every 5 minutes
  if (typeof window === 'undefined') {
    setInterval(() => {
      const now = Date.now();
      for (const [email, data] of global.otpStore.entries()) {
        if (data.expiresAt < now) {
          global.otpStore.delete(email);
          console.log(`Cleaned up expired OTP for ${email}`);
        }
      }
    }, 5 * 60 * 1000);
  }
}

export const otpStore = global.otpStore;