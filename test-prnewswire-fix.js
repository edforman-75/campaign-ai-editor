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
  url: 'https://www.prnewswire.com/news-releases/myers-mermel-announces-his-candidacy-for-us-senate-in-vermont-301556337.html'
});

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Testing fixed frontend with prnewswire.com URL:');
    const result = JSON.parse(responseData);
    console.log('Success:', result.success);
    console.log('URL:', result.url);
    console.log('Title:', result.title);
    console.log('Document Type:', result.documentType);
    console.log('Text Length:', result.textLength);
    console.log('Paragraph breaks found:', (result.text.match(/\n\n/g) || []).length);
    console.log('\n--- First 300 characters ---');
    console.log(result.text.substring(0, 300));
    console.log('\n--- Frontend fixes should now properly display this content ---');
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();