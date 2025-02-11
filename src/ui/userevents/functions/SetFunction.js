/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import utils from '../../../ui/utils.js';
import AnimationRegistry from '../../animations/AnimationRegistry.js';
import ValueAnimation from '../../animations/ValueAnimation.js';
import { encodeColor, parseColor } from '../../colors.js';
import EventBus from '../../components/editor/EventBus';
import Shape from '../../components/editor/items/shapes/Shape.js';
import { getItemPropertyDescriptionForShape } from '../../scheme/Item.js';


function playAnimation(item, args, resultCallback, updateCallback) {
    AnimationRegistry.play(new ValueAnimation({
        durationMillis: args.animationDuration * 1000.0,
        animationType: args.transition,
        update: updateCallback,
        destroy() {
            resultCallback();
        }
    }), item.id);
}

function animateGradientColor(item, args, resultCallback, startGradient, endGradient) {
    if (startGradient.colors.length !== endGradient.colors.length) {
        return false;
    }

    utils.setObjectProperty(item, args.field, {
        type: 'gradient',
        gradient: {
            ...startGradient,
            type: endGradient.type
        }
    });

    const color = utils.getObjectProperty(item, args.field);
    const originalDirection = startGradient.direction;

    const decodedColors = [];
    for (let i = 0; i < endGradient.colors.length; i++) {
        decodedColors[i] = {
            start: parseColor(startGradient.colors[i].c),
            startPos: startGradient.colors[i].p,
            end: parseColor(endGradient.colors[i].c),
            endPos: endGradient.colors[i].p,
        }
    }

    playAnimation(item, args, resultCallback, t => {
        color.gradient.direction = originalDirection * (1 - t) + endGradient.direction * t;
        color.gradient.colors.forEach((c, i) => {
            c.c = encodeColor({
                r: decodedColors[i].start.r * (1 - t) + decodedColors[i].end.r * t,
                g: decodedColors[i].start.g * (1 - t) + decodedColors[i].end.g * t,
                b: decodedColors[i].start.b * (1 - t) + decodedColors[i].end.b * t,
                a: decodedColors[i].start.a * (1 - t) + decodedColors[i].end.a * t,
            });
            c.p = decodedColors[i].startPos * (1 - t) + decodedColors[i].endPos * t;
        });
        EventBus.emitItemChanged(item.id);
    });
    return true;
}

function animateAdvancedColor(item, args, resultCallback, startValue) {
    if (typeof args.value !== 'object' || typeof startValue !== 'object') {
        return false;
    }
    if (args.value.type === 'solid' && startValue.type === 'solid') {
        const startColor = parseColor(startValue.color);
        const endColor = parseColor(args.value.color);
        playAnimation(item, args, resultCallback, (t) => {
            utils.setObjectProperty(item, args.field, {
                type: 'solid',
                color: encodeColor({
                    r: startColor.r * (1 - t) + endColor.r * t,
                    g: startColor.g * (1 - t) + endColor.g * t,
                    b: startColor.b * (1 - t) + endColor.b * t,
                    a: startColor.a * (1 - t) + endColor.a * t,
                })
            });
            EventBus.emitItemChanged(item.id);
        });
        return true;
    }
    if (args.value.type === 'gradient' && startValue.type === 'gradient') {
        return animateGradientColor(item, args, resultCallback, startValue.gradient, args.value.gradient);
    }
    return false;
}

function animateValue(item, args, resultCallback) {
    const property = getItemPropertyDescriptionForShape(Shape.find(item.shape), args.field);
    if (!property) {
        resultCallback();
        return;
    }
    const startValue = utils.getObjectProperty(item, args.field);

    if (property.type === 'number') {
        playAnimation(item, args, resultCallback, (t) => {
            utils.setObjectProperty(item, args.field, startValue * (1 - t) + args.value * t);
            EventBus.emitItemChanged(item.id);
        });
    } else if (property.type === 'color') {
        const startColor = parseColor(startValue);
        const endColor = parseColor(args.value);
        playAnimation(item, args, resultCallback, (t) => {
            utils.setObjectProperty(item, args.field, encodeColor({
                r: startColor.r * (1 - t) + endColor.r * t,
                g: startColor.g * (1 - t) + endColor.g * t,
                b: startColor.b * (1 - t) + endColor.b * t,
                a: startColor.a * (1 - t) + endColor.a * t,
            }));
            EventBus.emitItemChanged(item.id);
        });
    } else if (property.type === 'advanced-color') {
        if (!animateAdvancedColor(item, args, resultCallback, startValue)) {
            utils.setObjectProperty(item, args.field, args.value);
            EventBus.emitItemChanged(item.id);
        }
    }
}


export default {
    name: 'Set',

    args: {
        field               : {name: 'Field', type: 'text', value: ''},
        value               : {name: 'Value', type: 'object', value: null},
        animated            : {name: 'Animated', type: 'boolean', value: false},
        animationDuration   : {name: 'Animation duration (sec)', type: 'number', value: 0.5, depends: {animated: true}},
        transition          : {name: 'Transition', type: 'choice', value: 'ease-out', options: ['linear', 'smooth', 'ease-in', 'ease-out', 'ease-in-out', 'bounce'], depends: {animated: true}},
        inBackground        : {name: 'In Background', type: 'boolean', value: false, depends: {animated: true}, description: 'Play animation in background without blocking invokation of other actions'}
    },

    execute(item, args, schemeContainer, userEventBus, resultCallback) {
        if (!item || !args.hasOwnProperty('field') || !args.hasOwnProperty('value')) {
            resultCallback();
            return;
        }
        
        if (args.animated) {
            if (args.inBackground) {
                resultCallback();
            }
            animateValue(item, args, () =>{
                if (!args.inBackground) {
                    resultCallback();
                }
            });
        } else {
            utils.setObjectProperty(item, args.field, args.value);
            EventBus.emitItemChanged(item.id);
            resultCallback();
        }
    }
};
