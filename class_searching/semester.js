function selectDefaultSemester(semesters, today) {
  const [year, month] = today.split('-').map(Number);
  const schoolYear = year - 1911 - (month < 8 ? 1 : 0);
  const term = month >= 2 && month < 8 ? 2 : 1;
  const currentId = `${schoolYear}-${term}`;
  const current = semesters.find((semester) => semester.id === currentId);
  if (current) return current;
  const rank = (semester) => {
    const match = /^(\d+)-([12])$/.exec(semester.id);
    return match ? Number(match[1]) * 2 + Number(match[2]) : -1;
  };
  const available = semesters.filter((semester) => rank(semester) >= 0)
    .sort((a, b) => rank(a) - rank(b));
  const past = available.filter((semester) => rank(semester) <= schoolYear * 2 + term);
  return past[past.length - 1] || available[0] || semesters[0];
}

if (typeof module !== 'undefined') module.exports = { selectDefaultSemester };
