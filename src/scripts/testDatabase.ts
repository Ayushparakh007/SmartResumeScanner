/**
 * Test database connectivity and verify data persistence
 */
import dotenv from 'dotenv';
import { testConnection, query } from '../db/config';
import { createCandidate } from '../db/candidateService';
import { createJobDescription, createScore } from '../db/jobService';

dotenv.config();

async function testDatabase() {
  console.log('🔍 Testing Database Connectivity and Data Persistence\n');
  
  // Test 1: Connection
  console.log('Test 1: Database Connection');
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Database connection failed!');
    console.log('\nPlease check:');
    console.log('- Environment variables (DB_HOST, DB_USER, DB_PASSWORD, etc.)');
    console.log('- Network connectivity to Render database');
    console.log('- Database credentials are correct');
    process.exit(1);
  }
  console.log('✅ Database connected successfully\n');
  
  // Test 2: Check Tables
  console.log('Test 2: Verify Tables Exist');
  try {
    const tables = ['candidates', 'experience', 'education', 'job_descriptions', 'scores'];
    
    for (const tableName of tables) {
      const result = await query(
        `SELECT COUNT(*) FROM ${tableName}`
      );
      console.log(`  ✅ ${tableName}: ${result.rows[0].count} rows`);
    }
    console.log('');
  } catch (error: any) {
    console.error('❌ Table check failed:', error.message);
    console.log('\nRun: npm run db:migrate\n');
    process.exit(1);
  }
  
  // Test 3: Test Experience Persistence
  console.log('Test 3: Testing Experience Records');
  try {
    const testCandidate = {
      name: 'Test Candidate (DELETE ME)',
      email: 'test@example.com',
      phone: '555-0000',
      resumeText: 'Test resume text',
      skills: ['JavaScript', 'TypeScript'],
      experience: [],
      education: []
    };
    
    const testExperience = [
      {
        company: 'Test Company',
        title: 'Software Engineer',
        start: 'Jan 2020',
        end: 'Present',
        bullets: ['Built test features', 'Fixed test bugs']
      }
    ];
    
    const candidateId = await createCandidate(testCandidate, testExperience, []);
    console.log(`  ✅ Created test candidate: ${candidateId}`);
    
    // Verify experience was saved
    const expResult = await query(
      'SELECT COUNT(*) FROM experience WHERE candidate_id = $1',
      [candidateId]
    );
    const expCount = parseInt(expResult.rows[0].count);
    
    if (expCount > 0) {
      console.log(`  ✅ Experience records saved: ${expCount} records`);
    } else {
      console.log('  ❌ Experience records NOT saved!');
    }
    
    // Clean up
    await query('DELETE FROM candidates WHERE id = $1', [candidateId]);
    console.log('  ✅ Test data cleaned up\n');
    
  } catch (error: any) {
    console.error('  ❌ Experience test failed:', error.message);
    console.log('');
  }
  
  // Test 4: Test Job Description Persistence
  console.log('Test 4: Testing Job Descriptions');
  try {
    const jobId = await createJobDescription(
      'Test Job (DELETE ME)',
      'This is a test job description',
      ['JavaScript', 'Node.js']
    );
    console.log(`  ✅ Created test job description: ${jobId}`);
    
    // Verify it exists
    const jobResult = await query(
      'SELECT * FROM job_descriptions WHERE id = $1',
      [jobId]
    );
    
    if (jobResult.rows.length > 0) {
      console.log('  ✅ Job description saved successfully');
    } else {
      console.log('  ❌ Job description NOT saved!');
    }
    
    // Clean up
    await query('DELETE FROM job_descriptions WHERE id = $1', [jobId]);
    console.log('  ✅ Test data cleaned up\n');
    
  } catch (error: any) {
    console.error('  ❌ Job description test failed:', error.message);
    console.log('');
  }
  
  // Test 5: Test Scores Persistence
  console.log('Test 5: Testing Score Records');
  try {
    // Create test candidate and job
    const candidateId = await createCandidate({
      name: 'Test Candidate 2 (DELETE ME)',
      email: 'test2@example.com',
      phone: '555-0001',
      resumeText: 'Test resume',
      skills: ['Python'],
      experience: [],
      education: []
    }, [], []);
    
    const jobId = await createJobDescription(
      'Test Job 2 (DELETE ME)',
      'Test job',
      ['Python']
    );
    
    // Create score
    const scoreId = await createScore(candidateId, jobId, {
      score: 8.5,
      justification: 'Test justification',
      matchedSkills: ['Python'],
      missingSkills: ['Java'],
      risks: ['No risks']
    });
    
    console.log(`  ✅ Created test score: ${scoreId}`);
    
    // Verify it exists
    const scoreResult = await query(
      'SELECT * FROM scores WHERE id = $1',
      [scoreId]
    );
    
    if (scoreResult.rows.length > 0) {
      console.log('  ✅ Score saved successfully');
      console.log(`  📊 Score value: ${scoreResult.rows[0].score}/10`);
    } else {
      console.log('  ❌ Score NOT saved!');
    }
    
    // Clean up
    await query('DELETE FROM candidates WHERE id = $1', [candidateId]);
    await query('DELETE FROM job_descriptions WHERE id = $1', [jobId]);
    console.log('  ✅ Test data cleaned up\n');
    
  } catch (error: any) {
    console.error('  ❌ Score test failed:', error.message);
    console.log('');
  }
  
  // Test 6: Check Real Data
  console.log('Test 6: Current Database State');
  try {
    const candidateCount = await query('SELECT COUNT(*) FROM candidates');
    const jobCount = await query('SELECT COUNT(*) FROM job_descriptions');
    const scoreCount = await query('SELECT COUNT(*) FROM scores');
    const expCount = await query('SELECT COUNT(*) FROM experience');
    
    console.log('  Current Records:');
    console.log(`    - Candidates: ${candidateCount.rows[0].count}`);
    console.log(`    - Experience: ${expCount.rows[0].count}`);
    console.log(`    - Job Descriptions: ${jobCount.rows[0].count}`);
    console.log(`    - Scores: ${scoreCount.rows[0].count}`);
    console.log('');
    
    // Show sample data
    if (parseInt(candidateCount.rows[0].count) > 0) {
      const candidates = await query(
        'SELECT id, name, email, created_at FROM candidates ORDER BY created_at DESC LIMIT 3'
      );
      console.log('  Recent Candidates:');
      candidates.rows.forEach(c => {
        console.log(`    - ${c.name} (${c.email}) - ${c.created_at}`);
      });
      console.log('');
    }
    
    if (parseInt(jobCount.rows[0].count) > 0) {
      const jobs = await query(
        'SELECT id, title, created_at FROM job_descriptions ORDER BY created_at DESC LIMIT 3'
      );
      console.log('  Recent Job Descriptions:');
      jobs.rows.forEach(j => {
        console.log(`    - ${j.title} - ${j.created_at}`);
      });
      console.log('');
    }
    
    if (parseInt(scoreCount.rows[0].count) > 0) {
      const scores = await query(
        'SELECT * FROM recent_scores LIMIT 5'
      );
      console.log('  Recent Scores:');
      scores.rows.forEach(s => {
        console.log(`    - ${s.candidate_name} for ${s.job_title}: ${s.score}/10`);
      });
      console.log('');
    }
    
  } catch (error: any) {
    console.error('  ❌ Failed to check current data:', error.message);
  }
  
  console.log('✅ All tests completed!\n');
  process.exit(0);
}

// Run tests
testDatabase().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
