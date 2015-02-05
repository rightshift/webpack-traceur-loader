/**
 * @license
 * traceur-loader v0.2.0
 * https://github.com/ndhoule/traceur-loader/issues/new
 *
 * Copyright 2014, Nathan Houle <nathan@nathanhoule.com>
 * Licensed under the MIT license. See LICENSE.md.
 */

'use strict';

var chalk = require('chalk');
var parseOptions = require('./parseOptions');
var parseQuery = require('./parseQuery');
var support = require('./support');
var traceur = require('traceur');
var runtimePath = require.resolve(require('traceur').RUNTIME_PATH);
var utils = require('loader-utils');

module.exports = function(source) {
  var output;
  var toCompile = source;
  var sourceMap = null;
  var options = parseOptions(parseQuery(this.query));
  var log = this.debug ? support.log : support.noop;
  var callback = this.async();

  this.cacheable && this.cacheable();
  
  log('Processing file: %s', this.resourcePath);
  log('Current options are:', options);

  // Skip Traceur's runtime library
  if (this.resourcePath === runtimePath) {
    log('Skipping compilation of runtime file: %s', this.resourcePath);
    return callback(null, source);
  }

  // If enabled, add a Webpack loader for the Traceur runtime library.
  // (Many features require the Traceur runtime library to work.)
  if (options.runtime) {
    toCompile = 'require("' + runtimePath + '");\n\n' + source;
  }

  try {
    // options.traceurOptions.sourceMaps = true;
    var compiler = new traceur.NodeCompiler(traceur.commonJSOptions(options.traceurOptions));
    output = compiler.compile(toCompile, this.options.output.filename, this.options.output.filename);
    
    // temp fix for issue https://github.com/google/traceur-compiler/issues/1647
    output = output.replace(' = void 0 in ', ' in ');
    
    // sourceMap = compiler.sourceMapInfo.map;

    callback(null, output, sourceMap);
  }
  catch (errors) {
    console.error(chalk.red('ERROR:'), 'Traceur encountered the following errors:');
    console.error('\t' + errors.join('\n\t'));

    return callback(new Error(chalk.red('ERROR:'), 'Please fix these errors and re-run Webpack.'));
  }
};