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
    console.log('Text with newlines visible:');
    console.log(JSON.stringify(result.text, null, 2));
    console.log('\n---\nActual text:');
    console.log(result.text);
  });
});

req.write(data);
req.end();