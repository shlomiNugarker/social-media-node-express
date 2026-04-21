function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        const result = body.safeParse(req.body);
        if (!result.success) {
          return res
            .status(400)
            .json({ err: "Invalid body", issues: result.error.issues });
        }
        req.body = result.data;
      }
      if (query) {
        const result = query.safeParse(req.query);
        if (!result.success) {
          return res
            .status(400)
            .json({ err: "Invalid query", issues: result.error.issues });
        }
        req.validatedQuery = result.data;
      }
      if (params) {
        const result = params.safeParse(req.params);
        if (!result.success) {
          return res
            .status(400)
            .json({ err: "Invalid params", issues: result.error.issues });
        }
        req.params = result.data;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validate };
