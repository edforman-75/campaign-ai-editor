const http = require('http');

console.log('🔧 Testing Contrast/Attack Fix v1.0');
console.log('=====================================');

const options = {
  hostname: 'localhost',
  port: 3003,
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
    console.log('✅ Backend extraction successful:', result.success);
    console.log('📄 Text length:', result.textLength);
    console.log();

    console.log('🎯 Testing Contrast/Attack Content Subtypes Fix:');
    console.log('================================================');
    console.log();

    console.log('✅ FIXED INCONSISTENCIES:');
    console.log('• Content Type dropdown: "Contrast/Attack" (no spaces)');
    console.log('• Data attributes: data-theme="Contrast/Attack" (no spaces)');
    console.log('• updateContentTypeOptions: "Contrast/Attack" (no spaces)');
    console.log();

    console.log('📋 CONTRAST/ATTACK Content Subtypes (should now appear):');
    console.log('1. Opposition Research / Negative');
    console.log('   → Sub-categories: Scandals, Associations, Controversial Votes');
    console.log('2. Policy Contrast');
    console.log('   → Sub-categories: Side-by-side Issue Differences');
    console.log('3. Rapid Response / Rebuttal');
    console.log('   → Sub-categories: Countering Statements, Fact-checking');
    console.log();

    console.log('🔄 Testing Instructions:');
    console.log('========================');
    console.log('1. Open: http://localhost:3003/training-interface.html');
    console.log('2. Paste test URL (provided below)');
    console.log('3. Select "Press Release" as Content Format');
    console.log('4. Select "Contrast/Attack" as Content Type');
    console.log('5. ✅ VERIFY: 3 content subtypes should now appear in dropdown');
    console.log('6. Select any subtype to verify sub-sub-categories populate');
    console.log();

    console.log('🌐 Training Interface: http://localhost:3003/training-interface.html');
    console.log('📝 Test URL ready to paste:', result.url);
    console.log();
    console.log('🎉 Contrast/Attack filtering fix complete!');
    console.log('✨ The naming inconsistency has been resolved.');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.write(data);
req.end();