const http = require('http');

console.log('🏛️ Testing 4-Level Taxonomy System v2.0');
console.log('==========================================');

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
    console.log('🌐 Test URL ready:', result.url);
    console.log();

    console.log('🎯 4-Level Campaign Press Release Taxonomy Structure:');
    console.log('====================================================');
    console.log();

    console.log('📋 Level 1: Content Format');
    console.log('  └── Press Release');
    console.log();

    console.log('📋 Level 2: Message Theme');
    console.log('  ├── Announcement');
    console.log('  ├── Endorsement');
    console.log('  ├── Fundraising');
    console.log('  ├── Policy & Issue Position');
    console.log('  ├── Contrast/Attack');
    console.log('  ├── Crisis/Defensive');
    console.log('  ├── Grassroots & Mobilization');
    console.log('  └── General Campaign Operations');
    console.log();

    console.log('📋 Level 3: Content Subtype (examples for Announcement)');
    console.log('  ├── Candidacy');
    console.log('  ├── Ballot Access');
    console.log('  ├── Campaign Operations');
    console.log('  ├── Events');
    console.log('  ├── Milestones');
    console.log('  ├── Narrative / Branding');
    console.log('  └── Election Logistics');
    console.log();

    console.log('📋 Level 4: Sub-Sub-Category (examples for Events)');
    console.log('  ├── Rally');
    console.log('  ├── Town Hall');
    console.log('  ├── Debate');
    console.log('  ├── Campaign Tour');
    console.log('  └── Press Conference');
    console.log();

    console.log('🔄 Dynamic Filtering Features:');
    console.log('===============================');
    console.log('• Level 2 options filter based on Level 1 selection');
    console.log('• Level 3 options filter based on Level 2 selection');
    console.log('• Level 4 options populate dynamically from Level 3 data attributes');
    console.log('• Level 4 is optional - used for ML pattern analysis');
    console.log();

    console.log('🎯 Example Complete Classification:');
    console.log('===================================');
    console.log('Content Format: Press Release');
    console.log('Message Theme: Announcement');
    console.log('Content Subtype: Events');
    console.log('Sub-Sub-Category: Town Hall');
    console.log('🔄 Hierarchy: Press Release → Announcement → Events → Town Hall');
    console.log();

    console.log('💾 Data Storage Structure:');
    console.log('==========================');
    console.log('correctLabel: {');
    console.log('  primaryType: "Press Release",');
    console.log('  subtype: "Announcement",');
    console.log('  subSubtype: "Events",');
    console.log('  subSubCategory: "Town Hall",');
    console.log('  confidence: 100');
    console.log('}');
    console.log();

    console.log('🌐 Training Interface: http://localhost:3003/training-interface.html');
    console.log('📝 Test URL ready to paste:', result.url);
    console.log();
    console.log('🎉 Enhanced 4-level taxonomy system ready for testing!');
    console.log();
    console.log('📋 Testing Instructions:');
    console.log('1. Open the training interface');
    console.log('2. Paste the test URL');
    console.log('3. Select "Press Release" as Content Format');
    console.log('4. Select "Announcement" as Message Theme');
    console.log('5. Select "Events" as Content Subtype');
    console.log('6. Observe dynamic population of sub-sub-categories');
    console.log('7. Select "Town Hall" as Sub-Sub-Category');
    console.log('8. Save correction to test 4-level storage');
    console.log();
    console.log('✨ New features include ML analysis field with detailed subcategories!');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.write(data);
req.end();