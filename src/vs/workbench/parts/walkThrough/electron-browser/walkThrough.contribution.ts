/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { localize } from 'vs/nls';
import { WalkThroughInput } from 'vs/workbench/parts/walkThrough/common/walkThroughInput';
import { WalkThroughPart } from 'vs/workbench/parts/walkThrough/electron-browser/walkThroughPart';
import { Registry } from 'vs/platform/platform';
import { EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/common/editor';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';

// --- Register Editor
(<IEditorRegistry>Registry.as(EditorExtensions.Editors)).registerEditor(new EditorDescriptor(WalkThroughPart.ID,
	localize('walkThrough.editor.label', "Walk-Through"),
	'vs/workbench/parts/walkThrough/electron-browser/walkThroughPart',
	'WalkThroughPart'),
	[new SyncDescriptor(WalkThroughInput)]);
