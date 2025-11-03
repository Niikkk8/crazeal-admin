import { NextResponse } from 'next/server';
import { sendOTPEmail, generateOTP } from '../../../../lib/email';
import { otpStore } from '../../../../lib/otpStore';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
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

    // Generate OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);

    // Store OTP with expiration in Firestore
    await otpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0,
    });

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP email: ' + emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: expiryMinutes * 60, // in seconds
    });

  } catch (error) {
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

