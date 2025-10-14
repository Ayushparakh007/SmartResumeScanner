import { getAllCandidates, getCandidateById } from '../db/candidateService';
import { closePool } from '../db/config';

/**
 * View all candidates in the database
 */
async function viewAllCandidates() {
  try {
    console.log('📋 Fetching all candidates...\n');
    
    const candidates = await getAllCandidates(100, 0);
    
    if (candidates.length === 0) {
      console.log('❌ No candidates found in database.');
      console.log('   Upload some resumes first!\n');
      return;
    }
    
    console.log(`✅ Found ${candidates.length} candidate(s):\n`);
    console.log('='.repeat(80));
    
    for (const candidate of candidates) {
      console.log(`\n👤 ID: ${candidate.id}`);
      console.log(`   Name: ${candidate.name}`);
      console.log(`   Email: ${candidate.email || 'N/A'}`);
      console.log(`   Phone: ${candidate.phone || 'N/A'}`);
      console.log(`   Skills: ${candidate.skills.length > 0 ? candidate.skills.join(', ') : 'None listed'}`);
      console.log(`   Resume Preview: ${candidate.resumeText.substring(0, 100)}...`);
      console.log('-'.repeat(80));
    }
    
    console.log('\n💡 Tip: To see full details of a candidate, run:');
    console.log('   npm run view-candidate <candidate-id>\n');
    
  } catch (error) {
    console.error('❌ Error fetching candidates:', error);
  } finally {
    await closePool();
  }
}

/**
 * View detailed information for a specific candidate
 */
async function viewCandidateDetails(candidateId: string) {
  try {
    console.log(`🔍 Fetching candidate: ${candidateId}\n`);
    
    const candidate = await getCandidateById(candidateId);
    
    if (!candidate) {
      console.log('❌ Candidate not found.\n');
      return;
    }
    
    console.log('='.repeat(80));
    console.log(`\n👤 CANDIDATE DETAILS\n`);
    console.log(`ID: ${candidate.id}`);
    console.log(`Name: ${candidate.name}`);
    console.log(`Email: ${candidate.email || 'N/A'}`);
    console.log(`Phone: ${candidate.phone || 'N/A'}`);
    console.log(`\n📚 Skills (${candidate.skills.length}):`);
    candidate.skills.forEach(skill => console.log(`  • ${skill}`));
    
    console.log(`\n💼 Experience (${candidate.experience.length}):`);
    candidate.experience.forEach((exp, i) => {
      console.log(`\n  ${i + 1}. ${exp.title} at ${exp.company}`);
      console.log(`     ${exp.start} - ${exp.end}`);
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => console.log(`     • ${bullet}`));
      }
    });
    
    console.log(`\n🎓 Education (${candidate.education.length}):`);
    candidate.education.forEach((edu, i) => {
      console.log(`\n  ${i + 1}. ${edu.degree} in ${edu.field}`);
      console.log(`     ${edu.school}`);
      console.log(`     ${edu.start} - ${edu.end}`);
    });
    
    console.log(`\n📄 Resume Text (${candidate.resumeText.length} characters):`);
    console.log(`${candidate.resumeText.substring(0, 500)}...`);
    
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error fetching candidate:', error);
  } finally {
    await closePool();
  }
}

// CLI handler
const args = process.argv.slice(2);
const command = args[0];

if (command) {
  // View specific candidate
  viewCandidateDetails(command);
} else {
  // View all candidates
  viewAllCandidates();
}
