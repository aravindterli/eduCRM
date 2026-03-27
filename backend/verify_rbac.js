
const axios = require('axios');

async function test() {
  const BASE_URL = 'http://localhost:5000/api/v1';
  
  console.log('--- RBAC Verification Test ---');

  const users = [
    { email: 'admin@test.com', label: 'Admin', testRoute: '/programs', expected: 200 },
    { email: 'counselor@test.com', label: 'Counselor', testRoute: '/programs', expected: 403 },
    { email: 'counselor@test.com', label: 'Counselor', testRoute: '/leads', expected: 200 },
    { email: 'marketing@test.com', label: 'Marketing', testRoute: '/finance/stats', expected: 403 }
  ];

  for (const user of users) {
    console.log(`\nTesting for ${user.label} (${user.email})...`);
    try {
      // 1. Login
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: user.email,
        password: 'password123'
      });
      const token = loginRes.data.token;
      console.log(`  Login successful. Token acquired.`);

      // 2. Access Route
      try {
        const routeRes = await axios.get(`${BASE_URL}${user.testRoute}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`  Access to ${user.testRoute}: Status ${routeRes.status} (Expected: ${user.expected})`);
        if (routeRes.status !== user.expected) {
           console.error(`  [FAIL] Expected ${user.expected}, got ${routeRes.status}`);
        } else {
           console.log(`  [PASS]`);
        }
      } catch (err) {
        const status = err.response ? err.response.status : 'ERR';
        console.log(`  Access to ${user.testRoute}: Status ${status} (Expected: ${user.expected})`);
        if (status !== user.expected) {
           console.error(`  [FAIL] Expected ${user.expected}, got ${status}`);
           console.error(`  Error message: ${err.response?.data?.message || err.message}`);
        } else {
           console.log(`  [PASS]`);
        }
      }

    } catch (err) {
      console.error(`  [CRITICAL FAIL] Login failed for ${user.email}`);
      console.error(`  Error: ${err.response?.data?.message || err.message}`);
    }
  }
}

test();
