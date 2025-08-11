const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

const sanitizeSearchQuery = (query) => {
  if (!query) return '';
  return query.trim().replace(/[<>%_]/g, '').substring(0, 100);
};

module.exports = {
  sanitizeString,
  sanitizeSearchQuery,
};
