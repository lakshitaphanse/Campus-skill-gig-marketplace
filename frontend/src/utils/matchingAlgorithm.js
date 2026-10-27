/**
 * Campus Compatibility & Selection Criteria Algorithm
 * 
 * Computes an objective Compatibility Index (0 - 100%) for a student
 * applying to a campus gig based on:
 * 1. Skill Taxonomy Alignment & Minimum Proficiency (70% weight)
 * 2. Campus Reliability Score (20% weight)
 * 3. Verified Project Experience Track Record (10% weight)
 */

const LEVEL_WEIGHTS = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3
};

export const calculateCandidateMatch = (student, requiredSkills = []) => {
  if (!student) {
    return {
      score: 0,
      label: 'No Data',
      colorClass: 'match-low',
      rawSkillScore: 0,
      breakdown: []
    };
  }

  const studentSkills = student.skills || [];
  const reliability = student.reliabilityScore ?? 100;
  const completedCount = student.completedProjects ?? 0;

  // If gig has no specific required skills
  if (!requiredSkills || requiredSkills.length === 0) {
    const score = Math.min(100, Math.round(reliability * 0.85 + Math.min(completedCount * 5, 15)));
    return {
      score: Math.max(score, 75),
      label: 'Open Campus Fit',
      colorClass: 'match-high',
      rawSkillScore: 85,
      breakdown: []
    };
  }

  let totalSkillPoints = 0;
  const breakdown = [];

  requiredSkills.forEach((req) => {
    const studentSkill = studentSkills.find(
      (s) => s.tag && s.tag.toLowerCase() === req.tag.toLowerCase()
    );

    const minLevelVal = LEVEL_WEIGHTS[req.minLevel] || 1;

    if (!studentSkill) {
      breakdown.push({
        tag: req.tag,
        requiredLevel: req.minLevel,
        studentLevel: 'Not Listed',
        status: 'missing',
        statusLabel: 'Missing Requirement',
        score: 0
      });
    } else {
      const studentLevelVal = LEVEL_WEIGHTS[studentSkill.level] || 1;
      if (studentLevelVal > minLevelVal) {
        totalSkillPoints += 1.1; // 10% bonus for exceeding min requirement
        breakdown.push({
          tag: req.tag,
          requiredLevel: req.minLevel,
          studentLevel: studentSkill.level,
          status: 'exceeds',
          statusLabel: 'Exceeds Requirement ★',
          score: 110
        });
      } else if (studentLevelVal === minLevelVal) {
        totalSkillPoints += 1.0;
        breakdown.push({
          tag: req.tag,
          requiredLevel: req.minLevel,
          studentLevel: studentSkill.level,
          status: 'meets',
          statusLabel: 'Meets Requirement ✓',
          score: 100
        });
      } else {
        totalSkillPoints += 0.55; // partial match (skill present but lower level)
        breakdown.push({
          tag: req.tag,
          requiredLevel: req.minLevel,
          studentLevel: studentSkill.level,
          status: 'below',
          statusLabel: 'Below Min Level ▲',
          score: 55
        });
      }
    }
  });

  const rawSkillScore = Math.min(100, (totalSkillPoints / requiredSkills.length) * 100);

  // Composite Selection Score:
  // 60% Skill Compatibility + 20% Reliability Score + 10% Rating Bonus + 10% Project Experience
  const ratingFactor = student.totalReviews > 0 ? ((student.averageRating || 5.0) / 5) * 10 : 8;
  const finalScore = Math.min(
    100,
    Math.round(
      rawSkillScore * 0.6 +
      (reliability / 100) * 20 +
      ratingFactor +
      Math.min(completedCount * 5, 10)
    )
  );

  let label = 'Low Match';
  let colorClass = 'match-low';

  if (finalScore >= 85) {
    label = 'Top Recommended Match';
    colorClass = 'match-high';
  } else if (finalScore >= 65) {
    label = 'Qualified Fit';
    colorClass = 'match-medium';
  } else if (finalScore >= 45) {
    label = 'Partial Fit';
    colorClass = 'match-partial';
  }

  return {
    score: finalScore,
    label,
    colorClass,
    rawSkillScore: Math.round(rawSkillScore),
    breakdown
  };
};
