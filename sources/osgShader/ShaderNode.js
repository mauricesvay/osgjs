define( [

    'osgShader/shaderNode/data',
    'osgShader/shaderNode/textures',
    'osgShader/shaderNode/functions',
    'osgShader/shaderNode/lights',
    'osgShader/shaderNode/operations'

], function ( /*data, textures, functions, lights, operations */) {
    'use strict';

    var lib = {};

    // use sublib except _ of course
    var subnamespace = Array.prototype.slice.call( arguments, 0 );

    // add all sub component to root level of the lib
    subnamespace.forEach( function ( component /*, index */ ) {

        Object.keys( component ).forEach( function ( key ) {

            var element = component[ key ];

            if ( this[ key ] !== undefined ) { // if exist throw exception
                throw 'duplicate entry in ShaderNode library';
            }

            this[ key ] = element;

        }, this );

    }, lib );

    return lib;
} );
