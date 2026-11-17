const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["email", "domain", "mx"]
        },

        value: {
            type: String,
            required: true
        },

        valid: {
            type: Boolean,
            required: true
        },

        message: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Verification",
    verificationSchema
);
