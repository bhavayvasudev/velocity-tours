const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  // Matches: name = db.Column(db.String(200), nullable=False)
  name: { 
    type: String, 
    required: true 
  },

  // Matches: client_id (We store the name directly for now to keep it simple)
  clientName: { 
    type: String, 
    required: true 
  },

  // Matches: total_client_payment
  totalClientPayment: { 
    type: Number, 
    required: true 
  },

  // Matches: client_paid_amount (Default 0, skipping initial payment)
  clientPaidAmount: { 
    type: Number, 
    default: 0 
  },

  // Matches: booking_date
  date: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Booking', BookingSchema);