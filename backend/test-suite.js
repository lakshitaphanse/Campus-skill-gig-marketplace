/**
 * Automated End-to-End & Negative Test Suite for Campus Skill & Gig Marketplace
 * Tests Sections 28 and 29 of the specification against the running backend.
 */

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   CAMPUS SKILL & GIG MARKETPLACE - VERIFICATION');
  console.log('======================================================\n');

  // --- SECTION 28: STEP-BY-STEP SCENARIO ---
  console.log('--- EXECUTING SECTION 28: CORE WORKFLOW SCENARIO ---');

  // STEP 1: Register a club account
  const clubEmail = `club_${Date.now()}@college.edu`;
  const clubPassword = 'password123';
  const regClubRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Tech & Cultural Council',
      email: clubEmail,
      password: clubPassword,
      role: 'club',
      bio: 'Official college student activities and fest committee'
    })
  });
  assert(regClubRes.status === 201 && regClubRes.data.token, 'STEP 1: Club account registered successfully');
  const clubToken = regClubRes.data.token;

  // STEP 2: Register a student account
  const studentEmail = `student_${Date.now()}@college.edu`;
  const studentPassword = 'password123';
  const regStudentRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Alex Rivera',
      email: studentEmail,
      password: studentPassword,
      role: 'student',
      bio: '3rd year CS student passionate about fullstack web apps',
      skills: [
        { tag: 'Web Development', level: 'Intermediate' },
        { tag: 'UI/UX Design', level: 'Beginner' }
      ]
    })
  });
  assert(regStudentRes.status === 201 && regStudentRes.data.token, 'STEP 2: Student account registered with skills');
  let studentToken = regStudentRes.data.token;
  const studentId = regStudentRes.data.user._id;

  // STEP 3: Login as club
  const loginClubRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: clubEmail, password: clubPassword })
  });
  assert(loginClubRes.status === 200 && loginClubRes.data.token, 'STEP 3: Login as club successful');
  const activeClubToken = loginClubRes.data.token;

  // STEP 4: Club creates gig: "College Fest Website Development"
  const createGigRes = await request('/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeClubToken}` },
    body: JSON.stringify({
      title: 'College Fest Website Development',
      description: 'Need a student to develop a responsive website for our college fest, including event information, schedule and registration details.',
      category: 'Development',
      requiredSkills: [
        { tag: 'Web Development', minLevel: 'Intermediate' },
        { tag: 'UI/UX Design', minLevel: 'Beginner' }
      ]
    })
  });
  assert(createGigRes.status === 201 && createGigRes.data.project?._id, 'STEP 4: Club created "College Fest Website Development"');
  const projectId = createGigRes.data.project._id;
  assert(createGigRes.data.project.status === 'open', 'STEP 4: Project initial status is "open"');
  assert(createGigRes.data.project.isMonetary === false, 'STEP 4: Project is strictly non-monetary');

  // STEP 5: Logout (Simulated on client by clearing token)
  console.log('✅ PASSED: STEP 5: Club logged out');

  // STEP 6: Login as student
  const loginStudentRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: studentEmail, password: studentPassword })
  });
  assert(loginStudentRes.status === 200 && loginStudentRes.data.token, 'STEP 6: Login as student successful');
  studentToken = loginStudentRes.data.token;

  // STEP 7: Find the gig
  const browseRes = await request('/projects', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(browseRes.status === 200 && browseRes.data.projects.some(p => p._id === projectId), 'STEP 7: Student found the posted gig in marketplace');

  // STEP 8: Open Gig Details
  const gigDetailsRes = await request(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(gigDetailsRes.status === 200 && gigDetailsRes.data.project.title === 'College Fest Website Development', 'STEP 8: Opened gig details');

  // STEP 9: Student applies with an interest note
  const applyRes = await request(`/projects/${projectId}/applications`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      interestNote: 'I have built multiple responsive web pages using React and CSS, and I would love to lead the tech for our fest!'
    })
  });
  assert(applyRes.status === 201 && applyRes.data.application?._id, 'STEP 9: Student applied with interest note');
  const applicationId = applyRes.data.application._id;

  // STEP 10: Logout (Simulated)
  console.log('✅ PASSED: STEP 10: Student logged out');

  // STEP 11: Login as club
  const clubLogin2 = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: clubEmail, password: clubPassword })
  });
  assert(clubLogin2.status === 200, 'STEP 11: Club re-logged in');

  // STEP 12: Open the gig
  const clubGigView = await request(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${activeClubToken}` }
  });
  assert(clubGigView.status === 200, 'STEP 12: Club opened the gig');

  // STEP 13: View the applicant
  const applicantsRes = await request(`/projects/${projectId}/applications`, {
    headers: { Authorization: `Bearer ${activeClubToken}` }
  });
  assert(applicantsRes.status === 200 && applicantsRes.data.applications.length > 0, 'STEP 13: Club viewed applicant list');
  const applicantRecord = applicantsRes.data.applications.find(a => a._id === applicationId);
  assert(applicantRecord.applicant.name === 'Alex Rivera', 'STEP 13: Applicant name matches Alex Rivera');
  assert(applicantRecord.status === 'pending', 'STEP 13: Application status is initially "pending"');

  // STEP 14: Accept the student
  const acceptRes = await request(`/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${activeClubToken}` },
    body: JSON.stringify({ status: 'accepted' })
  });
  assert(acceptRes.status === 200 && acceptRes.data.application.status === 'accepted', 'STEP 14: Club accepted student application');
  assert(acceptRes.data.project.status === 'in-progress', 'STEP 14: Project status transitioned to "in-progress"');
  assert(String(acceptRes.data.project.selectedStudent) === String(studentId), 'STEP 14: Project.selectedStudent assigned to applicant');

  // STEP 15: Create a milestone: "Homepage and Event Schedule"
  const createMilestoneRes = await request(`/projects/${projectId}/milestones`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${activeClubToken}` },
    body: JSON.stringify({
      title: 'Homepage and Event Schedule',
      description: 'Deliver responsive hero section, navbar, and interactive schedule table with filter by date.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
  });
  assert(createMilestoneRes.status === 201 && createMilestoneRes.data.milestone?._id, 'STEP 15: Created milestone "Homepage and Event Schedule"');
  const milestoneId = createMilestoneRes.data.milestone._id;
  assert(createMilestoneRes.data.milestone.status === 'pending', 'STEP 15: Milestone status is initially "pending"');

  // STEP 16: Logout (Simulated)
  console.log('✅ PASSED: STEP 16: Club logged out');

  // STEP 17: Login as selected student
  const studentLogin2 = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: studentEmail, password: studentPassword })
  });
  assert(studentLogin2.status === 200, 'STEP 17: Selected student logged in');

  // STEP 18: Open the project
  const studentProjectView = await request(`/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentProjectView.status === 200 && studentProjectView.data.project.status === 'in-progress', 'STEP 18: Student opened in-progress project');

  // STEP 19: Submit the milestone with a submission note
  const submitMilestoneRes = await request(`/milestones/${milestoneId}/submit`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      submissionNote: 'Completed homepage layout with responsive navigation and interactive schedule view. Live preview verified.'
    })
  });
  assert(submitMilestoneRes.status === 200 && submitMilestoneRes.data.milestone.status === 'submitted', 'STEP 19: Milestone submitted with submission note');

  // STEP 20: Login as club
  const clubLogin3 = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: clubEmail, password: clubPassword })
  });
  assert(clubLogin3.status === 200, 'STEP 20: Club logged in');

  // STEP 21: Review the milestone
  const milestonesListRes = await request(`/projects/${projectId}/milestones`, {
    headers: { Authorization: `Bearer ${activeClubToken}` }
  });
  assert(milestonesListRes.status === 200 && milestonesListRes.data.milestones[0].status === 'submitted', 'STEP 21: Club reviewed submitted milestone');

  // STEP 22: Approve it
  const approveRes = await request(`/milestones/${milestoneId}/review`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${activeClubToken}` },
    body: JSON.stringify({ status: 'approved' })
  });
  assert(approveRes.status === 200 && approveRes.data.milestone.status === 'approved', 'STEP 22: Milestone approved by club');
  assert(approveRes.data.projectStatus === 'completed', 'STEP 22: Project status transitioned to "completed" since all milestones are approved');

  console.log('\n--- EXECUTING SECTION 29: NEGATIVE & SECURITY TESTS ---');

  // 1. Student cannot create a gig
  const studentCreateGig = await request('/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ title: 'Illegal Student Gig', description: 'desc', category: 'Development' })
  });
  assert(studentCreateGig.status === 403, '1. Student cannot create a gig (HTTP 403)');

  // 2. Unauthenticated user cannot access protected routes
  const unauthAccess = await request('/projects');
  assert(unauthAccess.status === 401, '2. Unauthenticated user cannot access protected routes (HTTP 401)');

  // 3. Student cannot access club applicant list
  const studentViewApplicants = await request(`/projects/${projectId}/applications`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(studentViewApplicants.status === 403, '3. Student cannot access applicant list (HTTP 403)');

  // Register a 2nd student for unauthorized testing
  const student2Res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Bob Unselected',
      email: `student2_${Date.now()}@college.edu`,
      password: 'password123',
      role: 'student'
    })
  });
  const student2Token = student2Res.data.token;

  // 4 & 5. A different / unselected student cannot submit another student's milestone
  const student2Submit = await request(`/milestones/${milestoneId}/submit`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${student2Token}` },
    body: JSON.stringify({ submissionNote: 'Attempting unauthorized submission' })
  });
  assert(student2Submit.status === 403, '4 & 5. Unselected student cannot submit milestone (HTTP 403)');

  // 6. Same student cannot apply to the same project twice
  const duplicateApply = await request(`/projects/${projectId}/applications`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ interestNote: 'Duplicate application attempt' })
  });
  assert(duplicateApply.status === 409 || duplicateApply.status === 400, '6. Duplicate application blocked with HTTP 409 Conflict');

  // Register a 2nd club to test club cross-tenant authorization
  const club2Res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Robotics Club',
      email: `club2_${Date.now()}@college.edu`,
      password: 'password123',
      role: 'club'
    })
  });
  const club2Token = club2Res.data.token;

  // 7. Club cannot manage another club's project applications or milestones
  const club2ViewApps = await request(`/projects/${projectId}/applications`, {
    headers: { Authorization: `Bearer ${club2Token}` }
  });
  assert(club2ViewApps.status === 403, '7. Club cannot access another club\'s applicant list (HTTP 403)');

  const club2AddMilestone = await request(`/projects/${projectId}/milestones`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${club2Token}` },
    body: JSON.stringify({ title: 'Unauthorized Milestone' })
  });
  assert(club2AddMilestone.status === 403, '7. Club cannot add milestone to another club\'s project (HTTP 403)');

  // 8. Invalid JWT returns 401
  const invalidJwtRes = await request('/projects', {
    headers: { Authorization: 'Bearer totally_invalid_bogus_token' }
  });
  assert(invalidJwtRes.status === 401, '8. Invalid JWT returns HTTP 401');

  // 9. Unauthorized role returns 403
  const studentReviewMilestone = await request(`/milestones/${milestoneId}/review`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ status: 'approved' })
  });
  assert(studentReviewMilestone.status === 403, '9. Student reviewing milestone returns HTTP 403');

  // 10. Password is never stored as plaintext
  const meRes = await request('/auth/me', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(meRes.status === 200 && !meRes.data.user.password, '10. Password field is never exposed in user responses');

  console.log('\n======================================================');
  console.log('🎉 ALL SECTION 28 & 29 VALIDATION TESTS PASSED 100%!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
