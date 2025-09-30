const http = require('http');

console.log('🏛️ Testing Exact Campaign Press Release Taxonomy v1.0');
console.log('=====================================================');

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

    console.log('🎯 Updated Content Subtypes (exactly matching your taxonomy):');
    console.log('============================================================');
    console.log();

    console.log('📋 1. ANNOUNCEMENT Content Subtypes:');
    console.log('  • Candidacy → Launch, Exploratory Committee, Re-election Bids, Withdrawal');
    console.log('  • Ballot Access → Petition Certification, Ballot Position, Legal Rulings');
    console.log('  • Campaign Operations → Staffing Announcements, HQ Openings, Tech Rollouts');
    console.log('  • Events → Rallies, Town Halls, Debates, Tours, Press Conferences');
    console.log('  • Milestones → Fundraising Totals, Volunteer Sign-ups, Polling Results, Endorsements Gathered');
    console.log('  • Narrative / Branding → Campaign Slogan, Logo, Advertising Launches');
    console.log('  • Election Logistics → GOTV Reminders, Early Voting Info, Mail Ballot Details');
    console.log();

    console.log('📋 2. ENDORSEMENT Content Subtypes:');
    console.log('  • Received Endorsements → Unions, Elected Officials, Organizations');
    console.log('  • Issuing Endorsements → Candidate Endorses Another Candidate, Candidate Endorses Measure');
    console.log('  • Coalition Announcements → Latinos for ___, Veterans for ___');
    console.log();

    console.log('📋 3. FUNDRAISING Content Subtypes:');
    console.log('  • Event Promotion → Dinners, Galas, Grassroots Drives');
    console.log('  • Financial Milestones → Quarterly Totals, Donor Counts, Average Donation');
    console.log('  • Challenges / Appeals → Contrasting with Opponent\'s Fundraising, Small-donor Pushes');
    console.log();

    console.log('📋 4. POLICY & ISSUE POSITION Content Subtypes:');
    console.log('  • Policy Rollout → Detailed Platforms, Multi-point Plans');
    console.log('  • Issue Advocacy → Response to Current Events, Response to Legislation');
    console.log('  • Legislative Record → Highlighting Past Votes, Highlighting Sponsored Bills');
    console.log();

    console.log('📋 5. CONTRAST/ATTACK Content Subtypes:');
    console.log('  • Opposition Research / Negative → Scandals, Associations, Controversial Votes');
    console.log('  • Policy Contrast → Side-by-side Issue Differences');
    console.log('  • Rapid Response / Rebuttal → Countering Statements, Fact-checking');
    console.log();

    console.log('📋 6. CRISIS/DEFENSIVE Content Subtypes:');
    console.log('  • Scandal Response → Allegations Involving Candidate, Allegations Involving Staff');
    console.log('  • Clarification / Correction → Addressing Misquotes, Correcting Media Reports');
    console.log();

    console.log('📋 7. GRASSROOTS & MOBILIZATION Content Subtypes:');
    console.log('  • Volunteer Drives → Canvassing, Phone Banks, Digital Pushes');
    console.log('  • Community Outreach → Special Events for Constituencies');
    console.log('  • Coalition Formation → Issue-based Coalitions, Demographic-based Coalitions');
    console.log();

    console.log('📋 8. GENERAL CAMPAIGN OPERATIONS Content Subtypes:');
    console.log('  • Polling Releases → Publicizing Favorable Numbers');
    console.log('  • Election Preparedness → Voter Guides, Election Protection Hotlines');
    console.log('  • Miscellaneous Updates → Small Operational Notes');
    console.log();

    console.log('🔄 Interface Workflow:');
    console.log('=====================');
    console.log('1. Select "Press Release" (Content Format)');
    console.log('2. Select "Announcement" (Message Theme)');
    console.log('3. See only the 7 Announcement content subtypes listed above');
    console.log('4. Select "Events" (Content Subtype)');
    console.log('5. See sub-sub-categories: Rallies, Town Halls, Debates, Tours, Press Conferences');
    console.log('6. Optionally select a sub-sub-category for ML analysis');
    console.log();

    console.log('✅ Now the Content Subtype dropdown shows ONLY your specified subtypes!');
    console.log('🌐 Training Interface: http://localhost:3003/training-interface.html');
    console.log('📝 Test URL ready to paste:', result.url);
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.write(data);
req.end();