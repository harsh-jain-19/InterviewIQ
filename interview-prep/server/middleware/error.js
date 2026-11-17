export const notFound = (req, res) =>
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.name === 'ValidationError' ? 400 : err.status || 500;
  res.status(status).json({ message: err.message || 'Something went wrong' });
};
