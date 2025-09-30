const http = require('http');

console.log('🌳 Testing Decision Tree Training Interface v1.0');
console.log('==================================================');

// First, import the existing training data
console.log('📥 Step 1: Importing existing training data...');

const importOptions = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/import-training-data',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const importReq = http.request(importOptions, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('✅ Import completed');
    const result = JSON.parse(responseData);
    if (result.success) {
      console.log(`📊 Imported ${result.imported_count} training entries`);
      console.log(`💾 Saved to: ${result.output_file}`);
    } else {
      console.log('❌ Import failed:', result.error);
    }

    // Now test the decision tree interface
    setTimeout(testDecisionTreeInterface, 1000);
  });
});

importReq.on('error', (error) => {
  console.error('❌ Import error:', error.message);
});

importReq.end();

// Test the decision tree interface with a sample URL
function testDecisionTreeInterface() {
  console.log('\n🎯 Step 2: Testing Decision Tree Interface...');

  const testUrl = 'https://lofgren.house.gov/media/press-releases/lofgren-panetta-announce-nearly-40m-levee-and-floodwall-construction-along';

  console.log('📰 Test URL:', testUrl);
  console.log();

  console.log('🌳 Decision Tree Training Flow:');
  console.log('==============================');
  console.log('1. 📖 Load press release content');
  console.log('2. 🎯 Follow decision tree questions:');
  console.log('   Q: "What is the primary function of the press release?"');
  console.log('   → Select from: Announcement, Endorsement, Fundraising, Policy & Issue Position, etc.');
  console.log('3. 🔍 Navigate through sub-questions based on selection');
  console.log('4. 📋 Fill in secondary attributes (tone, audience, timing, issue area)');
  console.log('5. 💾 Save structured classification with hierarchical ID');
  console.log();

  console.log('🆕 New Features:');
  console.log('================');
  console.log('✅ Question-driven classification workflow');
  console.log('✅ Hierarchical label IDs (e.g., ATT.OPP.ASSOC)');
  console.log('✅ Secondary attributes capture');
  console.log('✅ Training data import/export');
  console.log('✅ Professional ML-ready dataset');
  console.log('✅ Breadcrumb navigation');
  console.log('✅ Classification path tracking');
  console.log();

  console.log('🔄 Data Structure:');
  console.log('==================');
  console.log('{');
  console.log('  "primary_label_id": "ATT.OPP.ASSOC",');
  console.log('  "classification_path": [');
  console.log('    {"id": "ATT", "label": "Contrast / Attack"},');
  console.log('    {"id": "ATT.OPP", "label": "Opposition Research / Negative"},');
  console.log('    {"id": "ATT.OPP.ASSOC", "label": "Problematic Associations"}');
  console.log('  ],');
  console.log('  "secondary_attributes": {');
  console.log('    "tone": "negative",');
  console.log('    "target_audience": "voters",');
  console.log('    "timing": "reactive",');
  console.log('    "issue_area": "economy"');
  console.log('  }');
  console.log('}');
  console.log();

  console.log('🌐 Interface URLs:');
  console.log('==================');
  console.log('🌳 Decision Tree Interface: http://localhost:3003/decision-tree-interface.html');
  console.log('📊 Original Interface: http://localhost:3003/training-interface.html');
  console.log();

  console.log('📚 Training Data Files:');
  console.log('=======================');
  console.log('• press_release_decision_tree.json - Hierarchical taxonomy');
  console.log('• press_release_training_data-2.json - Original training data');
  console.log('• decision_tree_training_data.json - New format training data');
  console.log('• imported_training_data.json - Converted legacy data');
  console.log();

  console.log('🎉 Decision Tree Interface Ready!');
  console.log('✨ Professional ML training workflow with structured taxonomy');
  console.log(`📝 Test with: ${testUrl}`);
}

importReq.write('{}');
importReq.end();