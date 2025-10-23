import smtplib
import os
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
load_dotenv()

def test_email_config():
    """Test email configuration"""
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    print(f"SMTP Server: {smtp_server}")
    print(f"SMTP Port: {smtp_port}")
    print(f"SMTP Username: {smtp_username}")
    print(f"SMTP Password configured: {bool(smtp_password)}")
    
    if not smtp_username or not smtp_password:
        print("❌ SMTP credentials not configured")
        return False
    
    try:
        # Test SMTP connection
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            print("✅ SMTP connection successful")
            
            # Send test email
            msg = MIMEMultipart()
            msg['From'] = smtp_username
            msg['To'] = "meegadavamsi76@gmail.com"
            msg['Subject'] = "Test Email - Admin Verification System"
            
            body = """
            This is a test email to verify the admin verification system is working.
            
            If you receive this email, the SMTP configuration is correct.
            """
            
            msg.attach(MIMEText(body, 'plain'))
            server.send_message(msg)
            print("✅ Test email sent to meegadavamsi76@gmail.com")
            
        return True
        
    except Exception as e:
        print(f"❌ Email test failed: {e}")
        return False

if __name__ == "__main__":
    test_email_config()
