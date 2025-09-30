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
    console.log('Full API response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n---\nJust the text:');
    console.log(result.text);
    console.log('\n---\nText length:', result.textLength);
  });
});

req.write(data);
req.end();