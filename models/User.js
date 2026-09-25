const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 40
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 40
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    headline: {
      type: String,
      default: "Student | Technology Enthusiast",
      maxlength: 120
    },
    location: {
      type: String,
      default: "India",
      maxlength: 80
    },
    avatar: {
      type: String,
      default: ""
    },
    connections: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

module.exports = mongoose.model("User", userSchema);
