import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = "https://email-project-u2nk.onrender.com";

function App() {
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState("");
  const [regexResult, setRegexResult] = useState("");
  const [dfaResult, setDfaResult] = useState("");
  const [history, setHistory] = useState([]);
  const [mxRecords, setMxRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Verification History
  const fetchHistory = async () => {
    try {
      const response = await axios.get(
        API_BASE_URL + "/api/history"
      );

      setHistory(response.data.data);
    } catch (error) {
      console.log("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Email Verification
  const verifyEmail = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        API_BASE_URL + "/api/verify-email",
        { email }
      );

      setResult(response.data.message);
      setRegexResult(response.data.regexResult);
      setDfaResult(response.data.dfaResult);

      fetchHistory();
    } catch (error) {
      console.log("Email verification error:", error);
      setResult("Error verifying email");
    } finally {
      setLoading(false);
    }
  };

  // Domain Verification
  const verifyDomain = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        API_BASE_URL + "/api/verify-domain",
        { domain }
      );

      setResult(response.data.message);
      fetchHistory();
    } catch (error) {
      console.log("Domain verification error:", error);
      setResult("Error verifying domain");
    } finally {
      setLoading(false);
    }
  };

  // DNS-Based Domain Verification
  const verifyDomainDNS = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        API_BASE_URL + "/api/verify-domain-dns",
        { domain }
      );

      setResult(response.data.message);
      fetchHistory();
    } catch (error) {
      console.log("DNS verification error:", error);
      setResult("Error checking DNS");
    } finally {
      setLoading(false);
    }
  };

  // MX Record Verification
  const verifyMX = async () => {
    try {
      setLoading(true);
      setMxRecords([]);

      const response = await axios.post(
        API_BASE_URL + "/api/verify-mx",
        { domain }
      );

      setResult(response.data.message);

      if (response.data.valid) {
        setMxRecords(
          [...response.data.mxRecords].sort(
            (a, b) => a.priority - b.priority
          )
        );
      }

      fetchHistory();
    } catch (error) {
      console.log("MX verification error:", error);
      setResult("Error checking MX records");
      setMxRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete Verification Record
  const deleteRecord = async (id) => {
    try {
      await axios.delete(
        API_BASE_URL + "/api/history/" + id
      );

      setResult("Record deleted successfully!");
      fetchHistory();
    } catch (error) {
      console.log("Delete error:", error);
      setResult("Error deleting record");
    }
  };

  // Delete All Verification History
  const deleteAllHistory = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete all verification records?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await axios.delete(
        API_BASE_URL + "/api/history"
      );

      setResult(response.data.message);
      fetchHistory();
    } catch (error) {
      console.log("Delete history error:", error);
      setResult("Error deleting verification history");
    }
  };

  return (
    <div className="container">
      <h1>Email & Domain Verification System</h1>

      <p className="subtitle">
        Verify email addresses, validate domains, check DNS
        resolution and retrieve MX records.
      </p>

      <h2>Email Verification</h2>

      <button
        className="clear-btn"
        onClick={deleteAllHistory}
      >
        Clear All History
      </button>

      <input
        type="text"
        placeholder="Enter email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={verifyEmail}
        disabled={loading}
      >
        {loading ? "Checking..." : "Verify Email"}
      </button>

      <button
        onClick={verifyDomainDNS}
        disabled={loading}
      >
        Verify Domain Using DNS
      </button>

      <h2>Domain Verification</h2>

      <input
        type="text"
        placeholder="Enter domain name"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      />

      <button
        onClick={verifyDomain}
        disabled={loading}
      >
        Verify Domain
      </button>

      <button
        onClick={verifyMX}
        disabled={loading}
      >
        Verify MX Records
      </button>

      <h3
        style={{
          color: loading
            ? "blue"
            : result.includes("Successfully") ||
              result.includes("Valid")
            ? "green"
            : "red",
          marginTop: "20px"
        }}
      >
        {loading ? "Checking..." : result}
      </h3>

      {regexResult && (
        <p>Regular Expression: {regexResult}</p>
      )}

      {dfaResult && (
        <p>DFA Validation: {dfaResult}</p>
      )}

      {/* MX Records Display */}
      {mxRecords.length > 0 && (
        <div>
          <h2>MX Records</h2>

          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Mail Server</th>
              </tr>
            </thead>

            <tbody>
              {mxRecords.map((record, index) => (
                <tr key={index}>
                  <td>{record.priority}</td>
                  <td>{record.exchange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Verification History</h2>

      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Value</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {history.map((item) => (
            <tr key={item._id}>
              <td>{item.type}</td>
              <td>{item.value}</td>
              <td>{item.valid ? "Valid" : "Invalid"}</td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => deleteRecord(item._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
