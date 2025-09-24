import React, { useState } from "react";
import axios from "axios";

function App() {
  const [result, setResult] = useState("");
  const handlePing = async () => {
    try {
      const res = await axios.get("/api/user/users/ping");
      setResult(JSON.stringify(res.data));
    } catch (err) {
      setResult("Error: " + err.message);
    }
  };
  return (
    <div>
      <h1>Expense Tracker Frontend</h1>
      <button onClick={handlePing}>Ping User Service</button>
      <pre>{result}</pre>
    </div>
  );
}

export default App;