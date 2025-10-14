document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Parse Resume Form
document.getElementById('parse-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('resume-file');
    const resultBox = document.getElementById('parse-result');

    if (!fileInput.files[0]) {
        showError(resultBox, 'Please select a file');
        return;
    }

    const formData = new FormData();
    formData.append('resume', fileInput.files[0]);

    showLoading(resultBox);

    try {
        const response = await fetch('/api/parse-resume', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            displayParseResult(resultBox, result.data);
        } else {
            showError(resultBox, result.error || 'Failed to parse resume');
        }
    } catch (error) {
        showError(resultBox, `Error: ${error.message}`);
    }
});

// Score Resume Form
document.getElementById('score-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const resumeText = document.getElementById('score-resume-text').value;
    const jobDescription = document.getElementById('job-description').value;
    const resultBox = document.getElementById('score-result');

    showLoading(resultBox);

    try {
        const response = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeText, jobDescription })
        });

        const result = await response.json();

        if (result.success) {
            displayScoreResult(resultBox, result.data);
        } else {
            showError(resultBox, result.error || 'Failed to score resume');
        }
    } catch (error) {
        showError(resultBox, `Error: ${error.message}`);
    }
});

// Bulk Screening Form
document.getElementById('screen-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const jobDescription = document.getElementById('screen-job-description').value;
    const candidatesJSON = document.getElementById('candidates-json').value;
    const resultBox = document.getElementById('screen-result');

    let candidates;
    try {
        candidates = JSON.parse(candidatesJSON);
    } catch (error) {
        showError(resultBox, 'Invalid JSON format for candidates');
        return;
    }

    showLoading(resultBox);

    try {
        const response = await fetch('/api/screen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidates, jobDescription })
        });

        const result = await response.json();

        if (result.success) {
            displayScreeningResults(resultBox, result.data);
        } else {
            showError(resultBox, result.error || 'Failed to screen candidates');
        }
    } catch (error) {
        showError(resultBox, `Error: ${error.message}`);
    }
});

// Display Functions
function showLoading(element) {
    element.innerHTML = '<div class="loading">⏳ Processing... This may take a moment.</div>';
    element.classList.remove('empty');
}

function showError(element, message) {
    element.innerHTML = `<div class="error"><strong>Error:</strong> ${message}</div>`;
    element.classList.remove('empty');
}

function displayParseResult(element, data) {
    const html = `
                <div class="success">
                    <h3>✓ Resume Parsed Successfully</h3>
                </div>
                <div class="candidate-info">
                    <h3>Extracted Information</h3>
                    <div class="info-row"><strong>Name:</strong> ${data.name || 'Not found'}</div>
                    <div class="info-row"><strong>Email:</strong> ${data.email || 'Not found'}</div>
                    <div class="info-row"><strong>Phone:</strong> ${data.phone || 'Not found'}</div>
                    
                    ${data.skills && data.skills.length > 0 ? `
                        <div class="info-row">
                            <strong>Skills:</strong>
                            <div class="skills-list">
                                ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${data.experience && data.experience.length > 0 ? `
                        <div class="info-row">
                            <strong>Experience:</strong>
                            ${data.experience.map(exp => `
                                <div style="margin-top: 10px;">
                                    <strong>${exp.title}</strong> at ${exp.company} (${exp.start} - ${exp.end})
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${data.education && data.education.length > 0 ? `
                        <div class="info-row">
                            <strong>Education:</strong>
                            ${data.education.map(edu => `
                                <div style="margin-top: 10px;">
                                    ${edu.degree} in ${edu.field} from ${edu.school}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
    element.innerHTML = html;
}

function displayScoreResult(element, data) {
    const scoreClass = data.score >= 7 ? 'score-high' : data.score >= 4 ? 'score-medium' : 'score-low';

    const html = `
                <div class="score-display ${scoreClass}">
                    ${data.score.toFixed(1)} / 10
                </div>
                <div class="candidate-info">
                    <h3>Analysis</h3>
                    <div class="info-row"><strong>Justification:</strong> ${data.justification}</div>
                    
                    ${data.matchedSkills && data.matchedSkills.length > 0 ? `
                        <div class="info-row">
                            <strong>✓ Matched Skills:</strong>
                            <div class="skills-list">
                                ${data.matchedSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${data.missingSkills && data.missingSkills.length > 0 ? `
                        <div class="info-row">
                            <strong>✗ Missing Skills:</strong>
                            <div class="skills-list">
                                ${data.missingSkills.map(skill => `<span class="skill-tag missing">${skill}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${data.risks && data.risks.length > 0 ? `
                        <div class="info-row">
                            <strong>⚠ Risks:</strong>
                            <ul style="margin-left: 20px; margin-top: 5px;">
                                ${data.risks.map(risk => `<li>${risk}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
    element.innerHTML = html;
}

function displayScreeningResults(element, candidates) {
    const html = `
                <div class="success">
                    <h3>✓ Screening Complete - ${candidates.length} Candidates Processed</h3>
                </div>
                <table class="candidates-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Score</th>
                            <th>Matched Skills</th>
                            <th>Justification</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${candidates.map((candidate, index) => `
                            <tr>
                                <td><span class="rank-badge">${index + 1}</span></td>
                                <td><strong>${candidate.candidateName}</strong></td>
                                <td><strong>${candidate.score.toFixed(1)}</strong></td>
                                <td>${candidate.matchedSkills.join(', ') || 'None'}</td>
                                <td>${candidate.justification}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
    element.innerHTML = html;
}
