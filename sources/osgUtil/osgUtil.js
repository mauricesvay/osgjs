define( [
    'osgUtil/Composer',
    'osgUtil/IntersectVisitor',
    'osgUtil/ParameterVisitor',
    'osgUtil/TangentSpaceGenerator',
    'osgUtil/TriangleIntersect',
    'osgUtil/Oculus'
], function ( Composer, IntersectVisitor, ParameterVisitor, TangentSpaceGenerator, TriangleIntersect, Oculus ) {

    'use strict';

    var osgUtil = {};

    osgUtil.Composer = Composer;
    osgUtil.IntersectVisitor = IntersectVisitor;
    osgUtil.ParameterVisitor = ParameterVisitor;
    osgUtil.TangentSpaceGenerator = TangentSpaceGenerator;
    osgUtil.TriangleIntersect = TriangleIntersect;
    osgUtil.Oculus = Oculus;

    return osgUtil;
} );
