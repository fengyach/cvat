// Copyright (C) 2021 Intel Corporation
//
// SPDX-License-Identifier: MIT

import * as SVG from 'svg.js';
import { CombineData } from './canvasModel';

export interface CombineHandler {
    combine(combineData: CombineData): void;
    select(state: any): void;
    cancel(): void;
    repeatSelection(): void;
}

export class CombineHandlerImpl implements CombineHandler {
    // callback is used to notify about merging end
    private onCombineDone: (objects: any[] | null, duration?: number) => void;
    private onFindObject: (event: MouseEvent) => void;
    private startTimestamp: number;
    private canvas: SVG.Container;
    private initialized: boolean;
    private statesToBeCombined: any[]; // are being combined
    private highlightedShapes: Record<number, SVG.Shape>;
    private constraints: {
        labelID: number;
        frame: number;
        objectType: string;
    };

    private addConstraints(): void {
        const shape = this.statesToBeCombined[0];
        this.constraints = {
            labelID: shape.label.id,
            frame: shape.frame,
            objectType: shape.objectType,
        };
    }

    private removeConstraints(): void {
        this.constraints = null;
    }

    private checkConstraints(state: any): boolean {
        return (
            !this.constraints
            || (state.label.id === this.constraints.labelID
                && state.frame === this.constraints.frame
                && state.objectType === this.constraints.objectType)
        );
    }

    private release(): void {
        this.removeConstraints();
        this.canvas.node.removeEventListener('click', this.onFindObject);
        for (const state of this.statesToBeCombined) {
            const shape = this.highlightedShapes[state.clientID];
            shape.removeClass('cvat_canvas_shape_combining');
        }
        this.statesToBeCombined = [];
        this.highlightedShapes = {};
        this.initialized = false;
    }

    private initCombining(): void {
        this.canvas.node.addEventListener('click', this.onFindObject);
        this.startTimestamp = Date.now();
        this.initialized = true;
    }

    private closeCombining(): void {
        if (this.initialized) {
            const { statesToBeCombined } = this;
            this.release();

            if (statesToBeCombined.length > 1) {
                this.onCombineDone(statesToBeCombined, Date.now() - this.startTimestamp);
            } else {
                this.onCombineDone(null);
                // here is a cycle
                // onCombineDone => controller => model => view => closeCombining
                // one call of closeCombining is unuseful, but it's okay
            }
        }
    }

    public constructor(
        onCombineDone: (objects: any[] | null, duration?: number) => void,
        onFindObject: (event: MouseEvent) => void,
        canvas: SVG.Container,
    ) {
        this.onCombineDone = onCombineDone;
        this.onFindObject = onFindObject;
        this.startTimestamp = Date.now();
        this.canvas = canvas;
        this.statesToBeCombined = [];
        this.highlightedShapes = {};
        this.constraints = null;
        this.initialized = false;
    }

    public combine(combineData: CombineData): void {
        if (combineData.enabled) {
            this.initCombining();
        } else {
            this.closeCombining();
        }
    }

    public select(objectState: any): void {
        const stateIndexes = this.statesToBeCombined.map((state): number => state.clientID);
        const includes = stateIndexes.indexOf(objectState.clientID);
        if (includes !== -1) {
            const shape = this.highlightedShapes[objectState.clientID];
            this.statesToBeCombined.splice(includes, 1);
            if (shape) {
                delete this.highlightedShapes[objectState.clientID];
                shape.removeClass('cvat_canvas_shape_combining');
            }

            if (!this.statesToBeCombined.length) {
                this.removeConstraints();
            }
        } else {
            const shape = this.canvas.select(`#cvat_canvas_shape_${objectState.clientID}`).first();
            if (shape && this.checkConstraints(objectState)) {
                this.statesToBeCombined.push(objectState);
                this.highlightedShapes[objectState.clientID] = shape;
                shape.addClass('cvat_canvas_shape_combining');

                if (this.statesToBeCombined.length === 1) {
                    this.addConstraints();
                }
            }
        }
    }

    public repeatSelection(): void {
        for (const objectState of this.statesToBeCombined) {
            const shape = this.canvas.select(`#cvat_canvas_shape_${objectState.clientID}`).first();
            if (shape) {
                this.highlightedShapes[objectState.clientID] = shape;
                shape.addClass('cvat_canvas_shape_combining');
            }
        }
    }

    public cancel(): void {
        this.release();
        this.onCombineDone(null);
        // here is a cycle
        // onCombineDone => controller => model => view => closeCombining
        // one call of closeCombining is unuseful, but it's okay
    }
}
