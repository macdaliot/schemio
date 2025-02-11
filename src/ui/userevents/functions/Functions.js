/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import SetFunction from './SetFunction';
import HideFunction from './HideFunction';
import ShowFunction from './ShowFunction';
import SendEventFunction from './SendEventFunction';
import ZoomToItFunction from './ZoomToItFunction';
import CrawlEffectFunction from './CrawlEffectFunction';
import StopAllAnimationsFunction from './StopAllAnimationsFunction';
import ItemParticleEffectFunction from './ItemParticleEffectFunction';
import BlinkEffectFunction from './BlinkEffectFunction';
import MoveFunction from './MoveFunction';
import MoveToItemFunction from './MoveToItemFunction';
import ReplaceItemFunction from './ReplaceItemFunction';
import RotateFunction from './RotateFunction';
import ScaleFunction from './ScaleFunction';
import MoveAlongPathFunction from './MoveAlongPathFunction';
import MoveRandomlyFunction from './MoveRandomlyFunction';
import WaitFunction from './WaitFunction';
import ToggleFunction from './ToggleFunction';
import UntoggleFunction from './UntoggleFunction';
import PlayFramesFunction from './PlayFramesFunction';
import StopFramePlayerFunction from './StopFramePlayerFunction';
import LoadComponentFunction from './LoadComponentFunction';
import DestroyComponentFunction from './DestroyComponentFunction';
import ToggleGroupFunction from './ToggleGroupFunction';
import SendEventToParentFuction from './SendEventToParentFuction';
import SendEventToChildrenFunction from './SendEventToChildrenFunction';
import CopyEventsFunction from './CopyEventsFunction';
import RepeaterFunction from './RepeaterFunction';
import StopRepeaterFunction from './StopRepeaterFunction';
import CopyLinksFunction from './CopyLinksFunction';
import CopyDescriptionFunction from './CopyDescriptionFunction';

export default {
    main: {
        hide                : HideFunction,
        show                : ShowFunction,
        set                 : SetFunction,
        zoomToIt            : ZoomToItFunction,
        particleEffect      : ItemParticleEffectFunction,
        crawlEffect         : CrawlEffectFunction,
        blinkEffect         : BlinkEffectFunction,
        loadComponent       : LoadComponentFunction,
        destroyComponent    : DestroyComponentFunction,
        move                : MoveFunction,
        moveAlongPath       : MoveAlongPathFunction,
        moveToItem          : MoveToItemFunction,
        moveRandomly        : MoveRandomlyFunction,
        playFrames          : PlayFramesFunction,
        rotate              : RotateFunction,
        scale               : ScaleFunction,
        replaceItem         : ReplaceItemFunction,
        stopFramePlayer     : StopFramePlayerFunction,
        stopAllAnimations   : StopAllAnimationsFunction,
        sendEvent           : SendEventFunction,
        sendEventToParent   : SendEventToParentFuction,
        sendEventToChildren : SendEventToChildrenFunction,
        wait                : WaitFunction,
        toggle              : ToggleFunction,
        untoggle            : UntoggleFunction,
        toggleGroup         : ToggleGroupFunction,
        copyEvents          : CopyEventsFunction,
        copyLinks           : CopyLinksFunction,
        copyDescription     : CopyDescriptionFunction,
        repeater            : RepeaterFunction,
        stopRepeater        : StopRepeaterFunction
    },
    scheme: {
    }
};
