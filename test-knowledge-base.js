const http = require('http');

console.log('🧠 Testing Knowledge Base Storage System v2.0');
console.log('===============================================');

// Test 1: Save training data to knowledge base
const testTrainingEntry = {
  url: 'https://lofgren.house.gov/media/press-releases/lofgren-panetta-announce-nearly-40m-levee-and-floodwall-construction-along',
  originalClassification: {
    contentFormat: 'Press Release',
    messageTheme: 'Announcement',
    contentSubtype: 'Funding Announcement'
  },
  correctedClassification: {
    contentFormat: 'Press Release',
    messageTheme: 'Policy & Issue Position',
    contentSubtype: 'Legislative Action'
  },
  text: 'WASHINGTON, D.C. – Congresswoman Zoe Lofgren and Congressman Jimmy Panetta announced that...',
  timestamp: new Date().toISOString(),
  correctionType: 'manual_correction'
};

// Save training entry
const saveOptions = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/training-data',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Session-Id': 'test-session-' + Date.now()
  }
};

const saveData = JSON.stringify(testTrainingEntry);

console.log('📤 Test 1: Saving training entry to knowledge base...');

const saveReq = http.request(saveOptions, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const result = JSON.parse(responseData);
    console.log('✅ Save result:', result.success ? 'SUCCESS' : 'FAILED');
    if (result.success) {
      console.log('📝 Entry ID:', result.entryId);
      console.log('📊 Total entries:', result.totalEntries);
    } else {
      console.log('❌ Error:', result.error);
    }

    // Test 2: Retrieve training data
    setTimeout(testRetrieveData, 500);
  });
});

saveReq.on('error', (error) => {
  console.error('❌ Save error:', error.message);
});

saveReq.write(saveData);
saveReq.end();

// Test 2: Retrieve training data
function testRetrieveData() {
  console.log('\n📥 Test 2: Retrieving training data from knowledge base...');

  const retrieveOptions = {
    hostname: 'localhost',
    port: 3003,
    path: '/api/training-data',
    method: 'GET'
  };

  const retrieveReq = http.request(retrieveOptions, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      const result = JSON.parse(responseData);
      console.log('✅ Retrieve result:', result.success ? 'SUCCESS' : 'FAILED');
      if (result.success) {
        const entries = result.data?.entries || [];
        console.log('📊 Total entries:', entries.length);
        console.log('🕐 Oldest entry:', entries.length > 0 ? new Date(entries[0].timestamp).toLocaleDateString() : 'None');
        console.log('🕑 Newest entry:', entries.length > 0 ? new Date(entries[entries.length - 1].timestamp).toLocaleDateString() : 'None');
      }

      // Test 3: Get analytics
      setTimeout(testAnalytics, 500);
    });
  });

  retrieveReq.on('error', (error) => {
    console.error('❌ Retrieve error:', error.message);
  });

  retrieveReq.end();
}

// Test 3: Get analytics
function testAnalytics() {
  console.log('\n📈 Test 3: Getting knowledge base analytics...');

  const analyticsOptions = {
    hostname: 'localhost',
    port: 3003,
    path: '/api/training-analytics',
    method: 'GET'
  };

  const analyticsReq = http.request(analyticsOptions, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      const result = JSON.parse(responseData);
      console.log('✅ Analytics result:', result.success ? 'SUCCESS' : 'FAILED');
      if (result.success && result.analytics) {
        console.log('📊 Analytics summary:');
        console.log('  • Total entries:', result.analytics.totalEntries);
        console.log('  • Manual corrections:', result.analytics.manualCorrections);
        console.log('  • Confirmed correct:', result.analytics.confirmedCorrect);
        console.log('  • Unique sessions:', result.analytics.uniqueSessions);
        console.log('  • Date range:', result.analytics.dateRange ? `${result.analytics.dateRange.oldest} - ${result.analytics.dateRange.newest}` : 'N/A');

        if (result.analytics.contentTypeAccuracy) {
          console.log('🎯 Content type accuracy:');
          Object.entries(result.analytics.contentTypeAccuracy).forEach(([type, stats]) => {
            console.log(`  • ${type}: ${stats.accuracy}% (${stats.correct}/${stats.total})`);
          });
        }

        if (result.analytics.correctionPatterns && Object.keys(result.analytics.correctionPatterns).length > 0) {
          console.log('🔄 Common correction patterns:');
          Object.entries(result.analytics.correctionPatterns).forEach(([pattern, count]) => {
            console.log(`  • ${pattern}: ${count} times`);
          });
        }
      }

      console.log('\n🎉 Knowledge base system test complete!');
      console.log('🌐 Training interface: http://localhost:3003/training-interface.html');
      console.log('💾 Training data persists across sessions');
      console.log('📈 Analytics provide insights for model improvement');
    });
  });

  analyticsReq.on('error', (error) => {
    console.error('❌ Analytics error:', error.message);
  });

  analyticsReq.end();
}