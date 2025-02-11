<!-- This Source Code Form is subject to the terms of the Mozilla Public
     License, v. 2.0. If a copy of the MPL was not distributed with this
     file, You can obtain one at https://mozilla.org/MPL/2.0/. -->
<template>
    <modal :title="title" @close="$emit('close')" primary-button="Save" @primary-submit="saveIt">
        <table>
            <tbody>
                <tr>
                    <td>
                        <number-textfield :value="paddingLeft" name="Left" @changed="paddingLeft = arguments[0]"/>
                    </td>
                    <td>
                        <number-textfield :value="paddingTop" name="Top" @changed="paddingTop = arguments[0]"/>
                    </td>
                    <td>
                        <number-textfield :value="paddingRight" name="Width" @changed="paddingRight = arguments[0]"/>
                    </td>
                    <td>
                        <number-textfield :value="paddingBottom" name="Height" @changed="paddingBottom = arguments[0]"/>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        Placement
                        <select v-model="placement">
                            <option value="top-left">Top Left</option>
                            <option value="centered">Centered</option>
                            <option value="stretched">Stretched</option>
                        </select>
                    </td>
                    <td colspan="2">
                        <input type="checkbox" v-model="shouldExportBackground" id="chk-export-svg-background"/><label for="chk-export-svg-background"> Export SVG Background</label>
                    </td>
                </tr>
            </tbody>
        </table>

        <svg ref="svgContainer" class="export-svg-preview"
            width="100%" height="300px"
            :viewBox="`${-paddingLeft - previewPadding} ${-paddingTop - previewPadding} ${viewBoxWidth + 2*previewPadding} ${viewBoxHeight + 2*previewPadding}`"
            :preserveAspectRatio="preserveAspectRatio"
            :style="svgStyle"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xhtml="http://www.w3.org/1999/xhtml"
            xmlns:xlink="http://www.w3.org/1999/xlink" >
            <g data-preview-ignore="true">
                <rect :x="-paddingLeft" :y="-paddingTop" :width="viewBoxWidth+paddingLeft" :height="viewBoxHeight+paddingTop"
                    style="fill:none; stroke-width:1; stroke:rgba(100,100,255, 0.2)"
                    :style="{'stroke-width': previewStrokeSize}"/>
            </g>
            <g v-html="svgHtml"></g>
        </svg>
    </modal>
</template>

<script>
import Modal from '../Modal.vue';
import NumberTextfield from '../NumberTextfield.vue';
import map from 'lodash/map';
import forEach from 'lodash/forEach';
import {rasterizeAllImagesToDataURL} from '../../svgPreview';



export default {
    props: {
        // array of {item, html} elements
        exportedItems  : { value: [], type: Array },
        width          : { value: 300, type: Number },
        height         : { value: 300, type: Number },

        // kind can be either svg or png
        kind           : { value: 'svg', type: String},
        backgroundColor: { value: 'rgba(255,255,255,1.0)', type: String}
    },

    components: {Modal, NumberTextfield},

    data() {
        const svgHtml = map(this.exportedItems, e => e.html).join('\n');

        let largestStrokeSize = 0;
        forEach(this.exportedItems, item => {
            if (!isNaN(item.item.shapeProps.strokeSize) && item.item.shapeProps.strokeSize > largestStrokeSize) {
                largestStrokeSize = item.item.shapeProps.strokeSize;
            }
        });

        const defaultPadding = Math.max(40, 2 * largestStrokeSize);
        let paddingTop = defaultPadding;
        let paddingLeft = defaultPadding;
        let paddingRight = defaultPadding;
        let paddingBottom = defaultPadding;

        if (this.width < 60 || this.height < 60) {
            paddingTop = 2 * largestStrokeSize;
            paddingLeft = 2 * largestStrokeSize;
            paddingRight = 2 * largestStrokeSize;
            paddingBottom = 2 * largestStrokeSize;
        }

        return {
            shouldExportBackground: false,
            paddingTop,
            paddingLeft,
            paddingBottom,
            paddingRight,
            largestStrokeSize,
            placement: 'centered', // can be top-left, centered, stretched
            svgHtml: svgHtml,
            previewPadding: 20
        };
    },

    methods: {
        saveIt() {
            const svgDom = this.$refs.svgContainer.cloneNode(true);
            forEach(svgDom.childNodes, child => {
                if (child && child.nodeType === Node.ELEMENT_NODE) {
                    if (child.getAttribute('data-preview-ignore') === 'true') {
                        svgDom.removeChild(child);
                    }
                }
            });

            rasterizeAllImagesToDataURL(svgDom)
            .catch(err => {
                console.error('Failed to rasterize some images', err);
            })
            .then(() => {
                if (this.kind === 'svg') {
                    const viewBoxWidth = this.width + this.paddingRight + this.paddingLeft;
                    const viewBoxHeight = this.height + this.paddingBottom + this.paddingTop;
                    svgDom.setAttribute('viewBox', `${-this.paddingLeft} ${-this.paddingTop} ${viewBoxWidth} ${viewBoxHeight}`);
                    svgDom.removeAttribute('width');
                    svgDom.removeAttribute('height');
                } else {
                    const viewBoxWidth = this.width + 2 * this.largestStrokeSize;
                    const viewBoxHeight = this.height + 2 * this.largestStrokeSize;
                    svgDom.setAttribute('viewBox', `${-this.largestStrokeSize} ${-this.largestStrokeSize} ${viewBoxWidth} ${viewBoxHeight}`);
                    svgDom.setAttribute('width', `${viewBoxWidth}px`);
                    svgDom.setAttribute('height', `${viewBoxHeight}px`);
                }

                const svgCode = svgDom.outerHTML;
                const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgCode)}`;

                if (this.kind === 'svg') {
                    this.downloadViaLink( `${this.exportedItems[0].item.name}.svg`, svgDataUrl);
                } else {
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, this.width +  this.paddingLeft + this.paddingRight);
                    canvas.height = Math.max(1, this.height + this.paddingTop + this.paddingBottom);

                    const ctx = canvas.getContext('2d');
                    const img = new Image;

                    img.onload = () => {
                        ctx.fillStyle = this.backgroundColor;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, this.paddingLeft, this.paddingTop);
                        this.downloadViaLink(`${this.exportedItems[0].item.name}.png`, canvas.toDataURL('image/png'));
                    };
                    img.src = svgDataUrl;
                }
            });

        },

        downloadViaLink(name, content) {
            const link = document.createElement('a');
            document.body.appendChild(link);
            try {
                link.href = content;
                link.download = name;
                link.click();
                this.$emit('close');
            } catch(e) {
                console.error(e);
            }
            setTimeout(() => document.body.removeChild(link), 100);
        }
    },

    computed: {
        preserveAspectRatio() {
            if (this.placement === 'stretched') {
                return 'none';
            } else if (this.placement === 'centered') {
                return 'xMidYMid';
            }
            return 'xMinYMin';
        },

        svgStyle() {
            if (this.shouldExportBackground) {
                return {
                    background: this.backgroundColor
                };
            }
            return {};
        },

        previewStrokeSize() {
            const vw = this.width + 2 * this.previewPadding + this.paddingLeft + this.paddingRight;
            const vh = this.height + 2 * this.previewPadding + this.paddingTop + this.paddingBottom;

            if (Math.abs(vw) < 0.001 || Math.abs(vh) < 0.001) {
                return 1;
            }

            return 2 * Math.max(Math.abs(vw/600), Math.abs(vh/380));
        },

        viewBoxWidth() {
            return this.width + this.paddingRight;
        },

        viewBoxHeight() {
            return this.height + this.paddingBottom;
        },

        title() {
            if (this.kind === 'svg') {
                return 'Export as SVG';
            } else {
                return 'Export as PNG';
            }
        }
    }
}
</script>