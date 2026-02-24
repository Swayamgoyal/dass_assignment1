const nodemailer = require('nodemailer');

/**
 * Send registration confirmation email
 * @param {Object} participant - Participant details
 * @param {Object} event - Event details (must include organizerId)
 * @param {Object} registration - Registration details
 * @param {Object} team - Optional team details if team registration
 */
const sendRegistrationEmail = async (participant, event, registration, team = null) => {
    try {
        // Skip if email not configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
            process.env.EMAIL_USER === 'your_email@gmail.com') {
            console.log('📧 Email not configured, skipping confirmation email');
            return;
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const eventType = event.eventType === 'Normal' ? 'Event' : 'Merchandise';
        
        // Build team details if applicable
        let teamDetails = '';
        if (team) {
            teamDetails = `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <h3 style="margin-top: 0; color: #856404;">🤝 Team Registration</h3>
                    <p><strong>Team Name:</strong> ${team.teamName}</p>
                    <p><strong>Team Size:</strong> ${team.teamSize}</p>
                    <p><strong>Your Role:</strong> ${team.teamLeaderId.toString() === participant._id.toString() ? 'Team Leader' : 'Team Member'}</p>
                </div>
            `;
        }
        
        // Build merchandise details if applicable
        let merchDetails = '';
        if (event.eventType === 'Merchandise' && registration.merchandiseVariant) {
            merchDetails = `
                <p><strong>Variant:</strong> ${registration.merchandiseVariant.size} - ${registration.merchandiseVariant.color}</p>
                <p><strong>Quantity:</strong> ${registration.merchandiseVariant.quantity || 1}</p>
            `;
        } else if (event.eventType === 'Merchandise') {
            merchDetails = '<p><strong>Type:</strong> Registration Only (No Purchase)</p>';
        }

        const mailOptions = {
            from: `"Felicity Events" <${process.env.EMAIL_USER}>`,
            to: participant.email,
            subject: `✅ Registration Confirmed - ${event.eventName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center; }
                        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
                        .box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .ticket-box { background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea; }
                        .ticket-id { font-size: 1.3em; color: #667eea; font-weight: bold; letter-spacing: 1px; }
                        .btn { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; font-weight: 500; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
                        h2 { margin-top: 0; }
                        .emoji { font-size: 1.5em; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="margin: 0;"><span class="emoji">🎉</span> Registration Confirmed!</h1>
                        </div>
                        <div class="content">
                            <p>Dear <strong>${participant.firstName} ${participant.lastName}</strong>,</p>
                            <p>Your registration for <strong>${event.eventName}</strong> has been successfully confirmed!</p>
                            
                            ${teamDetails}
                            
                            <div class="box">
                                <h3 style="margin-top: 0;"><span class="emoji">📅</span> Event Details</h3>
                                <p><strong>Event:</strong> ${event.eventName}</p>
                                <p><strong>Type:</strong> ${eventType}</p>
                                <p><strong>Start Date:</strong> ${new Date(event.eventStartDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p><strong>Time:</strong> ${new Date(event.eventStartDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                ${merchDetails}
                            </div>
                            
                            <div class="ticket-box">
                                <h3 style="margin-top: 0;"><span class="emoji">🎫</span> Your Ticket</h3>
                                <p><strong>Ticket ID:</strong></p>
                                <p class="ticket-id">${registration.ticketId}</p>
                                <p style="margin-top: 15px;">Please save this ticket ID. You'll need it to check in at the event. You can also view your ticket anytime in your dashboard.</p>
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/participant/tickets/${registration.ticketId}" class="btn">View My Ticket</a>
                            </div>
                            
                            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                                <p style="margin: 0;"><strong>💡 Pro Tip:</strong> Take a screenshot of this email or save your ticket ID for quick access at the event!</p>
                            </div>
                            
                            <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to reach out${event.organizerId?.contactEmail ? ` to ${event.organizerId.contactEmail}` : ' to the event organizer'}.</p>
                            
                            <p style="margin-top: 20px;">We're excited to see you at the event! 🚀</p>
                            
                            <p style="margin-top: 30px; color: #666;">
                                Best regards,<br>
                                <strong>Felicity Events Team</strong><br>
                                IIIT Hyderabad
                            </p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email. Please do not reply to this message.</p>
                            <p style="color: #999; font-size: 0.85em;">© ${new Date().getFullYear()} Felicity - IIIT Hyderabad. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Confirmation email sent to ${participant.email}`);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        // Don't throw - email failure shouldn't break registration
        return false;
    }
};

module.exports = {
    sendRegistrationEmail
};
