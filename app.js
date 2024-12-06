const express = require("express");
const cors = require('cors');
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;

const uri = 'mongodb+srv://user:user159357@cluster0.n29kz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// ============ MongoDB setup =============
mongoose.connect(uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// ============ Schema for Registration =============
const registrationSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  field: String,
  level: String,
  interests: String,
  hear: String,
  consent: String,
  issues: String
});

const Registration = mongoose.model('Registration', registrationSchema);

app.use(
  cors({
    origin: "https://chemvision.vercel.app",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

const deadline = new Date("2024-12-06T22:35:00").getTime();

app.use(bodyParser.json());

let emailSent = false;

app.post("/register", async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    field,
    level,
    interests,
    hear,
    consent,
    issues,
  } = req.body;

  if (!firstname || !lastname || !email || !field || !level) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Create new registration and save to database
  const newRegistration = new Registration({
    firstname,
    lastname,
    email,
    field,
    level,
    interests,
    hear,
    consent,
    issues,
  });

  await newRegistration.save();

  res.status(200).json({ message: "Registration successful!" });
});

// Send email when deadline has passed
async function sendEmail() {
  try {
    // استخدام await بدلاً من callback
    const data = await Registration.find({});

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: 'yacineddd32@gmail.com',
        pass: 'ajge ppsr bszo daap',
      },
    });

    const emailContent = data
      .map(
        (r, i) => `
      <div style="padding: 10px; border-bottom: 1px solid #ddd;">
        <h3 style="color: #192959;">Participant ${i + 1}: ${r.firstname} ${r.lastname}</h3>
        <p><strong>Email:</strong> ${r.email}</p>
        <p><strong>Field:</strong> ${r.field}, <strong>Level:</strong> ${r.level}</p>
        <p><strong>What interests me about this workshop is:</strong> ${r.interests}</p>
        <p><strong>I heard about this workshop through:</strong> ${r.hear}</p>
        <p><strong>Does he (she) have any issue with photos or videos being taken during the workshop? :</strong> ${r.consent}</p>
        <p><strong>Does he (she) have any issue with showing on social media? :</strong> ${r.issues}</p>
      </div>
    `)
      .join("\n");

    const mailOptions = {
      from: "yacineddd32@gmail.com",
      to: "yacineddd32@gmail.com",
      subject: "List of Workshop Registrants",
      html: `
      <html>
        <body>
          <h1 style="color: #3956AC;">List of Workshop Registrants</h1>
          <p>The workshop registration is now closed. Here are the participants:</p>
          ${emailContent}
        </body>
      </html>
    `,
    };

    // إرسال البريد الإلكتروني
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error fetching registrations or sending email:', error);
  }
}


// Check deadline every second
setInterval(async () => {
  const now = new Date().getTime();

  if (now >= deadline && !emailSent) {
    sendEmail();
    emailSent = true;
  }
}, 1000);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
