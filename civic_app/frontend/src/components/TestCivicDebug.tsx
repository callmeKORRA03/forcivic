// frontend/src/components/TestCivicDebug.tsx

import { useUser } from "@civic/auth/react";

export default function TestCivicDebug() {
  const civic = useUser();

  // Try to show likely tokens
  const tokens = {
    civic_idToken: (civic as any)?.idToken ?? null,
    civic_accessToken: (civic as any)?.accessToken ?? null,
    maybe_user_obj: (civic as any)?.user ?? null,
    localStorageHits: (() => {
      try {
        const found: Record<string, string> = {};
        for (const k of Object.keys(localStorage)) {
          const v = localStorage.getItem(k) ?? "";
          if (v && v.includes("eyJ"))
            found[k] = v.slice(0, 80) + (v.length > 80 ? "…" : "");
        }
        return found;
      } catch (e) {
        return {};
      }
    })(),
  };

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, Arial" }}>
      <h3>Civic SDK debug</h3>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          background: "#f7f7f7",
          padding: 10,
        }}
      >
        {JSON.stringify(tokens, null, 2)}
      </pre>
      <p>Open DevTools Console & Network to watch for POST /auth/civic</p>
    </div>
  );
}
