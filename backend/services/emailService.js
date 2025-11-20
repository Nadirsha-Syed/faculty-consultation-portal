// --- Email Notification Service using Nodemailer ---
const nodemailer = require('nodemailer');

// Configure the transporter using explicit host and secure port 465 to avoid timeout issues
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Explicitly use Gmail's host
    port: 465,             // Explicitly use the secure SMTP port
    secure: true,          // Use SSL/TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Optional: Add timeout settings, though host/port fix is usually sufficient
    // timeout: 20000, 
});

// Sends notification when a new request is submitted (to FACULTY)
const sendNewRequestNotification = async (facultyEmail, studentName, topic, details) => {
    
    const messageHtml = details.studentMessage 
        ? `<p><strong>Student's Optional Message:</strong> ${details.studentMessage}</p>` 
        : `<p>No optional message was included with this request.</p>`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: facultyEmail,
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
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to faculty: ${facultyEmail}`);
    } catch (error) {
        console.error(`Error sending new request email to ${facultyEmail}:`, error);
    }
};

// Sends notification when a request is APPROVED or REJECTED (to STUDENT)
const sendStatusUpdateNotification = async (studentEmail, status, facultyName, details = {}) => {
    let subject;
    let body;

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
        from: process.env.EMAIL_USER,
        to: studentEmail,
        subject: subject,
        html: body,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to student: ${studentEmail} regarding status change.`);
    } catch (error) {
        console.error(`Error sending status update email to ${studentEmail}:`, error);
    }
};

module.exports = { 
    sendNewRequestNotification,
    sendStatusUpdateNotification
};