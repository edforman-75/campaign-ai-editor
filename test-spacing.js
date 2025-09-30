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
  url: 'https://lofgren.house.gov/media/press-releases/lofgren-joins-panetta-introducing-legislation-launch-national-heritage-area'
});

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const result = JSON.parse(responseData);
    console.log('Testing paragraph spacing in extracted text:');
    console.log('Text length:', result.textLength);
    console.log('\n--- First 500 characters with newlines visible ---');
    console.log(JSON.stringify(result.text.substring(0, 500), null, 2));
    console.log('\n--- First 500 characters as displayed ---');
    console.log(result.text.substring(0, 500));

    // Count paragraph breaks
    const paragraphBreaks = (result.text.match(/\n\n/g) || []).length;
    console.log('\n--- Paragraph Analysis ---');
    console.log('Double newlines (paragraph breaks):', paragraphBreaks);
    console.log('Single newlines:', (result.text.match(/\n/g) || []).length);
  });
});

req.write(data);
req.end();