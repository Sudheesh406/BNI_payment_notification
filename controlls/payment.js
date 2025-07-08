const mongoose = require("mongoose");
const payment = require("../models/paymentModel");
const User = require("../models/user");
const cron = require("node-cron");
const transporter = require("../nodeMailer");
require("dotenv").config();

// const axios = require("axios");
// const FAST2SMS_API_KEY 

async function newUser(req, res) {
  try {
    // Create user
    const newUser = new User(req.body);
    const savedUser = await newUser.save();

    // Create default payment
    const defaultPayment = new payment({
      userId: savedUser._id,
      amount: 0,
      phone: savedUser.phone,
      paymentDate: Date.now(), // or new Date()
      isPaid: false,
    });

    await defaultPayment.save();

    res.status(201).json({
      message: "User and initial payment created successfully",
      user: savedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user and payment" });
  }
}

async function newPayment(req, res) {
  const data = req.body;
  console.log(data);
  try {
    if (!data.userId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const isAmountPaid = data.lastPaymentAmount > 0;
    const defaultPayment = new payment({
      userId: data.userId,
      amount: data.lastPaymentAmount,
      phone: data.phone,
      paymentDate: Date.now(),
      isPaid: isAmountPaid,
      paymentMethod: data.paymentMethod,
    });

    let paymentSuccess;
    let message;
    let userDetails = await User.findById(data.userId);

    if (isAmountPaid) {
      await User.findByIdAndUpdate(data.userId, { isPaid: true });
      message = `Hello ${userDetails.name}, your payment of ₹${data.lastPaymentAmount} has been received. Thank you!`;
      paymentSuccess = await defaultPayment.save();
    } else {
      message = `Hello ${userDetails.name}, a payment record was created with ₹0. If this was a mistake, please update it.`;
      paymentSuccess = await defaultPayment.save();
    }

    if (paymentSuccess) {
      nodemailer(message, userDetails.email);
      return res.status(200).json({
        message: "Payment updated successfully",
        data: defaultPayment,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating payment record" });
  }
}

async function deletePayment(req, res) {
  try {
    const { id } = req.params;
    console.log(id);

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { isAvailable: false } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User marked as unavailable successfully",
      data: { updatedUser },
    });
  } catch (error) {
    console.error("Error in deletePayment:", error);
    res.status(500).json({
      message: "Error updating user availability",
      error: error.message,
    });
  }
}

async function getPaymentsByPhone(req, res) {
  try {
    const { phone } = req.params;

    const payments = await payment.find({ phone });

    if (!payments || payments.length === 0) {
      return res
        .status(404)
        .json({ message: "No payments found for this phone number" });
    }

    res.status(200).json({
      message: "Payments found",
      data: payments,
    });
  } catch (error) {
    console.error("Error in getPaymentsByPhone:", error);
    res
      .status(500)
      .json({ message: "Error retrieving payments", error: error.message });
  }
}

async function getAllUsersWithLastPayment(req, res) {
  try {

    const users = await User.find({ isAvailable: true });

    const result = await Promise.all(
      users.map(async (user) => {

        const lastPayment = await payment
          .findOne({
            userId: user._id,
          })
          .sort({ paymentDate: -1 })
          .lean();

        return {
          userId: user._id,
          userName: user.name,
          lastPaymentAmount: lastPayment?.amount || 0,
          lastPaymentDate: lastPayment?.paymentDate,
          paymentMethod: lastPayment?.paymentMethod,
          phone: user.phone,
          isPaid: lastPayment?.isPaid || false,
          userIsPaid: user.isPaid,
        };
      })
    );

    res.status(200).json({ message: "All users with last payment", result });
  } catch (error) {
    console.error("Error fetching last payments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function editOldData(req, res) {
  try {
    const { userId, name, phone } = req.body;

    if (!userId || (!name && !phone)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { ...(name && { name }), ...(phone && { phone }) },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error in editOldData:", error);
    res.status(500).json({ message: "Error in editOldData", error });
  }
}

const getPayment = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "id is required for payment" });
    }

    const payments = await payment
      .find({ userId: userId })
      .populate("userId", "name");

    const result = payments.map((p) => ({
      ...p.toObject(),
      userName: p.userId.name, // Add the name directly
    }));

    if (result)
      res.status(200).json({ message: "payment sented successfully", result });
  } catch (error) {
    console.error("error found in getPayment", error);
    res.status(400).json({ message: "error found in getting payment", error });
  }
};


cron.schedule("0 0 1 * *", async () => {
  try {
    const result = await User.updateMany(
      { isAvailable: true },
      { $set: { isPaid: false } }
    );
    console.log(
      `Reset isPaid to false for ${result.modifiedCount} available users`
    );
  } catch (error) {
    console.error("Error resetting isPaid:", error);
  }
});

const getTrashUsers = async (req, res) => {
  try {
    const users = await User.find({ isAvailable: false }, "name phone");
    res.json(users); // send users with name and phone
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};


const PermenentDelete = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Permanently delete user
    const deletedUser = await User.findByIdAndDelete({ _id: userId });
    const deletedPayment = await payment.deleteMany({ userId: userId });

    if (!deletedUser || !deletedPayment) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User permanently deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    console.error("Error in PermenentDelete:", error);
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};


const restore = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Restore user by updating isAvailable to true
    const restoredUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isAvailable: true } },
      { new: true }
    );

    if (!restoredUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User restored successfully",
      data: restoredUser,
    });
  } catch (error) {
    console.error("Error in restore:", error);
    res
      .status(500)
      .json({ message: "Error restoring user", error: error.message });
  }
};

async function nodemailer(message, userMail) {

  const info = await transporter.sendMail({
    from: "sudheeshunni406@gmail.com", // sender address
    to: Array.isArray(userMail) ? userMail.join(",") : userMail,
    subject: "Payment Notification", // Subject line
    text: message, // ✅ plain text
    html: `<p>${message}</p>`, // ✅ HTML format
  });

  return info;
}

// async function paidSmsSenter(message, numbers) {
//   try {
//     const response = await axios.post(
//       "https://www.fast2sms.com/dev/bulkV2",
//       {
//         route: "q",
//         message: message,
//         language: "english",
//         flash: 0,
//         numbers: numbers,
//       },
//       {
//         headers: {
//           authorization: FAST2SMS_API_KEY,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     console.log(response.data);
//   } catch (error) {
//     console.error("Error sending SMS:", error);
//   }
// }


// async function unPaidSmsSenter(message, numbersArray) {
//   try {
//     const numbers = numbersArray.join(",");

//     const response = await axios.post(
//       "https://www.fast2sms.com/dev/bulkV2",
//       {
//         route: "q",
//         message: message,
//         language: "english",
//         flash: 0,
//         numbers: numbers,
//       },
//       {
//         headers: {
//           authorization: FAST2SMS_API_KEY,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("SMS Response:", response.data);
//   } catch (error) {
//     console.error("Error sending SMS:", error.response?.data || error.message);
//   }
// }

cron.schedule("0 9 10 * *", async () => {
  try {
    const unpaidUsers = await User.find({ isPaid: false });

    if (unpaidUsers.length === 0) {
      console.log("No unpaid users found.");
      return;
    }

    const email = unpaidUsers.map((user) => user.email);
    const message = "Reminder: Please complete your payment for this month. Thank you.";

    await nodemailer(message, email);
    console.log(`Sent payment reminder to ${email.length} users.`);
  } catch (error) {
    console.error("Error during scheduled SMS sending:", error);
  }
});


module.exports = {
  newUser,
  newPayment,
  deletePayment,
  getPaymentsByPhone,
  getAllUsersWithLastPayment,
  editOldData,
  getPayment,
  getTrashUsers,
  PermenentDelete,
  restore,
};
