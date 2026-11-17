require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns").promises;
const express = require("express");
const cors = require("cors");
const Verification = require("./models/Verification");
const {
    validateEmail,
    validateDomain,
    validateEmailDFA
} = require("./utils/validators");

const app = express();
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((error) => console.log("MongoDB Connection Error:", error));
app.use(cors());
app.use(express.json());

// Home API
app.get("/", (req, res) => {
    res.send("Email and Domain Verification API Running");
});

// Email Verification API
app.post("/api/verify-email", async (req, res) => {
    try {
        const { email } = req.body;

        // Regular Expression validation
        const regexValid = validateEmail(email);

        // DFA validation
        const dfaValid = validateEmailDFA(email);

        const message = regexValid
            ? "Email is valid"
            : "Email is invalid";

        // Save verification result
        const verification = new Verification({
            type: "email",
            value: email,
            valid: regexValid,
            message: message
        });

        await verification.save();

        res.json({
            valid: regexValid,
            message: message,
            regexResult: regexValid ? "Accepted" : "Rejected",
            dfaResult: dfaValid ? "Accepted" : "Rejected"
        });

    } catch (error) {
        res.status(500).json({
            message: "Email verification failed"
        });
    }
});
// DNS-Based Domain Verification API
app.post("/api/verify-domain-dns", async (req, res) => {
    try {
        const { domain } = req.body;

        if (!domain) {
            return res.status(400).json({
                success: false,
                message: "Domain is required"
            });
        }

        // First check domain format
        const isValidFormat = validateDomain(domain);

        if (!isValidFormat) {
            return res.json({
                success: true,
                domain,
                valid: false,
                message: "Invalid Domain Format"
            });
        }

        // Check DNS resolution
        const result = await dns.lookup(domain);

        const message = `Domain resolved successfully. IP Address: ${result.address}`;

        await Verification.create({
            type: "domain",
            value: domain,
            valid: true,
            message: message
        });

        res.json({
            success: true,
            domain,
            valid: true,
            ipAddress: result.address,
            message
        });

    } catch (error) {
        res.json({
            success: true,
            domain: req.body.domain,
            valid: false,
            message: "Domain could not be resolved through DNS"
        });
    }
});
// Domain Verification API
app.post("/api/verify-domain", async (req, res) => {
    try {
        const { domain } = req.body;

        if (!domain) {
            return res.status(400).json({
                success: false,
                message: "Domain is required"
            });
        }

        const isValid = validateDomain(domain);

        const message = isValid
            ? "Valid Domain Name"
            : "Invalid Domain Name";

        // Save result in MongoDB
        await Verification.create({
            type: "domain",
            value: domain,
            valid: isValid,
            message: message
        });

        res.json({
            success: true,
            domain,
            valid: isValid,
            message
        });

    } catch (error) {
        console.log("Domain Error:", error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});
// MX Record Verification API
app.post("/api/verify-mx", async (req, res) => {
    try {
        const { domain } = req.body;

        if (!domain) {
            return res.status(400).json({
                success: false,
                message: "Domain is required"
            });
        }

        const isValidFormat = validateDomain(domain);

        if (!isValidFormat) {
            return res.json({
                success: true,
                domain,
                valid: false,
                message: "Invalid Domain Format"
            });
        }

        // Retrieve MX records using Google DNS-over-HTTPS
        const dnsResponse = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
    {
        headers: {
            "Accept": "application/dns-json"
        }
    }
);

        if (!dnsResponse.ok) {
            throw new Error("DNS service unavailable");
        }

        const dnsData = await dnsResponse.json();

        if (dnsData.Status !== 0 || !dnsData.Answer) {
            throw new Error("No MX records found");
        }

        const mxServers = dnsData.Answer
            .filter(record => record.type === 15)
            .map(record => {
                const parts = record.data.split(" ");

                return {
                    priority: Number(parts[0]),
                    exchange: parts.slice(1).join(" ").replace(/\.$/, "")
                };
            });

        if (mxServers.length === 0) {
            throw new Error("No MX records found");
        }

        const message = "MX Records Found Successfully";

        await Verification.create({
            type: "mx",
            value: domain,
            valid: true,
            message: message
        });

        res.json({
            success: true,
            domain,
            valid: true,
            mxRecords: mxServers,
            message
        });

    } catch (error) {
        console.log("MX Verification Error:", error);

        res.json({
            success: true,
            domain: req.body.domain,
            valid: false,
            message: "No MX Records Found or DNS Lookup Failed"
        });
    }
});
// Get Verification History API
app.get("/api/history", async (req, res) => {
    try {
        const history = await Verification.find().sort({
            createdAt: -1
        });

        res.json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        console.log("History Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch history"
        });
    }
});
// Delete Verification History API
app.delete("/api/history/:id", async (req, res) => {
    try {
        const deletedRecord = await Verification.findByIdAndDelete(
            req.params.id
        );

        if (!deletedRecord) {
            return res.status(404).json({
                success: false,
                message: "Record not found"
            });
        }

        res.json({
            success: true,
            message: "Record deleted successfully"
        });

    } catch (error) {
        console.log("Delete Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete record"
        });
    }
});
// Delete All Verification History API
app.delete("/api/history", async (req, res) => {
    try {
        const result = await Verification.deleteMany({});

        res.json({
            success: true,
            message: "All verification records deleted successfully",
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.log("Delete All Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete verification history"
        });
    }
});
// Start Server
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});