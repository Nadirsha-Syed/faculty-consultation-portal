// --- Email Notification Service using SendGrid (via HTTP API) ---
const sgMail = require('@sendgrid/mail');
const { SENDGRID_API_KEY, EMAIL_SENDER } = process.env;

// Set the SendGrid API Key (This uses HTTPS/Port 443, bypassing Render's SMTP blocks)
// NOTE: This must be done before the service functions are called
if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
} else {
    console.error("CRITICAL ERROR: SENDGRID_API_KEY is not set. Emails will fail.");
}


// Sends notification when a new request is submitted (to FACULTY)
const sendNewRequestNotification = async (facultyEmail, studentName, topic, details) => {
    
    // Structure the student message content
    const messageHtml = details.studentMessage 
        ? `<p><strong>Student's Optional Message:</strong> ${details.studentMessage}</p>` 
        : `<p>No optional message was included with this request.</p>`;

    const mailOptions = {
        to: facultyEmail,
        from: EMAIL_SENDER,
        subject: `[Consultation Portal] New Booking Request from ${studentName}`,
        html: `
            <p>Dear Faculty,</p>
            <p>A new consultation request has been submitted by student <strong>${studentName}</strong>.</p>
            
            <h3>Request Details:</h3>
            <ul>
                <li><strong>Topic:</strong> ${topic}</li>
                <li><strong>Student Email:</strong> ${details.studentEmail}</li>
                <li><strong>Department:</strong> ${details.studentDepartment}</li>
                <li><strong>Batch/Year:</strong> ${details.studentBatchNo}</li>
            </ul>
            
            ${messageHtml}

            <p>Please log into your Faculty Dashboard to review and set the final schedule (Date, Time, and Room).</p>
            <p>Thank you.</p>
        `,
    };
    try {
        await sgMail.send(mailOptions);
        console.log(`SendGrid Email sent to faculty: ${facultyEmail}`);
    } catch (error) {
        // SendGrid API errors are logged here
        console.error(`Error sending new request email via SendGrid:`, error.response?.body?.errors || error);
    }
};

// Sends notification when a request is APPROVED or REJECTED (to STUDENT)
const sendStatusUpdateNotification = async (studentEmail, status, facultyName, details = {}) => {
    let subject;
    let body;

    // Logic to determine email content based on status
    if (status === 'approved') {
        subject = `✅ Your Consultation with ${facultyName} is CONFIRMED`;
        body = `
            <p>Dear Student,</p>
            <p>Your consultation request with <strong>${facultyName}</strong> has been <strong>APPROVED</strong> and officially scheduled!</p>
            <p><strong>--- Final Schedule Details ---</strong></p>
            <p><strong>Date/Time:</strong> ${new Date(details.finalDateTime).toLocaleString()}</p>
            <p><strong>Location/Room:</strong> ${details.roomNumber}</p>
            <p>Please ensure you arrive on time. Thank you.</p>
        `;
    } else if (status === 'rejected') {
        subject = `❌ Your Consultation with ${facultyName} was Rejected`;
        body = `
            <p>Dear Student,</p>
            <p>Your consultation request with <strong>${facultyName}</strong> has been <strong>REJECTED</strong>.</p>
            <p>If you still require a consultation, please submit a new request via the portal.</p>
        `;
    } else if (status === 'cancelled') {
         subject = `🚫 Your Consultation with ${facultyName} was Cancelled`;
        body = `
            <p>Dear Student,</p>
            <p>Your consultation request has been **CANCELLED**.</p>
        `;
    } else if (status === 'reschedule') {
         subject = `⚠️ Consultation with ${facultyName} Requires Reschedule`;
        body = `
            <p>Dear Student,</p>
            <p>Your request with <strong>${facultyName}</strong> has been marked for **RESCHEDULE**.</p>
            <p>Please submit a new request with a different preferred date/time via the portal.</p>
        `;
    } else {
        return; 
    }

    const mailOptions = {
        to: studentEmail,
        from: EMAIL_SENDER,
        subject: subject,
        html: body,
    };

    try {
        await sgMail.send(mailOptions);
        console.log(`SendGrid Email sent to student: ${studentEmail} regarding status change.`);
    } catch (error) {
        console.error(`Error sending status update email via SendGrid:`, error.response?.body?.errors || error);
    }
};

module.exports = { 
    sendNewRequestNotification,
    sendStatusUpdateNotification
};