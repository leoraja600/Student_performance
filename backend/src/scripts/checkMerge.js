import fs from 'fs';
import path from 'path';

function checkMerge() {
  const stud = fs.readFileSync('../stud.csv', 'utf8').split('\n').slice(1).filter(l => l.trim());
  const only = fs.readFileSync('../onlyleet.csv', 'utf8').split('\n').slice(1).filter(l => l.trim());

  const studRolls = new Set(stud.map(l => l.split(',')[0].trim().toLowerCase()));
  const onlyRolls = new Set(only.map(l => l.split(',')[2].trim().toLowerCase()));

  console.log(`Roll numbers in stud.csv: ${studRolls.size}`);
  console.log(`Roll numbers in onlyleet.csv: ${onlyRolls.size}`);

  const intersection = [...studRolls].filter(r => onlyRolls.has(r));
  console.log(`Overlapping roll numbers: ${intersection.length}`);
}

checkMerge();
