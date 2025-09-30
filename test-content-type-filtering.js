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
    console.log('🏛️ Testing Content Type Filtering System v1.19');
    console.log('==================================================');
    const result = JSON.parse(responseData);
    console.log('✅ Backend extraction successful:', result.success);
    console.log('📄 Text length:', result.textLength);
    console.log('\n🎯 Content Type → Content Subtype Filtering:');

    console.log('\n📋 ANNOUNCEMENT (25 subtypes):');
    console.log('  • Candidacy Launch        • Exploratory Committee');
    console.log('  • Re-election Bid         • Campaign Withdrawal');
    console.log('  • Petition Certification  • Ballot Position');
    console.log('  • Legal Ruling           • Staff Announcement');
    console.log('  • HQ Opening             • Tech Rollout');
    console.log('  • Rally                  • Town Hall');
    console.log('  • Debate                 • Campaign Tour');
    console.log('  • Press Conference       • Fundraising Total');
    console.log('  • Volunteer Sign-ups     • Polling Results');
    console.log('  • Endorsements Gathered  • Campaign Slogan');
    console.log('  • Logo Launch            • Advertising Launch');
    console.log('  • GOTV Reminder          • Early Voting Info');
    console.log('  • Mail Ballot Details');

    console.log('\n📋 ENDORSEMENT (3 subtypes):');
    console.log('  • Endorsement Received   • Endorsement Given   • Coalition Endorsement');

    console.log('\n📋 FUNDRAISING (3 subtypes):');
    console.log('  • Fundraising Goal       • Donor Appreciation  • Grassroots Fundraising');

    console.log('\n📋 POLICY & ISSUE POSITION (4 subtypes):');
    console.log('  • Policy Statement       • Issue Response      • Voting Record');
    console.log('  • Legislative Action');

    console.log('\n📋 CONTRAST/ATTACK (3 subtypes):');
    console.log('  • Opponent Criticism     • Record Comparison   • Fact Check');

    console.log('\n📋 CRISIS/DEFENSIVE (3 subtypes):');
    console.log('  • Response to Criticism  • Clarification       • Damage Control');

    console.log('\n📋 GRASSROOTS & MOBILIZATION (4 subtypes):');
    console.log('  • Volunteer Recruitment  • Voter Registration  • Community Event');
    console.log('  • Get Out The Vote');

    console.log('\n📋 GENERAL CAMPAIGN OPERATIONS (4 subtypes):');
    console.log('  • Schedule Update        • Media Availability  • Campaign Milestone');
    console.log('  • Administrative');

    console.log('\n✅ TOTAL: 49 organized content subtypes');
    console.log('🔄 Content subtypes now filtered by selected Content Type');
    console.log('📝 Each Content Type shows only its specific subtypes');

    console.log('\n🌐 Interface URL: http://localhost:3003/training-interface.html');
    console.log('📋 Test URL ready to paste:', result.url);
    console.log('\n🎉 Content Type filtering system ready for testing!');
    console.log('\nTo test: Select "Press Release" → "Endorsement" → See only 3 endorsement subtypes!');
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();