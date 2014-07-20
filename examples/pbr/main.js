( function () {
    'use strict';

    var Q = window.Q;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;
    var osgUtil = OSG.osgUtil;
    var $ = window.$;

    var mobileCheck = function () {

        if ( navigator.userAgent.match( /Mobile/i ) )
            return true;
        if ( navigator.userAgent.match( /Android/i ) )
            return true;
        if ( navigator.userAgent.match( /iPhone/i ) )
            return true;
        if ( navigator.userAgent.match( /iPad/i ) )
            return true;
        if ( navigator.userAgent.match( /iPod/i ) )
            return true;
        if ( navigator.userAgent.match( /BlackBerry/i ) )
            return true;
        if ( navigator.userAgent.match( /Windows Phone/i ) )
            return true;

        return false;

    };


    var PBRExample = function ( config ) {
        this._vertexShader = undefined;
        this._fragmentShader = undefined;

        // cache shader/program
        this._shaderPBR = {};

        this._textureHighres = false;
        this._mobile = 0;

        // set by createScene
        this._stateSetBackground = undefined;
        this._stateSetEnvironment = undefined;

        this._configModel = [ {
            name: 'C3PO',
            root: 'C3PO_optim/',
            func: this.loadC3POModel.bind( this ),
            promise: undefined,
            model: new osg.Node(),
            thumbnail: 'thumbnail.jpg',
            description: {
                rank: 1,
                title: 'C3PO',
                author:'Christian Hecht',
                link: ''
            },
            title: 'C3PO',
            config: {
                mapNormal: true,
                mapSpecular: false,
                mapAmbientOcclusion: false,
                mapGlossiness: false
            }
        }, {
            name: 'C3PO-original',
            root: 'C3PO_head/',
            func: this.loadC3POModelOrig.bind( this ),
            promise: undefined,
            model: new osg.Node(),
            thumbnail: 'thumbnail.jpg',
            description: {
                rank: 1,
                title: 'C3PO',
                author:'Christian Hecht',
                link: ''
            },
            config: {
                mapNormal: true,
                mapSpecular: false,
                mapAmbientOcclusion: false,
                mapGlossiness: false
            }
        }, {
            name: 'Cerberus',
            root: 'model/',
            func: this.loadDefaultModel.bind( this ),
            promise: undefined,
            model: new osg.Node(),
            thumbnail: 'thumbnail.jpg',
            description: {
                title: 'Cerberus',
                link: 'http://artisaverb.info/Cerberus.html',
                rank: 1,
                author:'Andrew Maximov'
            },
            config: {
                mapNormal: true
            }
        }, {
            name: 'Mire',
            func: this.loadMireScene.bind( this ),
            root: 'mire/',
            promise: undefined,
            model: new osg.Node(),
            thumbnail: 'thumbnail.jpg',
            description: {
                title: 'Mire test',
                rank: 1,
                link: 'http://www.allegorithmic.com/',
                author:'Allegorithmic'
            },
            config: {
                mapSpecular: false,
                mapAmbientOcclusion: false,
                mapGlossiness: false,
                mapNormal: true
            }
        }, {
            name: 'Sphere',
            func: this.loadTemplateScene.bind( this ),
            root: '',
            promise: undefined,
            model: new osg.Node(),
            thumbnail: 'thumbnail.jpg',
            description: {
                title: 'Sphere test',
                rank: 1,
                link: '',
                author:'The matrix'
            },
            config: {
                mapNormal: false,
                mapSpecular: true,
                mapAmbientOcclusion: false,
                mapGlossiness: false
            }
        }, {
            name: 'Robot',
            func: this.loadRobotModel.bind( this ),
            root: 'robot/',
            promise: undefined,
            model: new osg.Node(),
            thumbnail: 'thumbnail.jpg',
            description: {
                title: 'Junkbot',
                rank: 1,
                author:'Paweł Łyczkowski (design + model) + Nicolas Wirrmann (texturing)',
                link: ''
            },
            config: {
                mapSpecular: true,
                mapAmbientOcclusion: true,
                mapGlossiness: true,
                mapNormal: true
            }

        }, {
            name: 'Car1',
            func: this.loadCarModelSpecular.bind( this ),
            root: 'hotrod2/',
            promise: undefined,
            model: new osg.Node(),
            thumbnail: 'thumbnail.jpg',
            description: {
                title: 'Hotrod',
                author: 'Christophe Desse (design + model) + Jeremie Noguer (texturing)',
                rank: 1,
                link: ''
            },
            config: {
                mapSpecular: true,
                mapAmbientOcclusion: true,
                mapGlossiness: true,
                mapNormal: true
            }

        }, {
            name: 'Car2',
            func: this.loadCarModelMetallic.bind( this ),
            root: 'hotrod2/',
            promise: undefined,
            model: new osg.Node(),
            thumbnail: 'thumbnail.jpg',
            description: {
                title: 'Hotrod',
                author: 'Christophe Desse (design + model) + Jeremie Noguer (texturing)',
                rank: 1,
                link: ''
            },
            config: {
                mapSpecular: false,
                mapAmbientOcclusion: true,
                mapGlossiness: false,
                mapNormal: true
            }

        } ];

        // default config
        this._config = config || {};
        this._config.dirAssets = config.dirAssets || '';
        this._config.datgui = config.datgui !== undefined ? config.datgui : true;

        this._config.environmentAssets = this._config.dirAssets;

        this._configModel.forEach( function ( element ) {
            element.root = this._config.dirAssets + element.root;
        }.bind( this ) );

        this._modelList = this._configModel.map( function ( element ) {
            return element.name;
        } );

        this._configGUI = {
            earlyZ: true,
            rendering: 'solid2',
            rangeExposure: 1.0,
            environment: 'Alexs_Apartment',
            model: this._modelList[ 0 ],
            rotation: 0.0,
            textureMethod: 'RGBE',
            nbSamples: 4
        };


        this.textureEnvs = {};

        this.textureEnvs.bg = {
            'Alexs_Apartment': 'Alexs_Apt_2k_bg.jpg',
            'Allego': 'panorama_map_bg.jpg',
            'GrandCanyon_C_YumaPoint': 'GCanyon_C_YumaPoint_3k_bg.jpg',
            'Walk_Of_Fame': 'Mans_Outside_2k_bg.jpg',
            'HDR_Free_City_Night_Lights': 'HDR_Free_City_Night_Lights_Ref_bg.jpg'
        };

        this._environmentList = Object.keys( this.textureEnvs.bg );

        this.textureEnvs.reference = {
            'Alexs_Apartment': 'Alexs_Apt_2k.png',
            'Allego': 'panorama_map.png',
            'GCanyon_C_YumaPoint': 'GCanyon_C_YumaPoint_3k.png',
            'Walk_Of_Fame': 'Mans_Outside_2k.png',
            'HDR_Free_City_Night_Lights': 'HDR_Free_City_Night_Lights_Ref.png'
        };

        this.textureEnvs.solid = {
            rgbe: {
                'Alexs_Apartment': 'Alexs_Apt_2k_mip.png',
                'Allego': 'panorama_map_mip.png',
                'GCanyon_C_YumaPoint': 'GCanyon_C_YumaPoint_3k_mip.png',
                'Walk_Of_Fame': 'Mans_Outside_2k_mip.png',
                'HDR_Free_City_Night_Lights': 'HDR_Free_City_Night_Lights_Ref_mip.png'
            },
            rgbm: {
                'Alexs_Apartment': 'Alexs_Apt_2k_mip_17.375849.png',
                'Allego': 'panorama_map_mip_963.479187.png',
                'GrandCanyon_C_YumaPoint': 'GCanyon_C_YumaPoint_3k_mip_18.460438.png',
                'Walk_Of_Fame': 'Mans_Outside_2k_mip_34.611233.png',
                'HDR_Free_City_Night_Lights': 'HDR_Free_City_Night_Lights_Ref_mip_839.186951.png'
            }
        };

        this.textureEnvs.prefiltered = {
            rgbm: {
                'Alexs_Apartment': {
                    'diff': 'Alexs_Apt_2k_diff_0.098734.png',
                    'spec': 'Alexs_Apt_2k_spec_7.076629.png'
                },
                'Allego': {
                    'diff': 'panorama_map_diff_0.328576.png',
                    'spec': 'panorama_map_spec_1.561654.png'
                },
                'GrandCanyon_C_YumaPoint': {
                    'diff': 'GCanyon_C_YumaPoint_3k_diff_0.136487.png',
                    'spec': 'GCanyon_C_YumaPoint_3k_spec_17.478539.png'
                },
                'Walk_Of_Fame': {
                    'diff': 'Mans_Outside_2k_diff_0.136116.png',
                    'spec': 'Mans_Outside_2k_spec_31.384483.png'
                },
                'HDR_Free_City_Night_Lights': {
                    'diff': 'HDR_Free_City_Night_Lights_Ref_diff_0.108381.png',
                    'spec': 'HDR_Free_City_Night_Lights_Ref_spec_957.209351.png'
                }
            },
            rgbe: {
                'Alexs_Apartment': {
                    'diff': 'Alexs_Apt_2k_diff.png',
                    'spec': 'Alexs_Apt_2k_spec.png'
                },
                'Allego': {
                    'diff': 'panorama_map_diff.png',
                    'spec': 'panorama_map_spec.png'
                },
                'GrandCanyon_C_YumaPoint': {
                    'diff': 'GCanyon_C_YumaPoint_3k_diff.png',
                    'spec': 'GCanyon_C_YumaPoint_3k_spec.png'
                },
                'Walk_Of_Fame': {
                    'diff': 'Mans_Outside_2k_diff.png',
                    'spec': 'Mans_Outside_2k_spec.png'
                },
                'HDR_Free_City_Night_Lights': {
                    'diff': 'HDR_Free_City_Night_Lights_Ref_diff.png',
                    'spec': 'HDR_Free_City_Night_Lights_Ref_spec.png'
                }
            },
            'integrateBRDF': 'integrateBRDF.png'
        };

        this._viewer = undefined;

        this.handleOptions();

        console.log( JSON.stringify(this._configGUI) );

    };

    PBRExample.prototype = {

        readShaders: function () {

            var defer = Q.defer();

            var p0 = Q( $.get( 'vertex.glsl' ) );
            var p1 = Q( $.get( 'fragment.glsl' ) );

            Q.all( [ p0, p1 ] ).then( function ( args ) {

                this._vertexShader = args[ 0 ];
                this._fragmentShader = args[ 1 ];
                defer.resolve();

            }.bind( this ) );

            return defer.promise;
        },

        modelFinishLoading: function () {
            this._loading--;
            if ( !this._loading ) {
                console.log( 'loading finished' );
                $('#loading' ).hide();
            }
        },

        modelStartLoading: function ( name ) {
            this._loading++;
            if ( name ) {
                console.log( 'loading ' + name );
            }
            $('#loading' ).show();
        },

        setEnvironmentUniforms: function ( method, stateSet, name, unit, w, h, range ) {

            stateSet.addUniform( osg.Uniform.createInt1( unit, name ) );
            stateSet.addUniform( osg.Uniform.createFloat2( [ w, h ], name + 'Size' ) );

            if ( range !== undefined ) {
                stateSet.addUniform( osg.Uniform.createFloat1( range, name + 'Range' ) );
            }
        },

        createEnvironmnentTexture: function ( name, image, stateSet, unit ) {
            var method = this._configGUI.textureMethod;
            var texture = new osg.Texture();
            if ( image )
                texture.setImage( image );
            texture.setMinFilter( 'NEAREST' );
            texture.setMagFilter( 'NEAREST' );

            stateSet.setTextureAttributeAndModes( unit, texture );
            var width = image ? image.getWidth() : 0;
            var height = image ? image.getHeight() : 0;

            var range;
            // get the range of the image
            if ( method.toLowerCase() === 'rgbm' ) {
                var re = /.*_(\d.*).png/;
                var str = image.getURL();
                var m;
                m = re.exec( str );
                if ( m )
                    range = parseFloat( m.pop() );
            }

            if ( image )
                this.setEnvironmentUniforms( method, stateSet, name, unit, width, height, range );
            return texture;
        },

        setEnvironmentReference: function ( method, name, stateSet ) {

            var base = this._config.environmentAssets;
            var config = this.textureEnvs.reference[ name ];

            var textures = [
                this.readImageURL( base + 'textures/' + name + '/reference/' + config )
            ];

            Q.all( textures ).then( function ( images ) {
                this.createEnvironmnentTexture( 'environment', images[ 0 ], stateSet, 5 );
            }.bind( this ) );
        },

        setEnvironmentPrefiltered: function ( method, name, stateSet ) {

            var base = this._config.environmentAssets;

            var textureFormat = method.toLowerCase();
            var config = this.textureEnvs.prefiltered[ textureFormat ][ name ];
            var integrateBRDF = this.textureEnvs.prefiltered.integrateBRDF;

            var mipmapTexture = [
                this.readImageURL( base + 'textures/' + name + '/prefilter/' + textureFormat + '/' + config.diff ),
                this.readImageURL( base + 'textures/' + name + '/prefilter/' + textureFormat + '/' + config.spec ),
                this.readImageURL( base + 'textures/' + integrateBRDF )
            ];

            Q.all( mipmapTexture ).then( function ( images ) {
                this.createEnvironmnentTexture( 'envDiffuse', images[ 0 ], stateSet, 5 );
                this.createEnvironmnentTexture( 'envSpecular', images[ 1 ], stateSet, 6 );
                this.createEnvironmnentTexture( 'integrateBRDF', images[ 2 ], stateSet, 7 );
            }.bind( this ) );
        },

        setEnvironmentSolid: function ( method, name, stateSet ) {

            var base = this._config.environmentAssets;

            var textureFormat = method.toLowerCase();
            var image = this.textureEnvs.solid[ textureFormat ][ name ];
            var texture = [
                this.readImageURL( base + 'textures/' + name + '/solid/' + textureFormat + '/' + image ),
            ];

            Q.all( texture ).then( function ( images ) {
                this.createEnvironmnentTexture( 'environment', images[ 0 ], stateSet, 5 );
            }.bind( this ) );
        },


        setEnvironmentBackground: function ( name, stateSet ) {

            var base = this._config.environmentAssets;
            var image = this.textureEnvs.bg[ name ];
            var texture = [
                this.readImageURL( base + 'textures/' + name + '/' + image ),
            ];
            Q.all( texture ).then( function ( images ) {
                var texture = this.createEnvironmnentTexture( 'environment', images[ 0 ], stateSet, 0 );
                texture.setMinFilter( 'LINEAR' );
                texture.setMagFilter( 'LINEAR' );
                texture.setWrapS( 'REPEAT' );
            }.bind( this ) );
        },

        setEnvironmentModel: function ( name, stateSet ) {
            var method = this._configGUI.textureMethod;
            var rendering = this._configGUI.rendering;

            if ( rendering === 'prefilter' )
                this.setEnvironmentPrefiltered( method, name, stateSet );
            else
                this.setEnvironmentSolid( method, name, stateSet );
        },

        setEnvironment: function ( name ) {

            var stateSetBackground = this._stateSetBackground;
            this.setEnvironmentBackground( name, stateSetBackground );

            var stateSetEnvironment = this._stateSetEnvironment;
            this.setEnvironmentModel( name, stateSetEnvironment );
        },

        setModelShader: function ( model, modelConfig, stateSet ) {
            var config = {
                textureMethod: this._configGUI.textureMethod,
                rendering: this._configGUI.rendering,
                samples: this._configGUI.nbSamples
            };

            var shader = this.getShader( modelConfig, config );
            stateSet.setAttributeAndModes( shader, osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );
            this.setEnvironment( this._configGUI.environment );
            this.createHammersleyUniforms();
        },

        getShader: function ( config, shaderType ) {
            if ( !config ) config = {};

            if ( !shaderType )
                shaderType = {};

            var textureMethod = shaderType.textureMethod;
            var rendering = shaderType.rendering;

            var textureRGBE = textureMethod === 'RGBE' ? '#define RGBE 1' : '';
            var textureRGBM = textureMethod === 'RGBM' ? '#define RGBM 1' : '';
            var solid = rendering === 'solid' ? '#define SOLID 1' : '';
            var solid2 = rendering === 'solid2' ? '#define SOLID2 1' : '';
            var prefilter = rendering === 'prefilter' ? '#define PREFILTER 1' : '';
            var nbSamples = '#define NB_SAMPLES 1';
            var brute = '';

            if ( solid !== ''  || solid2 !== '' ) {
                nbSamples = '#define NB_SAMPLES ' + shaderType.samples.toString();
                brute = '#define BRUT 1';
            }

            var ambientOcclusion = '';
            if ( config.mapAmbientOcclusion )
                ambientOcclusion = '#define AO';

            var specular = '';
            if ( config.mapSpecular )
                specular = '#define SPECULAR';

            var glossiness = '';
            if ( config.mapGlossiness )
                glossiness = '#define GLOSSINESS';

            var normalmap = '';
            if ( config.mapNormal )
                normalmap = '#define NORMAL';


            var defines = [
                textureRGBE,
                textureRGBM,
                brute,
                solid2,
                solid,
                prefilter,
                nbSamples,
                ambientOcclusion,
                specular,
                glossiness,
                normalmap,
                ''
            ].join('\n');

            if ( this._shaderPBR[ defines ] ) {
                return this._shaderPBR[ defines ];
            }


            var vertexshader = [
                defines,
                this._vertexShader
            ].join('\n');

            var fragmentshader = [
                defines,
                this._fragmentShader
            ].join('\n');

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            this._shaderPBR[ defines ] = program;

            return program;
        },




        getShaderEarlyZ: function () {

            var vertexshader = [
                '',
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'attribute vec3 Vertex;',

                'uniform mat4 ModelViewMatrix;',
                'uniform mat4 ProjectionMatrix;',

                'void main(void) {',
                '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
                '}'
            ].join( '\n' );

            var fragmentshader = [
                '',
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'void main(void) {',
                '  gl_FragColor = vec4(1.0,0.0,1.0,1.0);',
                '}',
                ''
            ].join( '\n' );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;
        },


        loadDefaultModel: function ( config ) {

            var self = this;
            var root = config.root;
            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );

                var promises = [];
                promises.push( self.readImageURL( root + '/Cerberus_by_Andrew_Maximov/Textures/Cerberus_A.tga.png' ) );
                promises.push( self.readImageURL( root + '/Cerberus_by_Andrew_Maximov/Textures/Cerberus_R.tga.png' ) );

                promises.push( self.readImageURL( root + '/Cerberus_by_Andrew_Maximov/Textures/Cerberus_N.tga.png' ) );
                promises.push( self.readImageURL( root + '/Cerberus_by_Andrew_Maximov/Textures/Cerberus_M.tga.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setImage( image );
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, createTexture( args[ index ] ) );
                    } );

                    defer.resolve( model );
                } );

                return defer.promise;
            };

            return this.getModel( root + '/Cerberus_by_Andrew_Maximov.osgjs.gz', callbackModel );
        },



        loadRobotModel: function ( config ) {

            var self = this;
            var root = config.root;
            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );


                var prefix = '_2';
                if ( this._textureHighres )
                    prefix = '';

                var promises = [];
                promises.push( self.readImageURL( root + 'Textures/map_A'+prefix+'.jpg' ) );
                promises.push( self.readImageURL( root + 'Textures/map_R'+prefix+'.jpg' ) );

                promises.push( self.readImageURL( root + 'Textures/map_N'+prefix+'.jpg' ) );
                promises.push( self.readImageURL( root + 'Textures/map_S'+prefix+'.jpg' ) );
                promises.push( self.readImageURL( root + 'Textures/map_AO'+prefix+'.jpg' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );

                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, createTexture( args[ index ] ) );
                    } );

                    model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
                    defer.resolve( model );
                } );

                return defer.promise;
            };

            var modelPromise = this.getModel( root + 'Junkbot.osgjs.gz', callbackModel );
            Q( modelPromise ).then( function ( model ) {
                osg.Matrix.makeIdentity( model.getMatrix() );
            } );

            return modelPromise;
        },

        loadCarModelSpecular: function ( config ) {

            var self = this;
            var root = config.root;
            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

                var promises = [];
                var base = root;
                promises.push( self.readImageURL( base + 'hotrod_diffuse.png' ) );
                promises.push( self.readImageURL( base + 'hotrod_glossiness.png' ) );

                promises.push( self.readImageURL( base + 'hotrod_normal.png' ) );
                promises.push( self.readImageURL( base + 'hotrod_specular.png' ) );
                promises.push( self.readImageURL( base + 'hotrod_ao.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        var texture = createTexture( args[ index ] );
                        texture.setWrapS( 'REPEAT' );
                        texture.setWrapT( 'REPEAT' );
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                    } );

                    defer.resolve( model );
                } );

                return defer.promise;
            };

            return this.getModel( root + 'hotrod2.osgjs.gz', callbackModel );
        },



        loadCarModelMetallic: function ( config ) {
            var self = this;

            var root = config.root;
            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

                var promises = [];
                var base = root;
                promises.push( self.readImageURL( base + 'hotrod_basecolor.png' ) );
                promises.push( self.readImageURL( base + 'hotrod_roughness.png' ) );

                promises.push( self.readImageURL( base + 'hotrod_normal.png' ) );
                promises.push( self.readImageURL( base + 'hotrod_metallic.png' ) );
                promises.push( self.readImageURL( base + 'hotrod_ao.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        var texture = createTexture( args[ index ] );
                        texture.setWrapS( 'REPEAT' );
                        texture.setWrapT( 'REPEAT' );
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                    } );

                    defer.resolve( model );
                }.bind( this ) );

                return defer.promise;
            };
            return this.getModel( root + 'hotrod2.osgjs.gz', callbackModel );
        },


        loadC3POModel: function ( config ) {
            var self = this;

            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );

                var promises = [];
                var vers = '2k';
                if ( this._textureHighres )
                    vers = '4k';

                var base = config.root + 'textures/' + vers + '/';
                promises.push( self.readImageURL( base + 'c3po_D.tga.png' ) );
                promises.push( self.readImageURL( base + 'c3po_R.tga.png' ) );

                promises.push( self.readImageURL( base + 'c3po_N.tga.png' ) );
                promises.push( self.readImageURL( base + 'c3po_M.tga.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        var texture = createTexture( args[ index ] );
                        texture.setWrapS( 'REPEAT' );
                        texture.setWrapT( 'REPEAT' );
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                    } );

                    defer.resolve( model );
                } );

                return defer.promise;
            };
            return this.getModel( config.root + 'C3PO_head.osgjs.gz', callbackModel );
        },

        loadC3POModelOrig: function ( config ) {
            var self = this;

            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
                // model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

                var promises = [];

                var vers = '2k';
                if ( this._textureHighres )
                    vers = '4k';

                var base = config.root + 'textures/' + vers + '/';
                promises.push( self.readImageURL( base + 'c3po_D.tga.png' ) );
                promises.push( self.readImageURL( base + 'c3po_R.tga.png' ) );

                promises.push( self.readImageURL( base + 'c3po_N.tga.png' ) );
                promises.push( self.readImageURL( base + 'c3po_M.tga.png' ) );
                // promises.push( self.readImageURL( base + 'hotrod_ao.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        var texture = createTexture( args[ index ] );
                        texture.setWrapS( 'REPEAT' );
                        texture.setWrapT( 'REPEAT' );
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                    } );

                    defer.resolve( model );
                } );

                return defer.promise;
            };
            return this.getModel( config.root + 'c3po.osgjs.gz', callbackModel );
        },

        loadTemplateScene: function () {

            var self = this;

            var nbMaterials = 8;

            var createConfig = function ( albedo, specular ) {

                var config = [];
                for ( var i = 0; i < nbMaterials; i++ ) {
                    config[ i ] = config[ i ] || {};
                    var material = config[ i ];

                    material.roughness = i / nbMaterials;
                    material.albedo = albedo.slice( 0 );
                    material.specular = specular.slice( 0 );
                }
                return config;
            };

            var linear2Srgb = function ( value, gamma ) {
                if ( !gamma ) gamma = 2.2;
                var result = 0.0;
                if ( value < 0.0031308 ) {
                    if ( value > 0.0 )
                        result = value * 12.92;
                } else {
                    result = 1.055 * Math.pow( value, 1.0 / gamma ) - 0.055;
                }
                return result;
            };


            var createTexture = function ( color, srgb ) {
                var albedo = new osg.Uint8Array( 4 );

                color.forEach( function ( value, index ) {
                    if ( srgb )
                        albedo[ index ] = Math.floor( 255 * linear2Srgb( value ) );
                    else
                        albedo[ index ] = Math.floor( 255 * value );
                } );

                var texture = new osg.Texture();
                texture.setTextureSize( 1, 1 );
                texture.setImage( albedo );
                return texture;
            };

            var materialsConfig = [ {
                    specular: [ 0.5, 0.5, 0.5 ], // plastic
                    albedo: [ 0.6, 0.0, 0.0 ]
                }, {
                    specular: [ 0.971519, 0.959915, 0.915324 ], // Silver
                    albedo: [ 0, 0, 0 ]
                }, {
                    specular: [ 0.913183, 0.921494, 0.924524 ], // Aluminium
                    albedo: [ 0, 0, 0 ]
                }, {
                    specular: [ 1.0, 0.765557, 0.336057 ], // Gold
                    albedo: [ 0, 0, 0 ]
                }, {
                    specular: [ 0.955008, 0.637427, 0.538163 ], // Copper
                    albedo: [ 0, 0, 0 ]
                }, // {
                {
                    specular: [ 0.659777, 0.608679, 0.525649 ], // Nickel
                    albedo: [ 0, 0, 0 ]
                }, //  {
                {
                    specular: [ 0.662124, 0.654864, 0.633732 ], // Cobalt
                    albedo: [ 0, 0, 0 ]
                }, {
                    specular: [ 0.672411, 0.637331, 0.585456 ], // Platinum
                    albedo: [ 0, 0, 0 ]
                }
            ];



            var group = new osg.Node();


            materialsConfig.forEach( function ( material, index ) {
                var radius = 10.0;
                var offset = 5;

                var config = createConfig( material.albedo, material.specular );
                var subgroup = new osg.MatrixTransform();
                subgroup.setMatrix( osg.Matrix.makeTranslate( 0, index * ( 2 * radius + offset ), 0, osg.Matrix.create() ) );
                config.forEach( function ( config, index ) {

                    var segment = 80;
                    var sphere = osg.createTexturedSphere( radius, segment, segment / 2 );

                    var color = config.albedo.slice( 0 );
                    color[ 3 ] = 1.0;
                    var albedo = createTexture( color, true );
                    sphere.getOrCreateStateSet().setTextureAttributeAndModes( 0, albedo );

                    var roughness = createTexture( [ config.roughness, config.roughness, config.roughness, 1.0 ], false );
                    sphere.getOrCreateStateSet().setTextureAttributeAndModes( 1, roughness );

                    color = config.specular.slice( 0 );
                    color[ 3 ] = 1.0;
                    var specular = createTexture( color, true );
                    sphere.getOrCreateStateSet().setTextureAttributeAndModes( 3, specular );

                    var transform = new osg.MatrixTransform();
                    transform.setMatrix( osg.Matrix.makeTranslate( index * ( 2 * radius + offset ), 0, 0, osg.Matrix.create() ) );
                    transform.addChild( sphere );
                    subgroup.addChild( transform );
                } );
                group.addChild( subgroup );

            } );

            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );
            group.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 4, 'aoMap' ) );

            var rootModel = new osg.Node();
            rootModel.addChild( group );
            return Q( rootModel );
        },


        loadMireScene: function ( config ) {
            var self = this;
            var root = config.root;

            var callbackModel = function ( model ) {

                var defer = Q.defer();

                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 0, 'albedoMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 1, 'roughnessMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 2, 'normalMap' ) );
                model.getOrCreateStateSet().addUniform( osg.Uniform.createInt1( 3, 'specularMap' ) );

                var promises = [];
                var base = root;
                promises.push( self.readImageURL( base + 'diffuse.png' ) );
                promises.push( self.readImageURL( base + 'roughness.png' ) );

                promises.push( self.readImageURL( base + 'normal.png' ) );
                promises.push( self.readImageURL( base + 'metallic.png' ) );

                var createTexture = function ( image ) {
                    var texture = new osg.Texture();
                    texture.setWrapS( 'REPEAT' );
                    texture.setWrapT( 'REPEAT' );

                    texture.setMinFilter( 'LINEAR_MIPMAP_LINEAR' );
                    texture.setMagFilter( 'LINEAR' );
                    texture.setImage( image );
                    return texture;
                };

                Q.all( promises ).then( function ( args ) {
                    args.forEach( function ( image, index ) {
                        var texture = createTexture( args[ index ] );
                        texture.setWrapS( 'REPEAT' );
                        texture.setWrapT( 'REPEAT' );
                        model.getOrCreateStateSet().setTextureAttributeAndMode( index, texture );
                    } );

                    defer.resolve( model );
                } );

                return defer.promise;
            };

            var model = new osg.MatrixTransform();
            var geometry = osg.createTexturedQuadGeometry( -0.5, -0.5, 0,
                1, 0, 0,
                0, 1, 0 );
            geometry.getAttributes().Tangent = new osg.BufferArray( 'ARRAY_BUFFER', [ 1, 0, 0, -1,
                1, 0, 0, -1,
                1, 0, 0, -1,
                1, 0, 0, -1
            ], 4 );

            var mata = osg.Matrix.makeRotate( Math.PI / 2, 0, 0, 1, osg.Matrix.create() );
            var matb = osg.Matrix.makeRotate( -Math.PI / 2.0, 1, 0, 0, model.getMatrix() );
            osg.Matrix.mult( mata, matb, matb );
            model.addChild( geometry );
            model.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );
            return callbackModel( model );
        },

        createHammersleyUniforms: function () {
            var sequence = this.computeHammersleySequence( this._configGUI.nbSamples );
            var uniformHammersley = osg.Uniform.createFloat2Array( sequence, 'hammersley' );
            this._stateSetScene.addUniform( uniformHammersley );
        },

        createScene: function () {
            var self = this;
            var group = new osg.Node();

            // HDR parameters uniform
            var uniformExposure = osg.Uniform.createFloat1( 1, 'hdrExposure' );

            var size = 500;
            this.getEnvSphere( size, group );

            this._stateSetScene = group.getOrCreateStateSet();

            group.getOrCreateStateSet().addUniform( uniformExposure );

            this.createHammersleyUniforms();

            var rootGraph = new osg.Node();

            var groupModel = new osg.MatrixTransform();
            this._stateSetEnvironment = groupModel.getOrCreateStateSet();

            var earlyZ = new osg.Node();
            earlyZ.addChild( groupModel );
            earlyZ.getOrCreateStateSet().setAttributeAndModes( this.getShaderEarlyZ(), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );
            earlyZ.getOrCreateStateSet().setAttributeAndModes( new osg.ColorMask( false, false, false, false ) );
            earlyZ.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'LESS', 0.0, 1.0, true ), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );
            earlyZ.getOrCreateStateSet().setBinNumber( -1 );
            groupModel.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'LEQUAL', 0.0, 1.0, false ) );


            var nodeEarlyPath = new osg.Node();
            nodeEarlyPath.addChild( earlyZ );
            nodeEarlyPath.addChild( groupModel );

            var regular = new osg.Node();
            regular.addChild( groupModel );
            regular.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'LEQUAL', 0.0, 1.0, true ), osg.StateAttribute.OVERRIDE | osg.StateAttribute.ON );
            regular.setNodeMask( 0x0 );

            rootGraph.addChild( regular );
            rootGraph.addChild( nodeEarlyPath );
            group.addChild( rootGraph );

            var config = this._configModel;

            var setShaderModel = function ( value ) {
                var obj = this._configGUI;
                var index = this._modelList.indexOf( obj.model );
                if ( !config[ index ] || config[ index ].promise.isPending() )
                    return;

                // set the value of the rendering changed
                if ( value )
                    obj.rendering = value;

                // set the shader on the same stateSet than the model
                this.setModelShader( config[ index ].model, config[ index ].config, this._stateSetEnvironment );

            }.bind( this );

            // function called when selecting a model
            var setModel = function ( str ) {

                config.forEach( function ( entry ) {
                    if ( !entry.promise || entry.promise.isPending() )
                        return;
                    entry.model.setNodeMask( 0x0 );
                } );

                // force to update dat.gui config
                this._configGUI.model = str;

                var index = this._modelList.indexOf( str );
                config[ index ].model.setNodeMask( ~0x0 );

                setShaderModel();

                self._viewer.getManipulator().setNode( config[ index ].model );
                self._viewer.getManipulator().computeHomePosition();

                var modelDescription = this.getModelDescription();
                if ( $('#model-description') ) {
                    var link = modelDescription.link;
                    $('#model-description').html( modelDescription.title + ' by ' + modelDescription.author + ( link === '' ? '' : ' - <a href="' + link +'">link</a>')  );
                }

            }.bind( this );

            // add all models to group
            config.forEach( function ( entry ) {
                entry.model.setNodeMask( 0 );
                groupModel.addChild( entry.model );
            } );


            // run loading sequencially
            config.reduce( function ( previous, current ) {

                if ( !previous ) {
                    this.modelStartLoading( current.name );

                    // call the loading function with its config
                    var promise = current.func( current );
                    current.promise = promise;

                    promise.then( function ( model ) {
                        current.model.addChild( model );
                        this.modelFinishLoading();

                    }.bind( this ) );

                    return current.promise;
                }

                var defer = Q.defer();
                previous.then( function () {

                    this.modelStartLoading( current.name );

                    var promise = current.func( current );
                    current.promise = promise;
                    promise.then( function ( model ) {
                        current.model.addChild( model );
                        defer.resolve();
                        this.modelFinishLoading();

                    }.bind( this ) );
                }.bind(this) );
                return defer.promise;
            }.bind( this ), undefined );

            config[ 0 ].promise.then( function () {
                setModel( config[ 0 ].name );
            }.bind( this ) );


            var obj = this._configGUI;


            // use dat.gui
            if ( this._config.datgui ) {

                var gui = new window.dat.GUI();
                var controller = gui.add( obj, 'earlyZ' );
                controller.onChange( function ( value ) {
                    if ( value ) {
                        nodeEarlyPath.setNodeMask( ~0x0 );
                        regular.setNodeMask( 0x0 );
                    } else {
                        nodeEarlyPath.setNodeMask( 0x0 );
                        regular.setNodeMask( ~0x0 );
                    }
                } );

                controller = gui.add( obj, 'rangeExposure', 0, 4 );
                controller.onChange( function ( value ) {
                    uniformExposure.set( value );
                } );


                controller = gui.add( obj, 'rotation', 0, 360 );
                controller.onChange( function ( value ) {
                    osg.Matrix.makeRotate( value * Math.PI / 180.0, 0, 0, 1, groupModel.getMatrix() );
                    groupModel.dirtyBound();
                } );


                controller = gui.add( obj, 'environment', this._environmentList );
                controller.onChange( function ( value ) {

                    this.setEnvironment( value );

                }.bind( this ) );

                controller = gui.add( obj, 'textureMethod', [ 'RGBE', 'RGBM' ] );
                controller.onChange( function ( value ) {

                    obj.textureMethod = value;
                    setShaderModel();

                }.bind( this ) );

                controller = gui.add( obj, 'nbSamples', [ 1, 4, 8, 16, 32, 64 ] );
                controller.onChange( function ( value ) {

                    obj.nbSamples = value;
                    setShaderModel();

                }.bind( this ) );


                controller = gui.add( obj, 'model', this._modelList );
                controller.onChange( function ( value ) {

                    setModel( value );

                }.bind( this ) );


                controller = gui.add( obj, 'rendering', [ 'prefilter', 'solid', 'solid2' ] );
                controller.onChange( setShaderModel );
            }

            this.setEnvironment( 'Alexs_Apartment' );

            return group;
        },


        handleOptions: function() {

            var options = {};
            ( function ( options ) {
                var vars = [],
                    hash;
                var indexOptions = window.location.href.indexOf( '?' );
                if ( indexOptions < 0 ) return;

                var hashes = window.location.href.slice( indexOptions + 1 ).split( '&' );
                for ( var i = 0; i < hashes.length; i++ ) {
                    hash = hashes[ i ].split( '=' );
                    var element = hash[ 0 ];
                    vars.push( element );
                    var result = hash[ 1 ];
                    if ( result === undefined ) {
                        result = '1';
                    }
                    options[ element ] = result;
                }
            } )( options );


            if ( options.model ) {
                var array = this._configModel.filter( function ( element ) {
                    return ( element.name.toLowerCase() === options.model.toLowerCase() );
                } );

                if ( array.length ) {
                    this._configModel = array;
                    this._modelList = this._configModel.map( function ( element ) {
                        return element.name;
                    } );
                }
            }

            if ( options.mobile ) {
                this._mobile = 1;
            }

            // auto check
            if ( options.mobile === undefined ) {
                this._mobile = mobileCheck();
            }

            if ( options.textureSize === 'high' ) {
                this._configGUI.textureSize = options.textureSize;
            }

            if ( options.highres ) {
                this._textureHighres = true;
            }

            if ( options.nbSamples ) {
                this._configGUI.nbSamples = parseInt( options.nbSamples );
            }

            if ( options.rendering ) {
                this._configGUI.rendering = options.rendering;
            }


            var osgOptions = {};

            if ( this._mobile ) {
                this._configGUI.nbSamples = 1;
                osgOptions.overrideDevicePixelRatio = 1.0;
            }


            this._osgOptions = osgOptions;

        },

        getModelThumbnail: function() {
            var model = this._configGUI.model;
            var idx = this._modelList.indexOf( model );
            var configModel = this._configModel[ idx ];
            return configModel.root + '/' + configModel.thumbnail;
        },

        getModelDescription: function() {
            var model = this._configGUI.model;
            var idx = this._modelList.indexOf( model );
            var configModel = this._configModel[ idx ];
            return configModel.description;
        },

        run: function ( canvas ) {

            this.readShaders().then( function() {

                var viewer;
                viewer = new osgViewer.Viewer( canvas, this._osgOptions );
                this._viewer = viewer;
                viewer.init();

                var gl = viewer.getState().getGraphicContext();
                console.log( gl.getExtension( 'OES_texture_float' ) );
                console.log( gl.getExtension( 'OES_texture_float_linear' ) );
                console.log( gl.getExtension( 'EXT_shader_texture_lod' ) );

                var rotate = new osg.MatrixTransform();

                //var nbVectors = viewer.getWebGLCaps().getWebGLParameter( 'MAX_FRAGMENT_UNIFORM_VECTORS' );
                //this.referenceNbSamples = Math.min( nbVectors - 20, this.referenceNbSamples );

                rotate.addChild( this.createScene() );

                this._rootNode = new osg.Node();
                this._rootNode.addChild( rotate );
                viewer.getCamera().setClearColor( [ 0.0, 0.0, 0.0, 0.0 ] );

                // only clear depth because we have a background
                viewer.getCamera().setClearMask( osg.Camera.DEPTH_BUFFER_BIT );

                viewer.setSceneData( this._rootNode );
                viewer.setupManipulator();
                viewer.getManipulator().computeHomePosition();

                viewer.run();
            }.bind ( this ) );
        },

        getShaderBackground: function () {

            if ( this._backgroundShader )
                return this._backgroundShader;

            var vertexshader = [
                '#define BACKGROUND 1',
                this._vertexShader
            ].join('\n');

            var fragmentshader = [
                '#define BACKGROUND 1',
                this._fragmentShader
            ].join('\n');

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            if ( !this._backgroundShader )
                this._backgroundShader = program;

            return program;
        },


        getEnvSphere: function ( size, scene ) {
            var self = this;

            // create the environment sphere
            //var geom = osg.createTexturedSphere(size, 32, 32);
            var geom = osg.createTexturedBoxGeometry( 0, 0, 0, size, size, size );
            this._stateSetBackground = geom.getOrCreateStateSet();
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 'DISABLE' ) );

            // display the environment only for pixel on depth == 1 meaning the background
            geom.getOrCreateStateSet().setAttributeAndModes( new osg.Depth( 'EQUAL', 1, 1.1, false ) );
            geom.getOrCreateStateSet().setAttributeAndModes( this.getShaderBackground() );
            this._stateSetBackground.setRenderBinDetails( 10, 'RenderBin' );

            var cubemapTransform = osg.Uniform.createMatrix4( osg.Matrix.makeIdentity( [] ), 'CubemapTransform' );
            var mt = new osg.MatrixTransform();
            mt.setMatrix( osg.Matrix.makeRotate( Math.PI / 2.0, 1, 0, 0, [] ) );
            mt.addChild( geom );
            var CullCallback = function () {
                this.cull = function ( node, nv ) {
                    // overwrite matrix, remove translate so environment is always at camera origin
                    osg.Matrix.setTrans( nv.getCurrentModelviewMatrix(), 0, 0, 0 );
                    var m = nv.getCurrentModelviewMatrix();
                    osg.Matrix.copy( m, cubemapTransform.get() );
                    cubemapTransform.dirty();
                    return true;
                };
            };
            mt.setCullCallback( new CullCallback() );
            scene.getOrCreateStateSet().addUniform( cubemapTransform );

            var cam = new osg.Camera();
            cam.setClearMask( 0x0 );
            cam.setReferenceFrame( osg.Transform.ABSOLUTE_RF );
            cam.addChild( mt );
            cam.setCullCallback(new CullCallback());
            cam.setRenderOrder( osg.Camera.POST_RENDER, 0 );

            // the update callback get exactly the same view of the camera
            // but configure the projection matrix to always be in a short znear/zfar range to not vary depend on the scene size
            var info = {};
            var proj = [];
            var UpdateCallback = function () {
                this.update = function ( /*node, nv*/ ) {
                    var rootCam = self._viewer.getCamera();

                    osg.Matrix.getPerspective( rootCam.getProjectionMatrix(), info );
                    osg.Matrix.makePerspective( info.fovy, info.aspectRatio, 1.0, 1000.0, proj );
                    cam.setProjectionMatrix( proj );
                    cam.setViewMatrix( rootCam.getViewMatrix() );

                    return true;
                };
            };
            cam.setUpdateCallback( new UpdateCallback() );
            scene.addChild( cam );

            return geom;
        },

        // http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
        computeHammersleyReverse: function ( a ) {
            a = ( a << 16 | a >>> 16 ) >>> 0;
            a = ( ( a & 1431655765 ) << 1 | ( a & 2863311530 ) >>> 1 ) >>> 0;
            a = ( ( a & 858993459 ) << 2 | ( a & 3435973836 ) >>> 2 ) >>> 0;
            a = ( ( a & 252645135 ) << 4 | ( a & 4042322160 ) >>> 4 ) >>> 0;
            return ( ( ( a & 16711935 ) << 8 | ( a & 4278255360 ) >>> 8 ) >>> 0 ) / 4294967296;
        },

        computeHammersleySequence: function ( size ) {
            this._hammersley = [];
            for ( var i = 0; i < size; i++ ) {
                var u = i / size;
                var v = this.computeHammersleyReverse( i );
                this._hammersley.push( u );
                this._hammersley.push( v );
            }
            console.log( this._hammersley );
            return this._hammersley;
        },


        getModel: function ( url, callback ) {
            var self = this;


            var node = new osg.MatrixTransform();
            node.setMatrix( osg.Matrix.makeRotate( -Math.PI / 2, 1, 0, 0, [] ) );

            var loadModel = function ( url, cbfunc ) {

                osg.log( 'loading ' + url );
                var req = new XMLHttpRequest();
                req.open( 'GET', url, true );

                var array = url.split( '/' );
                array.length = array.length - 1;
                if ( array.length <= 0 ) {
                    osg.error( 'can\'t find prefix to load subdata' );
                }
                var prefixURL = array.join( '/' ) + '/';
                var opts = {
                    prefixURL: prefixURL
                };

                var defer = Q.defer();

                req.onreadystatechange = function ( aEvt ) {

                    if ( req.readyState === 4 ) {
                        if ( req.status === 200 ) {
                            Q.when( osgDB.parseSceneGraph( JSON.parse( req.responseText ), opts ) ).then( function ( child ) {
                                node.addChild( child );
                                //removeLoading( node, child );
                                osg.log( 'success ' + url );

                                var cbPromise = true;
                                if ( cbfunc ) {
                                    cbPromise = cbfunc.call( this, child );
                                }

                                Q( cbPromise ).then( function () {
                                    defer.resolve( node );
                                } );


                            }.bind( this ) ).fail( function ( error ) {

                                defer.reject( error );

                            } );

                        } else {
                            // removeLoading( node );
                            osg.log( 'error ' + url );
                            defer.reject( node );
                        }
                    }
                }.bind( this );
                req.send( null );
                // addLoading();

                return defer.promise;

            }.bind( this );

            return loadModel( url, callback );
        },

        readImageURL: function ( url, options ) {
            var ext = url.split( '.' ).pop();
            if ( ext === 'hdr' )
                return osgDB.readImageHDR( url, options );

            return osgDB.readImageURL.call( this, url, options );
        }


    };


    // convert rgbe image to mipmap

    var NodeGenerateMipMapRGBE = function ( texture ) {
        osg.Node.call( this );
        this._texture = texture;

        var nbMip = Math.log( this._texture.getImage().getWidth() ) / Math.log( 2 );
        this._nbMipmap = nbMip - 1;

        var UpdateCallback = function () {
            this._done = false;
            this.update = function ( node, nodeVisitor ) {

                if ( nodeVisitor.getVisitorType() === osg.NodeVisitor.UPDATE_VISITOR ) {
                    if ( this._done )
                        node.setNodeMask( 0 );
                    else
                        this.done = true;
                }
            };
        };
        this.setUpdateCallback( new UpdateCallback() );

    };

    NodeGenerateMipMapRGBE.prototype = osg.objectInherit( osg.Node.prototype, {

        createSubGraph: function ( sourceTexture, destinationTexture, color ) {
            var composer = new osgUtil.Composer();
            var reduce = new osgUtil.Composer.Filter.Custom( [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'uniform sampler2D source;',
                'varying vec2 FragTexCoord0;',
                'uniform vec3 color;',

                'vec4 textureRGBE(const in sampler2D texture, const in vec2 uv) {',
                '    vec4 rgbe = texture2D(texture, uv );',

                '    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
                '    return vec4(rgbe.rgb * 255.0 * f, 1.0);',
                '}',

                'void main() {',
                '  vec3 decode = textureRGBE(source, FragTexCoord0).rgb;',
                '  gl_FragColor = vec4(decode, 1.0);',
                '}',
                ''
            ].join( '\n' ), {
                'source': sourceTexture,
                'color': color
            } );

            composer.addPass( reduce, destinationTexture );
            composer.build();
            return composer;
        },

        createSubGraphFinal: function ( sourceTexture, destinationTexture ) {

            var composer = new osgUtil.Composer();
            var copy = new osgUtil.Composer.Filter.Custom( [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'uniform sampler2D source;',
                'uniform float destSize;',
                'uniform float sourceSize;',

                'void main() {',
                '  float offset = sourceSize/2.0;',
                '  if ( gl_FragCoord.x >= sourceSize || ',
                '        gl_FragCoord.y < offset  || gl_FragCoord.y > offset + sourceSize/2.0 ) {',
                '      discard;',
                '      return;',
                '  }',

                '  vec2 uv = vec2( gl_FragCoord.x/sourceSize, (gl_FragCoord.y - offset) / sourceSize/2.0 );',
                '  gl_FragColor = texture2D(source, uv);',
                '}',
                ''
            ].join( '\n' ), {
                'source': sourceTexture,
                'destSize': destinationTexture.getWidth(),
                'sourceSize': sourceTexture.getWidth()
            } );

            composer.addPass( copy, destinationTexture );
            composer.build();
            return composer;
        },

        init: function () {

            var sourceTexture = this._texture;
            var finalTexture = new osg.Texture();
            finalTexture.setMinFilter( 'NEAREST' );
            finalTexture.setMagFilter( 'NEAREST' );

            this._finalTexture = finalTexture;

            var maxSize = Math.pow( 2, this._nbMipmap );
            finalTexture.setTextureSize( maxSize, maxSize );

            var colors = [
                [ 1, 0, 0 ],
                [ 0, 1, 0 ],
                [ 0, 0, 1 ]
            ];

            var root = new osg.Node();

            for ( var i = 0; i < this._nbMipmap; i++ ) {
                var size = Math.pow( 2, this._nbMipmap - i );

                var destinationTexture = new osg.Texture();
                destinationTexture.setMinFilter( 'NEAREST' );
                destinationTexture.setMagFilter( 'NEAREST' );

                destinationTexture.setTextureSize( size, size / 2 );
                var node = this.createSubGraph( sourceTexture, destinationTexture, colors[ i % 3 ] );

                var final = this.createSubGraphFinal( destinationTexture, finalTexture );
                node.addChild( final );
                root.addChild( node );
                sourceTexture = destinationTexture;
            }

            this.addChild( root );
        }


    } );


    // convert rgbe image to float texture
    var TransformRGBE2FloatTexture = function ( texture ) {
        osg.Node.call( this );
        this._texture = texture;


        var UpdateCallback = function () {
            this._done = false;
            this.update = function ( node, nodeVisitor ) {

                if ( nodeVisitor.getVisitorType() === osg.NodeVisitor.UPDATE_VISITOR ) {
                    if ( this._done )
                        node.setNodeMask( 0 );
                    else
                        this.done = true;
                }
            };
        };
        this.setUpdateCallback( new UpdateCallback() );

    };

    TransformRGBE2FloatTexture.prototype = osg.objectInherit( osg.Node.prototype, {

        createSubGraph: function ( sourceTexture, destinationTexture, color ) {
            var composer = new osgUtil.Composer();
            var reduce = new osgUtil.Composer.Filter.Custom( [
                '#ifdef GL_ES',
                'precision highp float;',
                '#endif',

                'uniform sampler2D source;',
                'varying vec2 FragTexCoord0;',
                'uniform vec3 color;',

                'vec4 textureRGBE(const in sampler2D texture, const in vec2 uv) {',
                '    vec4 rgbe = texture2D(texture, uv );',

                '    float f = pow(2.0, rgbe.w * 255.0 - (128.0 + 8.0));',
                '    return vec4(rgbe.rgb * 255.0 * f, 1.0);',
                '}',

                'void main() {',
                '  vec3 decode = textureRGBE(source, FragTexCoord0).rgb;',
                '  //gl_FragColor = vec4(vec3(1.0,0.0,1.0), 1.0);',
                '  gl_FragColor = vec4(decode, 1.0);',
                '}',
                ''
            ].join( '\n' ), {
                'source': sourceTexture,
                'color': color
            } );

            composer.addPass( reduce, destinationTexture );
            composer.build();
            return composer;
        },


        init: function () {

            var sourceTexture = this._texture;
            var finalTexture = new osg.Texture();
            finalTexture.setTextureSize( sourceTexture.getImage().getWidth(), sourceTexture.getImage().getHeight() );
            finalTexture.setType( 'FLOAT' );
            finalTexture.setMinFilter( 'LINEAR' );
            finalTexture.setMagFilter( 'LINEAR' );
            // finalTexture.setMinFilter( 'LINEAR' );
            // finalTexture.setMagFilter( 'LINEAR' );

            this._finalTexture = finalTexture;
            var composer = this.createSubGraph( sourceTexture, finalTexture, [ 5, 0, 5 ] );
            this.addChild( composer );

            // add an attribute to work around this bug
            // https://github.com/cedricpinson/osgjs/issues/78
            composer.getOrCreateStateSet().setAttributeAndModes( new osg.Viewport( 0, 0, finalTexture.getWidth(), finalTexture.getHeight() ) );

        }


    } );


    window.PBR = PBRExample;

    if ( !window.dontAutoLoad )
        window.addEventListener( 'load', function () {
            var example = new PBRExample( {
                datgui: true
            } );
            var canvas = $('#View')[0];
            example.run( canvas );
        }, true );

} )();
