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
    console.log('Testing improved editing functionality:');
    const result = JSON.parse(responseData);
    console.log('✅ Backend extraction successful:', result.success);
    console.log('📄 Text length:', result.textLength);
    console.log('📝 Paragraph breaks:', (result.text.match(/\n\n/g) || []).length);
    console.log('\n🎯 New editing features to test:');
    console.log('1. Click anywhere in Press Release Text area to enter edit mode');
    console.log('2. Select text with mouse drag or Ctrl+A');
    console.log('3. Press Delete or Backspace to remove selected text');
    console.log('4. Click outside the text area to auto-save changes');
    console.log('\n🌐 Open: http://localhost:3001/training-interface.html');
    console.log('📋 Test URL ready to paste:', result.url);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();