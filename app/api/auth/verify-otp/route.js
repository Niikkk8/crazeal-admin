import { NextResponse } from 'next/server';
import { otpStore } from '../../../../lib/otpStore';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Check if email is in the allowed admin list
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    
    if (!adminEmails.includes(email)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: This email is not authorized for admin access' },
        { status: 403 }
      );
    }

    // Get stored OTP data from Firestore
    const storedData = await otpStore.get(email);

    if (!storedData) {
      return NextResponse.json(
        { success: false, error: 'OTP not found or expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if OTP has expired (redundant but safe)
    if (Date.now() > storedData.expiresAt) {
      await otpStore.delete(email);
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check attempt limit (max 5 attempts)
    if (storedData.attempts >= 5) {
      await otpStore.delete(email);
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      await otpStore.update(email, { attempts: storedData.attempts + 1 });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid OTP. Please try again.',
          attemptsRemaining: 5 - (storedData.attempts + 1)
        },
        { status: 400 }
      );
    }

    // OTP is valid - delete it and create session
    await otpStore.delete(email);

    // Generate a simple session token (in production, use JWT or proper session management)
    const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    console.log(`OTP verified successfully for ${email}`);

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      email,
      sessionToken,
    });

  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

