const engineUrl = process.env.ENGINE_URL ?? "http://localhost:8787";

async function main(): Promise<void> {
  const response = await fetch(`${engineUrl}/ingest`, { method: "POST" });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ingest failed (${response.status}): ${text}`);
  }

  const body = await response.json();
  console.log(JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
