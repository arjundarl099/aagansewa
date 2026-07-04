const Booking = require('../models/Bookers');   // adjust path to your Booking model
const User    = require('../models/User');       // adjust path to your User model
const sendEmail = require('../utils/sendEmail');

// ── POST /api/v1/booker/:id/notify-cancel ─────────────────────────────────
const notifyCancellation = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the booking
    const booking = await Booking.findById(id).populate('user');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // 2. Get the user (populated or fetched separately)
    const user = booking.user;
    if (!user || !user.email) {
      return res.status(400).json({ success: false, message: 'User email not found' });
    }

    // 3. Format date nicely
    const bookingDate = booking.date
      ? new Date(booking.date).toLocaleDateString('en-NP', {
          year: 'numeric', month: 'long', day: 'numeric'
        })
      : 'N/A';

    const bookingTime = booking.time || booking.timeSlot || 'N/A';
    const service     = booking.service
      ? booking.service.charAt(0).toUpperCase() + booking.service.slice(1)
      : 'Service';

    // 4. Build HTML email
    const html = `
      <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background:#1a4d2e;padding:32px 36px;text-align:center;">
          <div style="font-size:2.5rem;">🚑</div>
          <h1 style="color:#fff;margin:8px 0 4px;font-size:1.5rem;font-weight:800;letter-spacing:0.02em;">Aagan Sewa</h1>
          <p style="color:#3daa64;margin:0;font-size:0.8rem;letter-spacing:0.15em;text-transform:uppercase;">Nepal Emergency Services</p>
        </div>

        <!-- Body -->
        <div style="padding:36px;">
          <h2 style="color:#e63946;margin:0 0 8px;font-size:1.25rem;">Booking Cancelled</h2>
          <p style="color:#374151;margin:0 0 24px;font-size:0.95rem;">
            Hi <strong>${user.name}</strong>, your booking has been successfully cancelled. Here are the details:
          </p>

          <!-- Booking Detail Card -->
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
              <tr>
                <td style="color:#6b7280;padding:6px 0;width:120px;">Service</td>
                <td style="color:#14532d;font-weight:700;">${service}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;padding:6px 0;">Date</td>
                <td style="color:#14532d;font-weight:700;">${bookingDate}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;padding:6px 0;">Time</td>
                <td style="color:#14532d;font-weight:700;">${bookingTime}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;padding:6px 0;">Status</td>
                <td>
                  <span style="background:#fee2e2;color:#dc2626;font-size:0.75rem;font-weight:700;padding:2px 10px;border-radius:20px;">
                    Cancelled
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <p style="color:#6b7280;font-size:0.88rem;margin:0 0 24px;">
            If this was a mistake or you'd like to rebook, visit our website anytime.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;">
            <a href="http://localhost:5500/services.html"
               style="display:inline-block;background:#1a4d2e;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:700;font-size:0.95rem;letter-spacing:0.03em;">
              Book Again
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
          <p style="color:#9ca3af;font-size:0.78rem;margin:0;">
            © ${new Date().getFullYear()} Aagan Sewa · Nepal Emergency Services<br/>
            <a href="mailto:aaganSewa@gmail.com" style="color:#3daa64;text-decoration:none;">aaganSewa@gmail.com</a>
          </p>
        </div>

      </div>
    `;

    // 5. Send the email
    await sendEmail(user.email, `Your ${service} Booking Has Been Cancelled`, html);

    res.status(200).json({ success: true, message: 'Cancellation email sent successfully' });

  } catch (err) {
    console.error('notifyCancellation error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email', error: err.message });
  }
};

module.exports = { notifyCancellation };