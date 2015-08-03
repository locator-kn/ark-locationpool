'use strict';
var Joi = require('joi');

/**
 * Success Json to test against
 */
exports.successObject = Joi.object().keys({
    ok: Joi.boolean().valid(true),
    id: Joi.string().required(),
    rev: Joi.string().required()
});

exports.locationPost = {
    title: 'testLocation',
    description: 'testLocationDescription',

    city: {
        title: 'Konstanz',
        place_id: 'ChIJWx8MOBv2mkcR0JnfpbdrHwQ',
        id: '58433437e7710a957cd798b0774a79385389035b'
    },

    geotag: {
        long: 9.169710874557495,
        lat: 47.668906023791884
    },

    tags: ['foo', 'bar']
};

exports.locationPut = {
    title: 'testLocation',
    description: 'testLocationDescription',

    city: {
        title: 'Konstanz',
        place_id: 'ChIJWx8MOBv2mkcR0JnfpbdrHwQ',
        id: '58433437e7710a957cd798b0774a79385389035b'
    },

    geotag: {
        long: 9.169710874557495,
        lat: 47.668906023791884
    },

    tags: ['foo', 'bar']
};
