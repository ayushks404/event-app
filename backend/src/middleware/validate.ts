import { RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';

export const validate = (s: { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny }): RequestHandler =>
  (req, _res, next) => {
    try {
      req.valid = {
        body:   s.body   ? s.body.parse(req.body)     : req.body,
        query:  s.query  ? s.query.parse(req.query)   : req.query,
        params: s.params ? s.params.parse(req.params) : req.params,
      };
      next();
    } catch (e) { next(e); }
  };
