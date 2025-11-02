import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Crazeal Admin <noreply@crazeal.com>',
      to: email,
      subject: 'Your Crazeal Admin Login OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #000000;
              color: #ffffff;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #ffffff;
              margin-bottom: 10px;
            }
            .content {
              background-color: #18181b;
              border: 1px solid #3f3f46;
              border-radius: 12px;
              padding: 40px;
              text-align: center;
            }
            .otp-box {
              background-color: #27272a;
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #3b82f6;
              font-family: 'Courier New', monospace;
            }
            .message {
              color: #a1a1aa;
              font-size: 14px;
              line-height: 1.6;
              margin: 20px 0;
            }
            .warning {
              color: #f59e0b;
              font-size: 12px;
              margin-top: 30px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              color: #71717a;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Crazeal Admin</div>
            </div>
            <div class="content">
              <h1 style="color: #ffffff; margin-top: 0;">Admin Login Verification</h1>
              <p class="message">
                You've requested to log in to the Crazeal Admin Dashboard. 
                Use the following OTP to complete your login:
              </p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p class="message">
                This OTP will expire in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.
              </p>
              <p class="warning">
                ⚠️ If you didn't request this OTP, please ignore this email and secure your account.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated message from Crazeal Admin Dashboard.</p>
              <p>© ${new Date().getFullYear()} Crazeal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Crazeal Admin Login Verification
        
        Your OTP: ${otp}
        
        This OTP will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.
        
        If you didn't request this OTP, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

