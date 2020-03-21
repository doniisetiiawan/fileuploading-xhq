import express from 'express';

const router = express.Router();

/* home page. */
router.get('/', (req, res) => {
  res.send({
    title: 'File upload service',
    csrf: req.csrfToken(),
  });
});

export default router;
