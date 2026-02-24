# Email Configuration Guide

## Overview
The system now sends **automatic confirmation emails** when users register for events! 🎉

## Email Features
- ✅ Sent automatically on event registration
- ✅ Sent for both individual and team registrations
- ✅ Beautiful HTML template with event details
- ✅ Includes ticket ID and QR code link
- ✅ Graceful failure (registration succeeds even if email fails)

## Setup Instructions

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Enter any app name (e.g., "Felicity Events" or "Node App")
   - Click Create
   - Copy the 16-character password shown (spaces don't matter)

3. **Update .env file in backend folder**
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop
   ```
   Note: You can include or remove spaces in the password - both work!

4. **Restart the backend** for changes to take effect

### Option 2: Other Email Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

## Testing

### Without Email Configuration
- Emails will be skipped gracefully
- You'll see: `📧 Email not configured, skipping confirmation email`
- Registration still works perfectly!

### With Email Configuration
1. Register for an event as a participant
2. Check your email inbox
3. You should receive a beautifully formatted confirmation email
4. Backend logs will show: `✅ Confirmation email sent to user@example.com`

## Email Template Preview

The email includes:
- 🎉 Welcome message
- 📅 Full event details (name, type, date, time)
- 🤝 Team information (if team registration)
- 🎫 Ticket ID with view link
- 💡 Pro tips for participants
- Beautiful, professional design

## Email Triggers

Emails are sent automatically for:
1. **Individual Event Registration** - When a participant registers for an event
2. **Team Leader Registration** - When creating a new team
3. **Team Member Registration** - When joining an existing team via invite code
4. **Merchandise Events** - Both purchase and registration-only modes

## Troubleshooting

### "Invalid login" error
- Make sure you're using an App Password, not your regular Gmail password
- Ensure 2FA is enabled on your Google account

### Emails not being sent
- Check the backend console for email-related logs
- Verify EMAIL_USER and EMAIL_PASS are set correctly
- Try sending a test email using online SMTP testers

### Emails going to spam
- This is normal for development
- For production, consider:
  - Using a professional email service (SendGrid, AWS SES)
  - Setting up SPF/DKIM records
  - Using a custom domain email

## Production Recommendations

For production deployment:
1. **Use SendGrid** or **AWS SES** instead of Gmail
2. Set up proper DNS records (SPF, DKIM, DMARC)
3. Use environment variables for sensitive credentials
4. Monitor email delivery rates
5. Implement email queue for better performance

## Security Notes

- ✅ Credentials are never logged or exposed
- ✅ Email failures don't break registration flow
- ✅ All email sending is wrapped in try-catch blocks
- ✅ Graceful degradation if email service is unavailable

## Need Help?

If you need assistance:
- Check backend logs for detailed error messages
- Verify .env configuration
- Test SMTP credentials using online tools
- Consider using a dedicated email service for production

---

**Note**: Currently configured to skip emails if credentials not set. This ensures the application works seamlessly in development without requiring email setup!
