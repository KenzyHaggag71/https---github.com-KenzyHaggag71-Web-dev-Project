const fs   = require('fs');
const path = require('path');

const LOCALES_DIR    = path.join(__dirname, '..', 'locales');
const DEFAULT_LOCALE = 'en';

const dictionaries = {};
fs.readdirSync(LOCALES_DIR)
  .filter(file => file.endsWith('.json'))
  .forEach(file => {
    const code = path.basename(file, '.json');
    try {
      dictionaries[code] = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8'));
    } catch (err) {
      console.error('[i18n] Failed to load locale "' + code + '":', err.message);
      dictionaries[code] = {};
    }
  });

const SUPPORTED = Object.keys(dictionaries);

/* List of { code, name } used to render the language switcher. */
const availableLocales = SUPPORTED.map(code => ({
  code,
  name: (dictionaries[code] && dictionaries[code]['_meta.name']) || code
}));



function makeTranslator(locale) {
  const dict     = dictionaries[locale]         || {};
  const fallback = dictionaries[DEFAULT_LOCALE]  || {};
  return function t(key, vars) {
    let str = (dict[key] != null) ? dict[key]
            : (fallback[key] != null) ? fallback[key]
            : key;
    if (vars) {
      Object.keys(vars).forEach(name => {
        str = str.split('{' + name + '}').join(String(vars[name]));
      });
    }
    return str;
  };
}


const ENUM_KEYS = {
  workMode: {
    'Remote': 'explore.remote', 'Hybrid': 'explore.hybrid',
    'On-site': 'explore.onsite', 'Onsite': 'explore.onsite', 'On Site': 'explore.onsite'
  },
  type: {
    'Paid': 'type.paid', 'Unpaid': 'type.unpaid',
    'Full-Time': 'type.fullTime', 'Part-Time': 'type.partTime',
    'Internship': 'type.internship', 'For Credit': 'type.forCredit', 'Volunteer': 'type.volunteer'
  },
  category: {
    'Computer Science': 'cat.computerScience', 'Engineering': 'cat.engineering',
    'Business': 'cat.business', 'Law': 'cat.law', 'Pharmacy': 'cat.pharmacy',
    'Architecture': 'cat.architecture', 'Mass Communication': 'cat.massCommunication',
    'Arts & Design': 'cat.artsDesign', 'Science': 'cat.science'
  },
  industry: {
    'Technology': 'ind.Technology', 'Finance': 'ind.Finance', 'Healthcare': 'ind.Healthcare',
    'Engineering': 'ind.Engineering', 'Law': 'ind.Law', 'Media': 'ind.Media',
    'Retail': 'ind.Retail', 'Education': 'ind.Education'
  },
  role: {
    'user': 'role.user', 'mentor': 'role.mentor', 'company': 'role.company', 'admin': 'role.admin'
  },
  status: {
    'pending': 'status.pending', 'accepted': 'status.accepted',
    'rejected': 'status.rejected', 'approved': 'status.approved'
  }
};

function i18n(req, res, next) {
  let locale = req.session && req.session.lang;
  if (!locale || SUPPORTED.indexOf(locale) === -1) locale = DEFAULT_LOCALE;

  const dict = dictionaries[locale] || {};
  const t = makeTranslator(locale);

  res.locals.lang             = locale;
  res.locals.dir              = dict['_meta.dir'] || 'ltr';
  res.locals.t                = t;
  res.locals.availableLocales = availableLocales;
  /* Translate a known enum value (workMode/type/category/location); unknown values pass through. */
  res.locals.tEnum = function tEnum(kind, value) {
    if (kind === 'location' && value != null) {
      const key = 'loc.' + value;
      const translated = t(key);
      return translated === key ? value : translated;
    }
    const map = ENUM_KEYS[kind];
    if (map && value != null && map[value]) return t(map[value]);
    return value;
  };
  /* Localize a duration string like "10 weeks" / "3 months". */
  res.locals.tDuration = function tDuration(value) {
    if (!value) return value;
    const m = String(value).match(/^\s*(\d+)\s*(weeks?|months?)\s*$/i);
    if (!m) return value;
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase().indexOf('week') === 0
      ? (n === 1 ? 'unit.week' : 'unit.weeks')
      : (n === 1 ? 'unit.month' : 'unit.months');
    return n + ' ' + t(unit);
  };
  res.locals.tStipend = function tStipend(value) {
    if (!value) return value;
    return String(value)
      .replace(/EGP/g, t('cur.egp'))
      .replace(/\/mo\b/g, t('unit.perMonth'));
  };
  res.locals.tIndustry = function tIndustry(value) {
    if (!value) return value;
    const sep = (dict['_meta.dir'] === 'rtl') ? '، ' : ', ';
    return String(value).split(',').map(function (part) {
      const p = part.trim();
      if (ENUM_KEYS.category[p]) return t(ENUM_KEYS.category[p]);
      if (ENUM_KEYS.industry[p]) return t(ENUM_KEYS.industry[p]);
      return p;
    }).join(sep);
  };
  next();
}

module.exports = { i18n, SUPPORTED, DEFAULT_LOCALE, availableLocales };

