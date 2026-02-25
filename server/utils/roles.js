const ROLE_HIERARCHY = { user: 0, admin: 1, manager: 2, 'co-owner': 3, owner: 4 };

const hasRole = (userRole, minRole) =>
  (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);

const requireRole = (minRole) => (req, res, next) => {
  if (!req.isAuthenticated?.()) return res.status(401).json({ message: 'Unauthorized' });
  if (hasRole(req.user?.role, minRole)) return next();
  res.status(403).json({ message: 'Forbidden' });
};

module.exports = { ROLE_HIERARCHY, hasRole, requireRole };
