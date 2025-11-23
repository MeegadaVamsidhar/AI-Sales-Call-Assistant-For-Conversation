import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function canSendEmail() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Creative email template utilities
function getEmailHeader(title: string, subtitle?: string) {
  return `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
      <div style="background: rgba(255,255,255,0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 40px; color: white;">✨</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${title}</h1>
      ${subtitle ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">${subtitle}</p>` : ''}
    </div>
  `;
}

function getEmailFooter() {
  return `
    <div style="background: #f8f9fa; padding: 30px 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 1px solid #e9ecef;">
      <div style="margin-bottom: 20px;">
        <span style="display: inline-block; width: 40px; height: 2px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 0 10px;"></span>
        <span style="color: #6c757d; font-size: 14px;">Made with ❤️</span>
        <span style="display: inline-block; width: 40px; height: 2px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 0 10px;"></span>
      </div>
      <p style="color: #6c757d; font-size: 12px; margin: 0;">
        This email was sent to you because you have an account with us.<br>
        If you have any questions, feel free to contact our support team.
      </p>
    </div>
  `;
}

function getCreativeButton(text: string, url: string, color: string = '#667eea') {
  return `
    <div style="text-align: center; margin: 40px 0;">
      <a href="${url}" 
         style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 50px; 
                display: inline-block; 
                font-weight: 600; 
                font-size: 16px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;">
        ${text}
      </a>
    </div>
  `;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: '🎉 Welcome! Please verify your email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          ${getEmailHeader('Welcome Aboard! 🚀', "Let's get you started")}
          
          <div style="padding: 40px 30px; text-align: center;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 50%; width: 120px; height: 120px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 60px;">📧</span>
            </div>
            
            <h2 style="color: #2c3e50; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Almost there!</h2>
            <p style="color: #5a6c7d; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
              Thank you for joining our amazing community! 🎊<br>
              To complete your registration and unlock all features, please verify your email address.
            </p>
            
            ${getCreativeButton('✨ Verify My Email ✨', verificationUrl, '#667eea')}
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                <strong>💡 Pro tip:</strong> If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="word-break: break-all; color: #667eea; font-size: 12px; margin: 10px 0 0; font-family: monospace;">
                ${verificationUrl}
              </p>
            </div>
            
            <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #8b4513; font-size: 14px;">
                ⏰ <strong>Time-sensitive:</strong> This verification link expires in 24 hours for your security.
              </p>
            </div>
            
            <p style="color: #95a5a6; font-size: 14px; margin: 30px 0 0;">
              Didn't create an account? No worries! You can safely ignore this email.
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
    text: `
      🎉 Welcome to Our Platform!
      
      Thank you for signing up! To complete your registration and unlock all features, please verify your email address by visiting this link:
      
      ${verificationUrl}
      
      ⏰ This link will expire in 24 hours for your security.
      
      If you didn't create an account, you can safely ignore this email.
      
      Best regards,
      The Team
    `,
  };

  try {
    if (!canSendEmail()) {
      console.warn('SMTP not configured. Skipping email send. Verification URL:', verificationUrl);
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', email);
  } catch (error) {
    console.warn('Failed to send verification email. Printing link instead:', verificationUrl);
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: '🔐 Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          ${getEmailHeader('Password Reset 🔐', "Let's secure your account")}
          
          <div style="padding: 40px 30px; text-align: center;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); border-radius: 50%; width: 120px; height: 120px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 60px;">🔑</span>
            </div>
            
            <h2 style="color: #2c3e50; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
            <p style="color: #5a6c7d; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
              We received a request to reset your password. No worries, it happens to the best of us! 😊<br>
              Click the button below to create a new, secure password.
            </p>
            
            ${getCreativeButton('🔐 Reset My Password', resetUrl, '#ff6b6b')}
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for your protection.
              </p>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                <strong>💡 Alternative:</strong> If the button doesn't work, copy and paste this link:
              </p>
              <p style="word-break: break-all; color: #ff6b6b; font-size: 12px; margin: 10px 0 0; font-family: monospace;">
                ${resetUrl}
              </p>
            </div>
            
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #1565c0; font-size: 14px;">
                <strong>🛡️ Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your account remains secure.
              </p>
            </div>
            
            <p style="color: #95a5a6; font-size: 14px; margin: 30px 0 0;">
              Need help? Contact our support team anytime!
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
    text: `
      🔐 Password Reset Request
      
      We received a request to reset your password. Click the link below to create a new, secure password:
      
      ${resetUrl}
      
      ⚠️ This link will expire in 1 hour for your security.
      
      If you didn't request a password reset, please ignore this email. Your account remains secure.
      
      Need help? Contact our support team anytime!
      
      Best regards,
      The Team
    `,
  };

  try {
    if (!canSendEmail()) {
      console.warn('SMTP not configured. Skipping email send. Reset URL:', resetUrl);
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.warn('Failed to send password reset email. Printing link instead:', resetUrl);
  }
}

export async function sendWelcomeEmail(email: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "🎉 Welcome! You're all set up!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome!</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          ${getEmailHeader('Welcome to the Family! 🎊', "You're officially part of our community")}
          
          <div style="padding: 40px 30px; text-align: center;">
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 50%; width: 120px; height: 120px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 60px;">🎉</span>
            </div>
            
            <h2 style="color: #2c3e50; margin: 0 0 20px; font-size: 28px; font-weight: 600;">You're All Set!</h2>
            <p style="color: #5a6c7d; font-size: 18px; line-height: 1.6; margin: 0 0 30px;">
              Congratulations! 🎊 Your email has been successfully verified and you now have full access to all our amazing features.
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; padding: 30px; margin: 30px 0; color: white;">
              <h3 style="margin: 0 0 15px; font-size: 20px;">🚀 What's Next?</h3>
              <div style="text-align: left; max-width: 300px; margin: 0 auto;">
                <p style="margin: 10px 0; font-size: 16px;">✨ Explore all features</p>
                <p style="margin: 10px 0; font-size: 16px;">🎯 Complete your profile</p>
                <p style="margin: 10px 0; font-size: 16px;">👥 Connect with AI</p>
                <p style="margin: 10px 0; font-size: 16px;">🎨 Customize your experience</p>
              </div>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #4facfe;">
              <h4 style="color: #2c3e50; margin: 0 0 15px; font-size: 18px;">💡 Pro Tips to Get Started:</h4>
              <ul style="text-align: left; color: #5a6c7d; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Complete your profile to get personalized recommendations</li>
                <li>Check out our getting started guide in the dashboard</li>
                <li>Join our community discussions to connect with other users</li>
                <li>Follow us on social media for updates and tips</li>
              </ul>
            </div>
            
            <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #8b4513; font-size: 16px; font-weight: 600;">
                🎁 Special Welcome Bonus: You now have access to premium features for 30 days!
              </p>
            </div>
            
            <div style="margin: 40px 0;">
              <p style="color: #5a6c7d; font-size: 16px; margin: 0 0 20px;">
                Questions? We're here to help! 💬
              </p>
              <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                <a href="#" style="color: #667eea; text-decoration: none; font-size: 14px;">📚 Help Center</a>
                <a href="#" style="color: #667eea; text-decoration: none; font-size: 14px;">💬 Live Chat</a>
                <a href="#" style="color: #667eea; text-decoration: none; font-size: 14px;">📧 Email Support</a>
              </div>
            </div>
            
            <p style="color: #95a5a6; font-size: 14px; margin: 30px 0 0;">
              Thank you for choosing us. We're excited to have you on board! 🚀
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
    text: `
      🎉 Welcome to Our Platform!
      
      Congratulations! Your email has been successfully verified and you now have full access to all our amazing features.
      
      🚀 What's Next?
      ✨ Explore all features
      🎯 Complete your profile
      👥 Connect with AI
      🎨 Customize your experience
      
      💡 Pro Tips to Get Started:
      • Complete your profile to get personalized recommendations
      • Check out our getting started guide in the dashboard
      • Join our community discussions to connect with other users
      • Follow us on social media for updates and tips
      
      🎁 Special Welcome Bonus: You now have access to premium features for 30 days!
      
      Questions? We're here to help! 💬
      📚 Help Center | 💬 Live Chat | 📧 Email Support
      
      Thank you for choosing us. We're excited to have you on board! 🚀
      
      Best regards,
      The Team
    `,
  };

  try {
    if (!canSendEmail()) {
      console.warn('SMTP not configured. Skipping welcome email send.');
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', email);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw error for welcome email as it's not critical
  }
}

export async function sendNotificationEmail(
  email: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `🔔 ${title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          ${getEmailHeader(title, 'Important update for you')}
          
          <div style="padding: 40px 30px; text-align: center;">
            <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius: 50%; width: 120px; height: 120px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 60px;">🔔</span>
            </div>
            
            <h2 style="color: #2c3e50; margin: 0 0 20px; font-size: 24px; font-weight: 600;">${title}</h2>
            <p style="color: #5a6c7d; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
              ${message}
            </p>
            
            ${actionUrl && actionText ? getCreativeButton(actionText, actionUrl, '#a8edea') : ''}
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #a8edea;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                <strong>💡 Need help?</strong> If you have any questions about this notification, feel free to contact our support team.
              </p>
            </div>
            
            <p style="color: #95a5a6; font-size: 14px; margin: 30px 0 0;">
              Thank you for being part of our community! 💙
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
    text: `
      🔔 ${title}
      
      ${message}
      
      ${actionUrl && actionText ? `Action: ${actionText} - ${actionUrl}` : ''}
      
      Need help? If you have any questions about this notification, feel free to contact our support team.
      
      Thank you for being part of our community! 💙
      
      Best regards,
      The Team
    `,
  };

  try {
    if (!canSendEmail()) {
      console.warn('SMTP not configured. Skipping notification email send.');
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log('Notification email sent to:', email);
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
}
