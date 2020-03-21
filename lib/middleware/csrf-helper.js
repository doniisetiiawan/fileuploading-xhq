export default (req, res, next) => {
  res.locals.csrf = () => `<input type='hidden' name='_csrf' value='${req.csrfToken()}' />`;

  next();
};
