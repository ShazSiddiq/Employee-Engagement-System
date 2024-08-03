import jwt from "jsonwebtoken";

const requireAuth = (roles) => {
  return (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authorization.split(' ')[1];

    try {
      const { id, role } = jwt.verify(token, process.env.JWT_SECRET);

      if (!roles.includes(role)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      req.user = { id, role };
      next();
    } catch (err) {
      res.status(401).json({ error: 'Request is not authorized' });
    }
  };
};

export default requireAuth;
