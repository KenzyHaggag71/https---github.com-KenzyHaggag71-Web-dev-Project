
const MAX_DETAILED = 3;
const GENERIC_MSG  = 'Please fill in all the required fields correctly.';

function humanList(items) {
  const a = (items || []).filter(Boolean);
  if (a.length === 0) return '';
  if (a.length === 1) return a[0];
  if (a.length === 2) return a[0] + ' and ' + a[1];
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
}


function composeAuth(enter, select, other) {
  enter = enter || []; select = select || []; other = other || [];
  const total = enter.length + select.length + other.length;
  if (total > MAX_DETAILED) return GENERIC_MSG;

  const parts = [];
  if (enter.length)  parts.push('Please enter your ' + humanList(enter) + '.');
  if (select.length) parts.push('Please select your ' + humanList(select) + '.');
  other.forEach(m => parts.push(m));
  return parts.join(' ');
}


function composeNeed(need) {
  need = need || [];
  if (need.length === 0) return '';
  if (need.length > MAX_DETAILED) return GENERIC_MSG;
  return 'Please provide ' + humanList(need) + '.';
}

module.exports = { humanList, composeAuth, composeNeed, GENERIC_MSG, MAX_DETAILED };
