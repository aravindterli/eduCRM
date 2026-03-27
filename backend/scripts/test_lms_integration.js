async function testIt() {
  try {
    const payload = {
      name: 'LMS Student',
      phone: '9876543210',
      email: 'lms@example.com',
      location: 'Online',
      eduBackground: 'B.Tech',
      leadSource: 'External LMS',
    };
    const response = await fetch('http://localhost:5001/api/v1/lms/external', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'default-lms-secret-key'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('Error response:', text);
    } else {
      console.log('Success:', text);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testIt();
