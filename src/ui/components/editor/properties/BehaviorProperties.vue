<!-- This Source Code Form is subject to the terms of the Mozilla Public
     License, v. 2.0. If a copy of the MPL was not distributed with this
     file, You can obtain one at https://mozilla.org/MPL/2.0/. -->
<template>
    <div @dragend="onDragEnd">
        <panel v-if="!extended" uid="behavior-tags" name="Tags">
            <vue-tags-input v-model="itemTag"
                :tags="itemTags"
                :autocomplete-items="filteredItemTagsSuggestions"
                @tags-changed="onItemTagsChange"
                ></vue-tags-input>
        </panel>

        <div class="hint" v-if="item.behavior.events.length === 0">There are no events defined for this item yet. Start by adding an event</div>

        <div class="behavior-container" :class="{extended: extended}" v-for="(event, eventIndex) in item.behavior.events">
            <div class="behavior-event" @dragover="onDragOverToEvent(eventIndex)">
                <div class="behavior-menu">
                    <span class="link icon-collapse" @click="toggleBehaviorCollapse(eventIndex)">
                        <i class="fas" :class="[eventMetas[eventIndex] && eventMetas[eventIndex].collapsed?'fa-caret-right':'fa-caret-down']"/>
                    </span>
                </div>
                
                <dropdown
                    :options="eventOptions"
                    :auto-focus-search="isStandardEvent(event.event)"
                    @selected="onBehaviorEventSelected(eventIndex, arguments[0])"
                    :inline="true"
                    :borderless="true"
                    >
                    <span class="icon-event"><i class="fas fa-bell"></i></span>
                    <span v-if="isStandardEvent(event.event)">{{event.event | toPrettyEventName}}</span>
                    <input v-else :id="`custom-event-textfield-${item.id}-${eventIndex}`" class="custom-event-textfield" type="text" :value="event.event" @input="event.event = arguments[0].target.value"/>
                </dropdown>
            </div>


            <div v-if="! (eventMetas[eventIndex] && eventMetas[eventIndex].collapsed)">
                <div class="hint hint-small" v-if="event.actions.length === 0">This event has no actions yet...</div>

                <div class="behavior-action-container behavior-drop-highlight" v-if="dragging.readyToDrop && dragging.dropTo.eventIndex === eventIndex && dragging.dropTo.actionIndex === 0 && (!event.actions || event.actions.length === 0)"
                    v-html="dragging.action">
                </div>
                <div v-for="(action, actionIndex) in event.actions">
                    <div class="behavior-action-container behavior-drop-highlight" v-if="dragging.readyToDrop && dragging.dropTo.eventIndex === eventIndex && dragging.dropTo.actionIndex === actionIndex"
                        v-html="dragging.action">
                    </div>
                    <div class="behavior-action-container"
                        :id="`behavior-action-container-${item.id}-${eventIndex}-${actionIndex}`"
                        @dragover="onDragOverToAction(eventIndex, actionIndex, arguments[0])"
                        :class="{'dragged': dragging.readyToDrop && eventIndex === dragging.eventIndex && actionIndex === dragging.actionIndex}"
                        >
                        <div class="icon-container">
                            <span class="link icon-delete" @click="removeAction(eventIndex, actionIndex)"><i class="fas fa-times"/></span>
                            <span class="link icon-move" draggable="true" @dragstart="onActionDragStarted(eventIndex, actionIndex)"><i class="fas fa-arrows-alt"/></span>
                        </div>
                        <div>
                            <element-picker
                                :element="action.element" 
                                :scheme-container="schemeContainer"
                                :self-item="item"
                                :inline="true"
                                :borderless="true"
                                @selected="onActionElementSelected(eventIndex, actionIndex, arguments[0])"
                                />
                        </div>
                        <div class="behavior-goto-element" title="Double click to jump to element" @dblclick="jumpToElement(action.element)">: </div>
                        <div>
                            <dropdown
                                :key="action.element.item"
                                :options="createMethodSuggestionsForElement(action.element)"
                                @selected="onActionMethodSelected(eventIndex, actionIndex, arguments[0])"
                                :inline="true"
                                :borderless="true"
                                >
                                <span v-if="action.method === 'set'"><i class="fas fa-cog"></i> {{action.args.field | toPrettyPropertyName(action.element, item, schemeContainer)}}</span>
                                <span class="behavior-function" v-if="action.method !== 'set' && action.method !== 'sendEvent'">{{action.method | toPrettyMethod(action.element) }} </span>
                                <span class="behavior-function" v-if="action.method === 'sendEvent'"><i class="icon fas fa-play"></i> {{action.args.event}} </span>
                            </dropdown>
                            <span v-if="action.method !== 'set' && action.method !== 'sendEvent' && action.args && Object.keys(action.args).length > 0"
                                class="action-method-arguments-expand"
                                @click="showFunctionArgumentsEditor(action, eventIndex, actionIndex)"
                                title="Edit function arguments"
                                >{{action | toPrettyActionArgs}}</span>
                        </div>

                        <span v-if="action.method === 'set'" class="function-brackets"> = </span>

                        <set-argument-editor v-if="action.method === 'set'"
                            :key="action.args.field"
                            :argument-description="getArgumentDescriptionForElement(action.element, action.args.field)"
                            :argument-value="action.args.value"
                            :args="action.args"
                            @changed="onArgumentValueChangeForSet(eventIndex, actionIndex, arguments[0])"
                            />
                    </div>
                </div>

                <div class="behavior-action-container behavior-drop-highlight" v-if="dragging.readyToDrop && dragging.dropTo.eventIndex === eventIndex && dragging.dropTo.actionIndex > 0 && dragging.dropTo.actionIndex >= event.actions.length"
                    v-html="dragging.action">
                </div>

                <div class="behavior-event-operations">
                    <span class="btn btn-small btn-secondary" @click="addActionToEvent(eventIndex)">+ Action</span>
                    <span class="btn btn-small btn-secondary" @click="duplicateBehavior(eventIndex)">Duplicate</span>
                    <span class="btn btn-small btn-secondary" @click="copyEvent(eventIndex)">Copy Event</span>
                    <span class="btn btn-small btn-secondary" v-if="eventIndex > 0" @click="moveEventInOrder(eventIndex, eventIndex - 1)" title="Move event up"><i class="fas fa-caret-up"></i></span>
                    <span class="btn btn-small btn-secondary" v-if="eventIndex < item.behavior.events.length - 1" @click="moveEventInOrder(eventIndex, eventIndex + 1)" title="Move event down"><i class="fas fa-caret-down"></i></span>
                    <span class="btn btn-small btn-danger" @click="removeBehaviorEvent(eventIndex)">Delete</span>
                </div>
            </div>
        </div>

        <span class="btn btn-secondary" @click="addBehaviorEvent()">+ Event</span>
        <span class="btn btn-secondary" @click="copyAllEvents()">Copy all events</span>
        <span class="btn btn-secondary" @click="pasteEvents()">Paste events</span>

        <function-arguments-editor v-if="functionArgumentsEditor.shown"
            :function-description="functionArgumentsEditor.functionDescription"
            :args="functionArgumentsEditor.args"
            :scheme-container="schemeContainer"
            @close="functionArgumentsEditor.shown = false"
            @argument-changed="onFunctionArgumentsEditorChange"
        />
    </div>
</template>

<script>
import values from 'lodash/values';
import sortBy from 'lodash/sortBy';
import map from 'lodash/map';
import forEach from 'lodash/forEach';
import filter from 'lodash/filter';
import uniq from 'lodash/uniq';
import indexOf from 'lodash/indexOf';
import mapValues from 'lodash/mapValues';
import find from 'lodash/find';

import shortid from 'shortid';
import VueTagsInput from '@johmun/vue-tags-input';
import utils from '../../../utils.js';
import Shape from '../items/shapes/Shape.js'
import Dropdown from '../../Dropdown.vue';
import Panel from '../Panel.vue';
import Functions from '../../../userevents/functions/Functions.js';
import Events from '../../../userevents/Events.js';
import ElementPicker from '../ElementPicker.vue';
import SetArgumentEditor from './behavior/SetArgumentEditor.vue';
import FunctionArgumentsEditor from '../FunctionArgumentsEditor.vue';
import EventBus from '../EventBus.js';
import {createSettingStorageFromLocalStorage} from '../../../LimitedSettingsStorage';
import {textSlotProperties, coreItemPropertyTypes, getItemPropertyDescriptionForShape} from '../../../scheme/Item';
import { copyObjectToClipboard, getObjectFromClipboard } from '../../../clipboard.js';
import StoreUtils from '../../../store/StoreUtils.js';

const standardItemEvents = sortBy(values(Events.standardEvents), event => event.name);
const standardItemEventIds = map(standardItemEvents, event => event.id);

const behaviorCollapseStateStorage = createSettingStorageFromLocalStorage('behavior-collapse', 400);

function sanitizeAction(action) {
    const newAction = {...action};
    delete newAction.id;
    return newAction;
}
function sanitizeEvent(event) {
    return {
        event: event.event,
        actions: map(event.actions, sanitizeAction)
    };
}

export default {
    props: {
        item: Object,
        schemeContainer: Object,
        extended: { type: Boolean, default: false }
    },

    components: {Dropdown, ElementPicker, SetArgumentEditor, Panel, FunctionArgumentsEditor, VueTagsInput},

    mounted() {
        document.body.addEventListener('mouseup', this.onMouseUp);
    },
    beforeDestroy() {
        document.body.removeEventListener('mouseup', this.onMouseUp);
    },

    data() {
        const items = sortBy(
            map(
                this.schemeContainer.getItems(),
                item => {return {id: item.id, name: item.name || 'Unnamed'}}
            ),
            item => item.name
        );

        const eventMetas = map(this.item.behavior.events, this.createBehaviorEventMeta);
        forEach(eventMetas, (meta, index) => {
            const collapsed = behaviorCollapseStateStorage.get(`${this.schemeContainer.scheme.id}/${this.item.id}/${index}`, 0);
            meta.collapsed = collapsed === 1 ? true: false;
        });

        return {
            items: items,
            eventOptions: this.createEventOptions(),
            eventMetas: eventMetas,
            functionArgumentsEditor: {
                shown: false,
                functionDescription: null,
                eventIndex: 0,
                actionIndex: 0,
                args: {}
            },
            itemTag: '',
            existingItemTags: map(this.schemeContainer.itemTags, tag => {return {text: tag}}),

            dragging: {
                action: null,
                eventIndex: -1,
                actionIndex: -1,
                readyToDrop: false,
                dropTo: {
                    eventIndex: -1,
                    actionIndex: -1,
                }
            }
        };
    },

    methods: {
        createBehaviorEventMeta(behaviorEvent) {
            return {
                collapsed: false
            };
        },

        onItemTagsChange(newTags) {
            this.$emit('item-field-changed', 'tags', map(newTags, tag => tag.text));
        },

        toggleBehaviorCollapse(eventIndex) {
            this.eventMetas[eventIndex].collapsed = !this.eventMetas[eventIndex].collapsed;
            behaviorCollapseStateStorage.save(`${this.schemeContainer.scheme.id}/${this.item.id}/${eventIndex}`, this.eventMetas[eventIndex].collapsed ? 1 : 0);
        },

        moveEventInOrder(srcIndex, dstIndex)  {
            if (dstIndex < 0 || dstIndex >= this.item.behavior.events.length) {
                return;
            }

            let temp = this.item.behavior.events[srcIndex];
            this.item.behavior.events[srcIndex] = this.item.behavior.events[dstIndex];
            this.item.behavior.events[dstIndex] = temp;

            temp = this.eventMetas[srcIndex];
            this.eventMetas[srcIndex] = this.eventMetas[dstIndex];
            this.eventMetas[dstIndex] = temp;

            this.$forceUpdate();
        },

        findElement(selector) {
            const elements = this.schemeContainer.findElementsBySelector(selector, this.item);
            if (elements.length > 0) {
                return elements[0];
            }
            return null;
        },

        createEventOptions() {
            let eventOptions = [];
                
            const shape = Shape.find(this.item.shape);
            if (shape) {

                const itemEvents = shape.getEvents(this.item);
                if (itemEvents.length > 500) {
                    itemEvents.length = 500;
                }
                eventOptions = standardItemEvents.concat(map(itemEvents, event => {return {id: event.name, name: event.name}}));
            }

            eventOptions.push({
                id: 'custom-event',
                name: 'Custom event ...'
            });
            return eventOptions;
        },

        createMethodSuggestionsForElement(element) {
            const item = this.findElement(element);
            if (!item) {
                return [];
            }

            const methods = [];

            forEach(Functions.main, (func, funcId) => {
                if (funcId !== 'set' && funcId !== 'sendEvent') {
                    let shouldAddMethod = true;

                    if (func.supportedShapes) {
                        let foundShape = false;
                        for (let i = 0; i < func.supportedShapes.length; i++) {
                            if (func.supportedShapes[i] === item.shape) {
                                foundShape = true;
                                break;
                            }
                        }
                        shouldAddMethod = foundShape;
                    }

                    if (shouldAddMethod) {
                        methods.push({
                            method: funcId,
                            name: func.name,
                            iconClass: 'fas fa-running',
                            description: func.description
                        });
                    }
                }
            });

            forEach(this.collectAllItemCustomEvents(item), customEvent => {
                methods.push({
                    method: 'custom-event',
                    name: customEvent,
                    event: customEvent,
                    iconClass: 'fas fa-running'
                });
            });

            methods.sort((a,b) => {
                if (a.name < b.name) {
                    return -1;
                } else {
                    return 1;
                }
            });

            const properties= [{
                method: 'set',
                name: 'Opacity',
                fieldPath: 'opacity',
                iconClass: 'fas fa-cog'
            },{
                method: 'set',
                name: 'Self opacity',
                fieldPath: 'selfOpacity',
                iconClass: 'fas fa-cog'
            }];

            const shape = Shape.find(item.shape);
            if (shape) {
                forEach(shape.args, (arg, argName) => {
                    properties.push({
                        method: 'set',
                        name: arg.name,
                        fieldPath: `shapeProps.${argName}`,
                        iconClass: 'fas fa-cog'
                    });
                });
            }

            forEach(shape.getTextSlots(item), textSlot => {
                forEach(textSlotProperties, textSlotProperty => {
                    properties.push({
                        method: 'set',
                        name: `Text / ${textSlot.name} / ${textSlotProperty.name}`,
                        fieldPath: `textSlots.${textSlot.name}.${textSlotProperty.field}`,
                        iconClass: 'fas fa-cog'
                    });
                });
            });

            properties.sort((a,b) => {
                if (a.name < b.name) {
                    return -1;
                } else {
                    return 1;
                }
            });

            return methods.concat(properties);
        },

        collectAllItemCustomEvents(item) {
            if (!item.behavior.events) {
                return [];
            }
            const filteredEvents = filter(item.behavior.events, event => {
                return !this.isStandardEvent(event.event);
            });

            return uniq(map(filteredEvents, event => event.event));
        },

        isStandardEvent(event) {
            return indexOf(standardItemEventIds, event) >= 0;
        },

        addBehaviorEvent() {
            if (!this.item.behavior.events) {
                this.item.behavior.events = [];
            }
            const newEvent = {
                id: shortid.generate(),
                event: 'clicked',
                actions: []
            };
            this.item.behavior.events.push(newEvent);
            this.eventMetas.push(this.createBehaviorEventMeta(newEvent));
            this.emitChangeCommited();
            this.$forceUpdate();
        },

        copyAllEvents() {
            copyObjectToClipboard('behavior-events', map(this.item.behavior.events, sanitizeEvent)).then(() => {
                StoreUtils.addInfoSystemMessage(this.$store, 'Copied all events');
            });
        },

        copyEvent(eventIndex) {
            const event = this.item.behavior.events[eventIndex];
            copyObjectToClipboard('behavior-events', [sanitizeEvent(event)]).then(() => {
                StoreUtils.addInfoSystemMessage(this.$store, `Copied "${event.event}" event`);
            });
        },

        pasteEvents() {
            getObjectFromClipboard('behavior-events').then(events => {
                if (events && events.length > 0) {
                    forEach(events, event => {
                        event.id = shortid.generate();
                        forEach(event.actions, action => {
                            action.id = shortid.generate();
                        });
                        this.item.behavior.events.push(event);
                    });
                    EventBus.emitSchemeChangeCommited();
                }
            });
        },

        removeBehaviorEvent(eventIndex) {
            this.item.behavior.events.splice(eventIndex, 1);
            this.eventMetas.splice(eventIndex, 1)
            this.emitChangeCommited();
        },
        
        onBehaviorEventSelected(eventIndex, eventOption) {
            if (eventOption.id === 'custom-event') {
                this.item.behavior.events[eventIndex].event = 'Unknown event...';

                this.$nextTick(() => {
                    const textfield = document.getElementById(`custom-event-textfield-${this.item.id}-${eventIndex}`);
                    if (textfield) {
                        textfield.focus();
                    }
                });
                
            } else {
                this.item.behavior.events[eventIndex].event = eventOption.id;
            }
            this.emitChangeCommited();
        },

        addActionToEvent(eventIndex) {
            const event = this.item.behavior.events[eventIndex];
            if (!event.actions) {
                event.actions = [];
            }

            let element = 'self';

            if (event.actions.length > 0) {
                // picking element from the last action
                element = event.actions[event.actions.length - 1].element;
            }
            event.actions.push({
                id: shortid.generate(),
                element,
                method: 'show',
                args: mapValues(Functions.main.show.args, arg => arg.value)
            });
            this.emitChangeCommited();
        },

        removeAction(eventIndex, actionIndex) {
            this.item.behavior.events[eventIndex].actions.splice(actionIndex, 1);
            this.emitChangeCommited();
        },

        onActionElementSelected(eventIndex, actionIndex, element) {
            this.item.behavior.events[eventIndex].actions[actionIndex].element = element;
            this.emitChangeCommited();
        },

        onActionMethodSelected(eventIndex, actionIndex, methodOption) {
            const action = this.item.behavior.events[eventIndex].actions[actionIndex];
            if (!action) {
                return;
            }
            if (methodOption.method === 'set') {
                action.method = methodOption.method;
                const args = {
                    field: methodOption.fieldPath,
                    value: '',
                    animated: false,
                    animationDuration: 0.5,
                    transition: 'ease-in-out',
                    inBackground: false
                };

                const element = this.findElement(action.element);
                if (element) {
                    args.value = utils.getObjectProperty(element, methodOption.fieldPath);
                }
                action.args = args;
            } else if (methodOption.method === 'custom-event') {
                action.method = 'sendEvent';
                action.args = {event: methodOption.event};
            } else {
                action.method = methodOption.method;
                action.args = this.getDefaultArgsForMethod(action, methodOption.method);
            }
            this.emitChangeCommited();
        },

        getDefaultArgsForMethod(action, method) {
            let functions = Functions.main;

            if (functions[method]) {
                const functionArgs = functions[method].args;
                if (functionArgs) {
                    const args = {};

                    forEach(functionArgs, (arg, argName) => {
                        args[argName] = arg.value;
                    });

                    return args;
                }
            }
            return {};
        },

        getArgumentDescriptionForElement(element, propertyPath) {
            const entity = this.findElement(element);
            if (entity && entity.shape) {
                const descriptor = getItemPropertyDescriptionForShape(Shape.find(entity.shape), propertyPath);
                if (descriptor) {
                    return descriptor;
                }
            }
            
            return {type: 'string'};
        },

        onArgumentValueChangeForSet(eventIndex, actionIndex, value) {
            this.item.behavior.events[eventIndex].actions[actionIndex].args.value = value;
            const propertyName = this.item.behavior.events[eventIndex].actions[actionIndex].args.field;
            this.emitChangeCommited(`${this.item.id}.behavior.events.${eventIndex}.actions.${actionIndex}.args.${propertyName}`);
        },

        duplicateBehavior(eventIndex) {
            const newEvent = utils.clone(this.item.behavior.events[eventIndex]);
            this.item.behavior.events.push(newEvent);
            this.eventMetas.push(this.createBehaviorEventMeta(newEvent));
            this.emitChangeCommited();
            this.$forceUpdate();
        },

        emitChangeCommited(affinityId) {
            EventBus.emitItemChanged(this.item.id);
            EventBus.emitSchemeChangeCommited(affinityId);
        },

        showFunctionArgumentsEditor(action, eventIndex, actionIndex) {
            let functionDescription = Functions.main[action.method];

            if (!functionDescription) {
                functionDescription = {
                    args: {}
                };
            }
            this.functionArgumentsEditor.functionDescription = functionDescription;
            this.functionArgumentsEditor.args = action.args;
            this.functionArgumentsEditor.eventIndex = eventIndex;
            this.functionArgumentsEditor.actionIndex = actionIndex;
            this.functionArgumentsEditor.shown = true;
        },

        onFunctionArgumentsEditorChange(argName, value) {
            const eventIndex = this.functionArgumentsEditor.eventIndex
            const actionIndex   = this.functionArgumentsEditor.actionIndex;

            if (eventIndex < this.item.behavior.events.length) {
                const event = this.item.behavior.events[eventIndex];
                if (actionIndex < event.actions.length) {
                    event.actions[actionIndex].args[argName] = value;
                }
            }
            EventBus.emitSchemeChangeCommited(`items.${this.item.id}.behavior.events.${eventIndex}.actions.${actionIndex}.args.${argName}`);
        },

        onActionDragStarted(eventIndex, actionIndex) {
            let name = 'Drop here';
            // TODO refactor to use $ref
            const domActionContainer = document.getElementById(`behavior-action-container-${this.item.id}-${eventIndex}-${actionIndex}`);
            if (domActionContainer) {
                name = domActionContainer.innerHTML;
            }
            this.dragging.action = name;


            this.dragging.eventIndex = eventIndex;
            this.dragging.actionIndex = actionIndex;
            this.dragging.dropTo.eventIndex = -1;
            this.dragging.dropTo.actionIndex = -1;
        },

        onDragOverToEvent(eventIndex) {
            this.dragging.dropTo.eventIndex = eventIndex;
            this.dragging.dropTo.actionIndex = 0;
            this.dragging.readyToDrop = !(this.dragging.eventIndex === eventIndex && this.dragging.actionIndex === 0);
        },

        onDragOverToAction(eventIndex, actionIndex, event) {
            this.dragging.dropTo.eventIndex = eventIndex;
            this.dragging.dropTo.actionIndex = actionIndex;

            const domActionContainer = event.target.closest('.behavior-action-container');
            if (domActionContainer) {
                const containerRect = domActionContainer.getBoundingClientRect();
                const midLine = containerRect.top + containerRect.height / 2;
                const offsetToMid = event.clientY - midLine;
                if (offsetToMid > 0) {
                    this.dragging.dropTo.actionIndex = actionIndex + 1;
                }
            }
            let readyToDrop = true;
            
            if (this.dragging.eventIndex === this.dragging.dropTo.eventIndex) {
                if (this.dragging.actionIndex === this.dragging.dropTo.actionIndex || this.dragging.actionIndex === this.dragging.dropTo.actionIndex - 1) {
                    readyToDrop = false;
                }
            }
            this.dragging.readyToDrop = readyToDrop;
        },

        onMouseUp() {
            if (this.dragging.action) {
                this.$nextTick(() => {
                    this.resetDragging();
                });
            }
        },

        onDragEnd() {
            if (this.dragging.eventIndex >= 0 && this.dragging.actionIndex >= 0 && this.dragging.dropTo.eventIndex >= 0 && this.dragging.dropTo.actionIndex >= 0) {
                this.moveAction(this.dragging.eventIndex, this.dragging.actionIndex, this.dragging.dropTo.eventIndex, this.dragging.dropTo.actionIndex);
            }
            this.resetDragging();
        },

        resetDragging() {
            this.dragging.action = null;
            this.dragging.eventIndex = -1;
            this.dragging.actionIndex = -1;
            this.dragging.readyToDrop = false;
            this.dragging.dropTo.eventIndex = -1;
            this.dragging.dropTo.actionIndex = -1;
        },

        moveAction(srcBehaviorIndex, srcActionIndex, dstBehaviorIndex, dstActionIndex) {
            if (srcBehaviorIndex === dstBehaviorIndex && srcActionIndex === dstActionIndex) {
                return;
            }
            const action = this.item.behavior.events[srcBehaviorIndex].actions.splice(srcActionIndex, 1)[0];

            if (srcBehaviorIndex === dstBehaviorIndex && dstActionIndex > srcActionIndex) {
                // since the item was removed from the same array, we need to adjust the new destination position in the array
                dstActionIndex -= 1;
            }
            this.item.behavior.events[dstBehaviorIndex].actions.splice(dstActionIndex, 0, action);

            this.emitChangeCommited();
        },

        jumpToElement(elementSelector) {
            const item = this.schemeContainer.findFirstElementBySelector(elementSelector);
            if (item) {
                this.$emit('jumped-to-item', item);
            }
        }
    },

    filters: {
        toPrettyEventName(event) {
            if (Events.standardEvents[event]) {
                return Events.standardEvents[event].name;
            } else {
                return event;
            }
        },

        toPrettyMethod(method, element) {
            if (Functions.main[method]) {
                return Functions.main[method].name;
            } else {
                return method;
            }
        },

        toPrettyActionArgs(action) {
            if (Functions.main[action.method]) {
                const func = Functions.main[action.method];
                if (func.argsToShortString) {
                    return `( ${func.argsToShortString(action.args)} )`;
                }
            }
            return '(...)';
        },

        toPrettyPropertyName(propertyPath, element, selfItem, schemeContainer) {
            //TODO cache all item properties instead of fetching them over and over again
            if (propertyPath === 'opacity') {
                return 'Opacity';
            } else if (propertyPath.indexOf('shapeProps.') === 0) {
                let item = null;
                if (element === 'self') {
                    item = selfItem;
                } else {
                    item = schemeContainer.findFirstElementBySelector(element);
                }
                if (item && item.shape) {
                    const shape = Shape.find(item.shape);
                    const shapeArgName = propertyPath.substr('shapeProps.'.length);
                    if (shape && shape.args && shape.args.hasOwnProperty(shapeArgName)) {
                        return shape.args[shapeArgName].name;
                    } else if (shape.shapeType === 'standard' && Shape.standardShapeProps.hasOwnProperty(shapeArgName)) {
                        return Shape.standardShapeProps[shapeArgName].name;
                    }
                }
            } else if (propertyPath.indexOf('textSlots.') === 0) {
                const firstDotIdx = propertyPath.indexOf('.');
                const secondDotIdx = propertyPath.indexOf('.', firstDotIdx + 1);
                const textSlotName = propertyPath.substring(firstDotIdx + 1, secondDotIdx);
                const textSlotField = propertyPath.substring(secondDotIdx + 1);
                const fieldDescription = find(textSlotProperties, textSlotProperty => textSlotProperty.field === textSlotField);
                if (fieldDescription) {
                    return `Text / ${textSlotName} / ${fieldDescription.name}`;
                }
            }
            return propertyPath;
        }
    },

    computed: {
        filteredItemTagsSuggestions() {
            return this.existingItemTags.filter(i => new RegExp(this.itemTag, 'i').test(i.text));
        },
        itemTags() {
            return map(this.item.tags, tag => {return {text: tag}});
        }
    }
}
</script>