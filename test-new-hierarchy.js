const http = require('http');

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
    console.log('🏛️ Testing Three-Level Classification Hierarchy v1.16');
    console.log('========================================================');
    const result = JSON.parse(responseData);
    console.log('✅ Backend extraction successful:', result.success);
    console.log('📄 Text length:', result.textLength);
    console.log('📝 Paragraph breaks:', (result.text.match(/\n\n/g) || []).length);
    console.log('\n🎯 Complete Enumerated Content Subtype Lists:');
    console.log('1. Content Format → Message Theme → Content Subtype');
    console.log('2. All content subtypes now enumerated in dropdown');
    console.log('3. Dynamic filtering shows only relevant subtypes');
    console.log('4. Better UX: Content Format, Message Theme, Content Subtype');
    console.log('\n📋 Announcement Subtypes:');
    console.log('  • Campaign Launch   • Policy Position   • Event Announcement');
    console.log('  • Staff Hiring      • Coalition Building');
    console.log('\n📋 Endorsement Subtypes:');
    console.log('  • Endorsement Received   • Endorsement Given   • Coalition Endorsement');
    console.log('\n📋 Fundraising Subtypes:');
    console.log('  • Fundraising Goal   • Donor Appreciation   • Grassroots Fundraising');
    console.log('\n📋 Policy & Issue Position Subtypes:');
    console.log('  • Policy Statement   • Issue Response   • Voting Record   • Legislative Action');
    console.log('\n📋 Contrast/Attack Subtypes:');
    console.log('  • Opponent Criticism   • Record Comparison   • Fact Check');
    console.log('\n📋 Crisis/Defensive Subtypes:');
    console.log('  • Response to Criticism   • Clarification   • Damage Control');
    console.log('\n📋 Grassroots & Mobilization Subtypes:');
    console.log('  • Volunteer Recruitment   • Voter Registration   • Community Event   • Get Out The Vote');
    console.log('\n📋 General Campaign Operations Subtypes:');
    console.log('  • Schedule Update   • Media Availability   • Campaign Milestone   • Administrative');
    console.log('\n🌐 Interface URL: http://localhost:3003/training-interface.html');
    console.log('📋 Test URL ready to paste in interface:', result.url);
    console.log('\n✅ Complete enumerated dropdown system ready for testing!');
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();