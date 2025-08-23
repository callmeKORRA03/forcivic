// frontend/src/pages/ReportIssue.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

type Loc = {
  address: string;
  latitude: number | "";
  longitude: number | "";
};

export default function ReportIssue() {
  const { token: authToken } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("Road Infrastructure");
  const [files, setFiles] = useState<FileList | null>(null);
  const [location, setLocation] = useState<Loc>({
    address: "",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(e.target.files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setDebug(null);

    // Basic validation
    if (
      !title ||
      !description ||
      !location.address ||
      !location.latitude ||
      !location.longitude
    ) {
      setMessage(
        "Please fill title, description and location (address + lat/lng)."
      );
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      form.append("issueType", issueType);
      // send location as JSON string
      form.append(
        "location",
        JSON.stringify({
          address: location.address,
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
        })
      );

      if (files && files.length > 0) {
        Array.from(files).forEach((f) => form.append("files", f));
      }

      // Use token from context if available, otherwise fallback to localStorage
      const token = authToken ?? localStorage.getItem("token");
      if (!token) {
        setMessage("No auth token found. Please sign in again.");
        setLoading(false);
        return;
      }

      setDebug(
        `Using token preview: ${token.slice(0, 6)}... (len ${token.length})`
      );

      const res = await fetch(`${API_BASE}/citizen/create-issue`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!res.ok) {
        setMessage(`Server error: ${res.status} - ${JSON.stringify(data)}`);
        setDebug(
          `Request body preview: title=${title}, files=${
            files ? files.length : 0
          }`
        );
        setLoading(false);
        return;
      }

      // success
      setMessage("Issue submitted successfully!");
      setLoading(false);
      // optionally navigate to issues list or dashboard
      navigate("/citizen");
    } catch (err: any) {
      setMessage("Network error sending issue. See console for details.");
      console.error("ReportIssue submit error:", err);
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Report a New Issue</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2"
            rows={5}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Issue Type</label>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full border p-2"
          >
            <option>Road Infrastructure</option>
            <option>Waste Management</option>
            <option>Environmental Issues</option>
            <option>Utilities & Infrastructure</option>
            <option>Public Safety</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Location address</label>
          <input
            value={location.address}
            onChange={(e) =>
              setLocation((s) => ({ ...s, address: e.target.value }))
            }
            className="w-full border p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium">Latitude</label>
            <input
              value={location.latitude}
              onChange={(e) =>
                setLocation((s) => ({
                  ...s,
                  latitude: e.target.value ? Number(e.target.value) : "",
                }))
              }
              className="w-full border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Longitude</label>
            <input
              value={location.longitude}
              onChange={(e) =>
                setLocation((s) => ({
                  ...s,
                  longitude: e.target.value ? Number(e.target.value) : "",
                }))
              }
              className="w-full border p-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Photos / Videos (optional)
          </label>
          <input type="file" multiple onChange={onFilesChange} />
        </div>

        <div>
          <button
            disabled={loading}
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Submitting..." : "Submit Issue"}
          </button>
        </div>

        {message && <div className="mt-4 text-red-600">{message}</div>}
        {debug && <pre className="mt-2 text-xs bg-gray-100 p-2">{debug}</pre>}
      </form>
    </div>
  );
}
