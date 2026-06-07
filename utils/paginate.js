const DEFAULT_LIMIT = 9;

function clampPage(page, totalPages) {
  page = parseInt(page, 10);
  if (Number.isNaN(page) || page < 1) page = 1;
  if (page > totalPages) page = totalPages;
  return page;
}

function meta(page, limit, totalItems, items) {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  page = clampPage(page, totalPages);
  const from = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const to   = Math.min(page * limit, totalItems);
  return {
    items,
    page,
    limit,
    totalItems,
    totalPages,
    from,
    to,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    prevPage: page - 1,
    nextPage: page + 1
  };
}

async function paginate(Model, filter = {}, options = {}) {
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const totalItems = await Model.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const page = clampPage(options.page, totalPages);

  let query = Model.find(filter);
  if (options.sort)    query = query.sort(options.sort);
  if (options.populate) {
    [].concat(options.populate).forEach(p => { query = query.populate(p); });
  }
  const items = await query.skip((page - 1) * limit).limit(limit).lean();

  return meta(page, limit, totalItems, items);
}

function paginateArray(items = [], options = {}) {
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const page = clampPage(options.page, totalPages);
  const slice = items.slice((page - 1) * limit, page * limit);
  return meta(page, limit, totalItems, slice);
}

function baseQuery(query = {}) {
  const parts = [];
  Object.keys(query).forEach(key => {
    if (key === 'page') return;
    const val = query[key];
    if (val == null || val === '') return;
    [].concat(val).forEach(v => {
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(v));
    });
  });
  return parts.length ? parts.join('&') + '&' : '';
}

module.exports = { paginate, paginateArray, baseQuery, DEFAULT_LIMIT };
