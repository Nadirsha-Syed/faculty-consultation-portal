// --- Booking Routes ---
const express = require('express');
const { createBooking, getMyBookings, updateBookingStatus, cancelBooking } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware'); // Dummy middleware, must be implemented
const router = express.Router();

/* * NOTE: In a production environment, the actual 'protect' middleware
* would be implemented in a separate file (e.g., authMiddleware.js)
* and would decode the JWT to set req.user = { id: '...', role: '...' }
* For simplicity, a basic placeholder is used in the controller. 
*/

// POST /api/bookings: Create a new booking request (Student)
router.post('/', protect, createBooking);

// GET /api/bookings/my: Get all bookings for the authenticated user (Student or Faculty)
router.get('/my', protect, getMyBookings);

// PUT /api/bookings/:bookingId/status: Faculty updates the status (Approve/Reject/Reschedule)
router.put('/:bookingId/status', protect, updateBookingStatus);

// DELETE /api/bookings/:bookingId: Student cancels a booking
router.delete('/:bookingId', protect, cancelBooking);

module.exports = router;