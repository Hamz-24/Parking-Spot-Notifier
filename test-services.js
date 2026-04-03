async function test() {
    console.log("Testing Microservices...");

    // Test Parking Service (Port 3002 Proxied to 3000)
    try {
        const res = await fetch('http://localhost:3000/parking');
        const data = await res.json();
        console.log(`[API Gateway] /parking: HTTP ${res.status} | returned ${data.length} spots`);
    } catch (e) {
         console.log(`[API Gateway] Error:`, e.cause?.message || e.message);
    }

    // Test User Service (Port 3001 Proxied to 3000)
    try {
        const res = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: "a", password: "b" })
        });
        const data = await res.json();
        console.log(`[API Gateway] /auth/login: HTTP ${res.status} | res: ${JSON.stringify(data)}`);
    } catch (e) {
         console.log(`[API Gateway] Error:`, e.cause?.message || e.message);
    }

    // Test Notification Service (Port 3003) Wait... SSE
    try {
        const res = await fetch('http://localhost:3003/notification/stream');
        console.log(`[3003] /notification/stream: HTTP ${res.status} | Content-Type: ${res.headers.get('content-type')}`);
        // don't read body to avoid hanging
    } catch (e) {
         console.log(`[3003] Error:`, e.cause?.message || e.message);
    }

    process.exit(0);
}
test();
