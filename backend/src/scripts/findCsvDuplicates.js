import fs from 'fs';

function findDuplicates() {
  const content = fs.readFileSync('../onlyleet.csv', 'utf8');
  const lines = content.split('\n').slice(1).filter(l => l.trim());
  const rolls = lines.map(l => l.split(',')[2]?.trim().toLowerCase());
  
  const counts = {};
  rolls.forEach(r => counts[r] = (counts[r] || 0) + 1);
  
  const dups = Object.entries(counts).filter(([r, c]) => c > 1);
  console.log('Duplicate rolls in CSV:', dups);

  const emails = lines.map(l => l.split(',')[4]?.trim().toLowerCase());
  const emailCounts = {};
  emails.forEach(e => emailCounts[e] = (emailCounts[e] || 0) + 1);
  const emailDups = Object.entries(emailCounts).filter(([e, c]) => c > 1);
  console.log('Duplicate emails in CSV:', emailDups);
}

findDuplicates();
