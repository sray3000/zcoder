let mongoose = require("mongoose");
let bcrypt = require("bcryptjs");

let Schema = mongoose.Schema;

let submissionSchema = new Schema({
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
  solutionCode: String,
  status: { type: String, enum: ["Accepted", "Wrong Answer"] },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

let userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  comments: [{ type: String }],
  authProvider: { type: String, default: "local" }, // 'local' or 'google'
  // New fields
  submissions: [submissionSchema], // recent activity
  bookmarkedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }] // favorites
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;