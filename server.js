'use strict';
/**
 * Example:
 * How to use the api server with custom routes and config
 */
var path = require('path');
//var expressApiServer = require('./node_modules/express-api-server/src');
var expressApiServer = require('express-api-server');

var apiOptions = {
    baseUrlPath: '/api',
    cors: {},
    isGracefulShutdownEnabled: false
};

var initApiRoutes = function(app, options) {
    // Set up routes off of base URL path
    app.use(options.baseUrlPath, [
        require('./files')
    ]);
};

expressApiServer.start(initApiRoutes, apiOptions);

// Use environment variables for other options:
//   API_COMPRESSION=1 API_SSL=1 API_PORT=4443 node example/start.js
