// --- Booking Controller (Create, View, Update Status, Cancel) ---
const Booking = require('../models/Booking');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const { sendNewRequestNotification, sendStatusUpdateNotification } = require('../services/emailService'); 

// @desc    Create a new consultation booking request
// @route   POST /api/bookings
// @access  Private (Student)
const createBooking = async (req, res) => {
    // req.user.id is set by the protect middleware (the student's ID)
    const { facultyId, dateTime, durationMinutes, topic, studentMessage } = req.body;
    const studentId = req.user.id;

    try {
        // Find faculty and student details for email purposes
        const faculty = await Faculty.findById(facultyId).populate('userId', 'email name');
        // Populate student profile data (dept, batch) for faculty email notification
        const student = await User.findById(studentId);

        if (!faculty || !student) {
            return res.status(404).json({ message: 'Faculty or student not found.' });
        }
        
        // 1. Create the booking request
        const booking = await Booking.create({
            student: studentId,
            faculty: facultyId,
            dateTime,
            durationMinutes,
            topic,
            studentMessage: studentMessage || '', // Use provided message or empty string
            status: 'pending' // Always starts as pending
        });
        
        // 2. Trigger notification to the faculty member
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            sendNewRequestNotification(
                faculty.userId.email, // Faculty's email address
                student.name,         // Student's name
                topic,
                { 
                    studentEmail: student.email,
                    studentDepartment: student.studentDepartment,
                    studentBatchNo: student.batchNo,
                    studentMessage: booking.studentMessage 
                }
            );
        }

        res.status(201).json({ 
            message: 'Booking request submitted successfully. Email notification sent to faculty.', 
            booking 
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Server error creating booking request' });
    }
};

// @desc    Get bookings for the authenticated user
// @route   GET /api/bookings/my
// @access  Private (Student or Faculty)
const getMyBookings = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let bookings;

        if (role === 'student') {
            // Student view: Find all bookings requested by this user
            bookings = await Booking.find({ student: userId })
                // Populate faculty details (name, email)
                .populate({
                    path: 'faculty',
                    select: 'userId',
                    populate: { path: 'userId', select: 'name email' } 
                })
                .sort({ createdAt: -1 }); // Show newest requests first

        } else if (role === 'faculty') {
            // Faculty view: Find the faculty profile linked to this user
            const facultyProfile = await Faculty.findOne({ userId: userId });
            
            if (!facultyProfile) {
                return res.status(404).json({ message: 'Faculty profile not linked.' });
            }

            // Find all bookings addressed to this faculty profile ID
            bookings = await Booking.find({ faculty: facultyProfile._id })
                // Populate student details (name, email, department, batch)
                .populate('student', 'name email studentDepartment batchNo')
                .sort({ createdAt: -1 });
        }

        res.json(bookings);

    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server error fetching bookings' });
    }
};

// @desc    Faculty updates the status of a booking (Approve/Reject/Reschedule)
// @route   PUT /api/bookings/:bookingId/status
// @access  Private (Faculty)
const updateBookingStatus = async (req, res) => {
    const { bookingId } = req.params;
    const { status, finalDateTime, roomNumber } = req.body;
    const facultyUserId = req.user.id;

    // Check for valid status transition
    if (!['approved', 'rejected', 'reschedule'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const booking = await Booking.findById(bookingId)
            // Populate student user data for email
            .populate('student', 'email name')
            .populate({
                path: 'faculty',
                select: 'userId',
                populate: { path: 'userId', select: 'name' } // Get faculty name for email
            });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        
        // Security check: Ensure the authenticated user is the faculty member linked to this booking
        const facultyProfile = await Faculty.findOne({ userId: facultyUserId });
        if (!facultyProfile || !booking.faculty.equals(facultyProfile._id)) {
            return res.status(403).json({ message: 'Not authorized to update this booking.' });
        }

        // --- Core Logic for Status Update ---

        // 1. Handle Approval (Requires Schedule Details)
        if (status === 'approved' || status === 'reschedule') {
            if (!finalDateTime || !roomNumber) {
                // IMPORTANT: This handles cases where the faculty is rescheduling but didn't provide new details
                // This shouldn't happen with the current frontend form, but is a necessary backend check.
                if (status === 'reschedule' && !finalDateTime && !roomNumber) {
                     // If faculty is just marking as reschedule without setting a new time, that's fine.
                } else {
                     return res.status(400).json({ message: 'Final date/time and room number are required for approval/reschedule.' });
                }
            }

            // Only update schedule details if provided (for approval or if faculty is setting a new time during reschedule)
            if (finalDateTime) booking.finalDateTime = finalDateTime;
            if (roomNumber) booking.roomNumber = roomNumber;
        } 
        
        // 2. Handle Rejection/Other Status
        if (status === 'rejected') {
            // Clear final scheduling data if the status is anything other than approved
            booking.finalDateTime = undefined;
            booking.roomNumber = undefined;
        }

        // Set the new status
        booking.status = status;
        await booking.save();
        
        // 3. Trigger Email Notification to Student
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            sendStatusUpdateNotification(
                booking.student.email,
                status,
                booking.faculty.userId.name,
                { finalDateTime: booking.finalDateTime, roomNumber: booking.roomNumber }
            );
        }


        res.json({ 
            message: `Booking status updated to ${status}.`,
            booking
        });

    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ message: 'Server error updating booking status' });
    }
};

// @desc    Student cancels a pending or approved booking
// @route   DELETE /api/bookings/:bookingId
// @access  Private (Student)
const cancelBooking = async (req, res) => {
    const { bookingId } = req.params;
    const studentId = req.user.id;

    try {
        const booking = await Booking.findById(bookingId)
            .populate('student', 'email name')
            .populate({
                path: 'faculty',
                select: 'userId',
                populate: { path: 'userId', select: 'name email' }
            });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        
        // Security check: Ensure the authenticated user is the student who made the booking
        if (!booking.student._id.equals(studentId)) {
            return res.status(403).json({ message: 'Not authorized to cancel this booking.' });
        }

        // Only allow cancellation if status is pending, approved, or reschedule
        if (['pending', 'approved', 'reschedule'].includes(booking.status)) {
            const oldStatus = booking.status;
            booking.status = 'cancelled';
            // Clear final schedule if cancelling an approved booking
            booking.finalDateTime = undefined; 
            booking.roomNumber = undefined;

            await booking.save();

            // Notify faculty of cancellation
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                 
                 // Notify student of successful cancellation
                 sendStatusUpdateNotification(
                    booking.student.email,
                    'cancelled',
                    booking.faculty.userId.name
                );
            }

            res.json({ message: 'Booking cancelled successfully.', booking });
        } else {
            return res.status(400).json({ message: `Cannot cancel a booking with status: ${booking.status}` });
        }

    } catch (error) {
        console.error('Error canceling booking:', error);
        res.status(500).json({ message: 'Server error during cancellation' });
    }
};

module.exports = { 
    createBooking, 
    getMyBookings, 
    updateBookingStatus,
    cancelBooking
};