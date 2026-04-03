async function validate() {
    console.log("=== DEV OPS VALIDATION ===");

    // 1. Auth Service via Gateway
    try {
        console.log("Testing POST /auth/login...");
        const res1 = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: "admin", password: "password123" }) // mock bad login
        });
        console.log(`[Auth]: HTTP ${res1.status} | Data: ${JSON.stringify(await res1.json())}`);
    } catch(e) { console.error(e.message); }

    // 2. Parking Service GET via Gateway
    try {
        console.log("Testing GET /parking...");
        const res2 = await fetch('http://localhost:3000/parking');
        console.log(`[Parking]: HTTP ${res2.status} | Returned ${((await res2.json()) || []).length} items`);
    } catch(e) { console.error(e.message); }

    // 3. Parking Service PUT via Gateway (Need mock auth, but it might fail auth cleanly)
    // Actually, update needs 'Authorization: Bearer <token>'? In frontend app.js it passes token.
    // Let's just try to update status. It will probably fail because of invalid status or lack of auth.
    try {
        console.log("Testing PUT /parking/update/1...");
        const res3 = await fetch('http://localhost:3000/parking/update/1', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "Occupied" })
        });
        console.log(`[Parking Update]: HTTP ${res3.status} | Data: ${JSON.stringify(await res3.json())}`);
    } catch(e) { console.error(e.message); }

    // 4. Notification Service Internal Notify via Gateway
    // Note: Internal notify should not necessarily be exposed to the public Gateway, but we proxied `/notification` fully
    try {
        console.log("Testing POST /notification/internal/notify...");
        const res4 = await fetch('http://localhost:3000/notification/internal/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'test' })
        });
        console.log(`[Notification Post]: HTTP ${res4.status} | Data: ${JSON.stringify(await res4.json())}`);
    } catch(e) { console.error(e.message); }
}

validate();
