// Copyright (C) 2020-2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Icon from '@ant-design/icons';

import { CombineIcon } from 'icons';
import { Canvas } from 'cvat-canvas-wrapper';
import { ActiveControl } from 'reducers/interfaces';
import CVATTooltip from 'components/common/cvat-tooltip';

export interface Props {
    canvasInstance: Canvas;
    activeControl: ActiveControl;
    switchCombineShortcut: string;
    disabled?: boolean;
    combineShapes(enabled: boolean): void;
}

function CombineControl(props: Props): JSX.Element {
    const {
        switchCombineShortcut, activeControl, canvasInstance, combineShapes, disabled,
    } = props;

    const dynamicIconProps =
        activeControl === ActiveControl.COMBINE ?
            {
                className: 'cvat-combine-control cvat-active-canvas-control',
                onClick: (): void => {
                    canvasInstance.combine({ enabled: false });
                    combineShapes(false);
                },
            } :
            {
                className: 'cvat-combine-control',
                onClick: (): void => {
                    canvasInstance.cancel();
                    canvasInstance.combine({ enabled: true });
                    combineShapes(true);
                },
            };

    return disabled ? (
        <Icon className='cvat-combine-control cvat-disabled-canvas-control' component={CombineIcon} />
    ) : (
        <CVATTooltip title={`Combine shapes ${switchCombineShortcut}`} placement='right'>
            <Icon {...dynamicIconProps} component={CombineIcon} />
        </CVATTooltip>
    );
}

export default React.memo(CombineControl);
