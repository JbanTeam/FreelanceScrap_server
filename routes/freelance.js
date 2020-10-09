module.exports = (router) => {
  const flhuntController = require('../controllers/flhuntController');
  const weblancerController = require('../controllers/weblancerController');
  const flhabrController = require('../controllers/flhabrController');
  const freelanceruController = require('../controllers/freelanceruController');
  const flruController = require('../controllers/flruController');

  router.get('/api/flhunt-start', flhuntController.flhuntStart);
  router.get('/api/flhunt-projects', flhuntController.flhuntProjectsRead);
  router.get('/api/flhunt-abort', flhuntController.flhuntAbort);

  router.get('/api/weblancer-start', weblancerController.weblancerStart);
  router.get('/api/weblancer-projects', weblancerController.weblancerProjectsRead);
  router.get('/api/weblancer-abort', weblancerController.weblancerAbort);

  router.get('/api/flhabr-start', flhabrController.flhabrStart);
  router.get('/api/flhabr-projects', flhabrController.flhabrProjectsRead);
  router.get('/api/flhabr-abort', flhabrController.flhabrAbort);

  router.get('/api/freelanceru-start', freelanceruController.freelanceruStart);
  router.get('/api/freelanceru-projects', freelanceruController.freelanceruProjectsRead);
  router.get('/api/freelanceru-abort', freelanceruController.freelanceruAbort);

  router.get('/api/flru-start', flruController.flruStart);
  router.get('/api/flru-projects', flruController.flruProjectsRead);
  router.get('/api/flru-abort', flruController.flruAbort);

  return router;
};
