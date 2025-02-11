<!-- This Source Code Form is subject to the terms of the Mozilla Public
     License, v. 2.0. If a copy of the MPL was not distributed with this
     file, You can obtain one at https://mozilla.org/MPL/2.0/. -->

<template lang="html">
    <div>
        <div v-if="schemeContainer.scheme">
            <panel name="General">
                <h5 class="section">Name</h5>
                <input class="textfield" type="text" v-model="schemeContainer.scheme.name" placeholder="Scheme name ..." @change="onPropertyChange('name')"/>

                <h5 class="section">Tags</h5>
                <vue-tags-input v-model="schemeTag"
                    :tags="schemeTags"
                    :autocomplete-items="filteredSchemeTags"
                    @tags-changed="onSchemeTagChange"
                    ></vue-tags-input>

                <h5 class="section">Description</h5>
                <rich-text-editor v-model="schemeContainer.scheme.description"
                    @changed="schemeContainer.scheme.description = arguments[0]; onPropertyChange('description')"
                    ></rich-text-editor>
            </panel>

            <panel name="Screen Settings">
                <table class="properties-table">
                    <tbody>
                        <tr>
                            <td class="label" width="50%">
                                Draggable
                                <tooltip>
                                    Allows users to drag screen using mouse in view mode.
                                </tooltip>
                            </td>
                            <td class="value" width="50%">
                                <input type="checkbox" v-model="screenSettings.draggable" id="chk-screen-draggable"/>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </panel>

            <panel name="Style">
                <table class="properties-table">
                    <tbody>
                        <tr>
                            <td class="label" width="50%">Background</td>
                            <td class="value" width="50%">
                                <color-picker :color="schemeContainer.scheme.style.backgroundColor" @input="onSchemeStylePropertyChange('backgroundColor', arguments[0])"></color-picker>
                            </td>
                        </tr>
                        <tr>
                            <td class="label" width="50%">Grid</td>
                            <td class="value" width="50%">
                                <color-picker :color="schemeContainer.scheme.style.gridColor" @input="onSchemeStylePropertyChange('gridColor', arguments[0])"></color-picker>
                            </td>
                        </tr>
                        <tr>
                            <td class="label" width="50%">Bound box</td>
                            <td class="value" width="50%">
                                <color-picker :color="schemeContainer.scheme.style.boundaryBoxColor" @input="onSchemeStylePropertyChange('boundaryBoxColor', arguments[0])"></color-picker>
                            </td>
                        </tr>
                        <tr>
                            <td class="label" width="50%">Control points</td>
                            <td class="value" width="50%">
                                <color-picker :color="schemeContainer.scheme.style.controlPointsColor" @input="onSchemeStylePropertyChange('controlPointsColor', arguments[0])"></color-picker>
                            </td>
                        </tr>
                        <tr>
                            <td class="label" width="50%">Item marker</td>
                            <td class="value" width="50%">
                                <color-picker :color="schemeContainer.scheme.style.itemMarkerColor" @input="onSchemeStylePropertyChange('itemMarkerColor', arguments[0])"></color-picker>
                            </td>
                        </tr>
                        <tr>
                            <td class="label" width="50%">Item marker toggled by default
                                <tooltip>
                                    When diagram is open in view mode it will displayed markers for items that are clickable
                                </tooltip>
                            </td>
                            <td class="value" width="50%">
                                <input type="checkbox" :checked="schemeContainer.scheme.style.itemMarkerToggled" @input="onSchemeStylePropertyChange('itemMarkerToggled', arguments[0].target.checked)"/>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </panel>

            <panel name="Operations">
                <span class="btn btn-secondary" @click="$emit('clicked-advanced-behavior-editor')"><i class="fas fa-running"/> Behavior Editor</span>
                <span v-if="supportsShapeExport" class="btn btn-secondary" @click="$emit('export-all-shapes')">Export Shapes</span>
                <span v-if="supportsSchemeDeletion" class="btn btn-danger" @click="$emit('delete-diagram-requested')">Delete Diagram</span>
            </panel>

        </div>
    </div>
</template>

<script>
import VueTagsInput from '@johmun/vue-tags-input';
import EventBus from './EventBus.js';
import RichTextEditor from '../RichTextEditor.vue';
import ColorPicker from '../editor/ColorPicker.vue';
import Panel from '../editor/Panel.vue';
import map from 'lodash/map';
import indexOf from 'lodash/indexOf';
import Tooltip from '../Tooltip.vue';

export default {
    props: {
        schemeContainer: { type: Object },
    },
    components: {VueTagsInput, RichTextEditor, ColorPicker, Panel, Tooltip},
    mounted() {
        if (this.$store.state.apiClient && this.$store.state.apiClient.getTags) {
            this.$store.state.apiClient.getTags().then(tags => {
                this.existingSchemeTags = map(tags, tag => {
                    return {text: tag};
                });
            });
        }
    },
    data() {
        return {
            schemeTag: '',
            existingSchemeTags: [],
            showDeleteSchemeWarning: false,

            screenSettings: {
                draggable: this.schemeContainer.scheme.settings.screen.draggable
            },
        }
    },

    methods: {
        onSchemeStylePropertyChange(fieldName, value) {
            this.schemeContainer.scheme.style[fieldName] = value;
            this.onPropertyChange(`scheme.style.${fieldName}`);
        },

        onSchemeTagChange(newTags) {
            this.schemeContainer.scheme.tags = map(newTags, tag => tag.text);
            this.onPropertyChange('tags');
        },

        onPropertyChange(propertyName) {
            EventBus.emitSchemeChangeCommited(`scheme.${propertyName}`);
        },
    },

    computed: {
        filteredSchemeTags() {
            return this.existingSchemeTags.filter(i => new RegExp(this.schemeTag, 'i').test(i.text));
        },
        schemeTags() {
            return map(this.schemeContainer.scheme.tags, tag => {return {text: tag}});
        },

        supportsSchemeDeletion() {
            return this.$store.state.apiClient && this.$store.state.apiClient.deleteScheme;
        },

        supportsShapeExport() {
            const idxOf = indexOf(this.schemeContainer.scheme.tags, 'schemio-extra-shapes');
            return idxOf >= 0;
        }
    },

    watch: {
        'screenSettings.draggable': {
            handler(value) {
                this.schemeContainer.scheme.settings.screen.draggable = value;
                EventBus.emitSchemeChangeCommited('scheme.settings.screen.draggable');
            }
        }
    }
}
</script>

<style lang="css">
</style>
