'use strict';
/**
 * Example express router for "todo" resources
 */
var express = require('express');
var jsonParser = require('body-parser').json();
var expressApiServer = require('../node_modules/express-api-server/src'); // require('express-api-server');
var errors = expressApiServer.errors;
var getFullBaseUrl = expressApiServer.getFullBaseUrl;
var validator = require('is-my-json-valid');
var fs = require('fs');
var path = require('path');

var router = module.exports = express.Router();



//
// Route Definitions
// -----------------------------------------------------------------
router.route('/files')
    .get(retrievePathsList);         // GET /files

// Route Actions
// -----------------------------------------------------------------
var walk = function (dir, regExcludes, done) {
    var results = [];

    fs.readdir(dir, function (err, list) {
        if (err) return done(err);

        var pending = list.length;
        if (!pending) return done(null, results);

        list.forEach(function (file) {
            file = path.join(dir, file);

            var excluded = false;
            var len = regExcludes.length;
            var i = 0;
            for (; i < len; i++) {
                if (file.match(regExcludes[i])) {
                    excluded = true;
                }
            }
            // Add if not in regExcludes
            if(excluded === false) {
                results.push(file);

                //check if it's a folder
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        //if it is, then walk again
                        walk(file, regExcludes, function (err, res) {
                            results = results.concat(res);

                            if (!--pending) { done(null, results); }
                        });
                    } else {
                        if (!--pending) { done(null, results); }
                    }
                });
            } else {
                if (!--pending) { done(null, results);}
            }
        });
    });
};

function retrievePathsList(req, res, next) {
    var regExcludes = [];
    var paths = [];

    walk(__dirname + '/../../gallery/public/data/', regExcludes, function(err, results) {
        if (err) {
            console.log(err);
            throw err;
            res.status(500).send(err);
        }

        results.forEach(function(result) {
            if (isFile(result)) {
                paths.push(result.replace(/(.*data\/)/, ""));
            }
        });

        paths = rebuildTree(paths, {});
        res.status(200).json(paths);
        console.log(paths);
    });
}

function rebuildTree(paths) {
    var tree = [];

    paths.forEach(function(path){
        if(path.indexOf('/') === 0) {
            path = path.substring(1);
        }

        path = path.split('/');

        if (isFile(path[0])) {
            tree.push(buildFile(path[0]));
            return;
        }

        if (undefined === getIndexOfObject(tree, path[0])) {
            tree.push(buildFolder(path[0]));
        }

        var items = tree[getIndexOfObject(tree, path[0])].items;

        for(var i = 1; i < path.length; i++) {
            if (isFile(path[i])) {
                items.push(buildFile(path[i]));
                continue;
            }

            if (!isFile(path[i]) && undefined === getIndexOfObject(items, path[i])) {
                items.push(buildFolder(path[i]));
            }
        }
    });

    return tree;
}

function isFile(item) {
    return (item.indexOf('.') > -1);
}

function buildFile(path) {
    return { name: path };
}

function buildFolder(path) {
    return { name: path, items: [] };
}

function getIndexOfObject(list, item) {
    var index = undefined;
    list.some(function(value, i) {
        if (value.name == item) {
            index = i;
            return true;
        }
    });
    return index;
}
