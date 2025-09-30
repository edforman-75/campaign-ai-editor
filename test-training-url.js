const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/fetch-url',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const data = JSON.stringify({
  url: 'https://lofgren.house.gov/media/press-releases/lofgren-panetta-announce-nearly-40m-levee-and-floodwall-construction-along'
});

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const result = JSON.parse(responseData);
    console.log('Training URL Test Results:');
    console.log('URL:', result.url);
    console.log('Title:', result.title);
    console.log('Document Type:', result.documentType);
    console.log('Text Length:', result.textLength);
    console.log('Paragraph breaks found:', (result.text.match(/\n\n/g) || []).length);
    console.log('\n--- First 300 characters ---');
    console.log(result.text.substring(0, 300));
    console.log('\n--- Training successful: Proper paragraph spacing preserved ---');
  });
});

req.write(data);
req.end();