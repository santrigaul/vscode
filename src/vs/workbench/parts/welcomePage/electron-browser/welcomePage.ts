/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import 'vs/css!./welcomePage';
import URI from 'vs/base/common/uri';
import * as nls from 'vs/nls';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { WalkThroughInput } from 'vs/workbench/parts/walkThrough/common/walkThroughInput';
import { IWorkbenchContribution } from 'vs/workbench/common/contributions';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { Position } from 'vs/platform/editor/common/editor';
import { onUnexpectedError } from 'vs/base/common/errors';

export class WelcomePageContribution implements IWorkbenchContribution {

	constructor(
		@IPartService partService: IPartService,
		@IWorkbenchEditorService editorService: IWorkbenchEditorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@ICommandService commandService: ICommandService
	) {
		partService.joinCreation().then(() => {
			const uri = URI.parse(require.toUrl('./welcomePage.html'));
			const input = instantiationService.createInstance(WalkThroughInput, nls.localize('welcome.title', "Welcome"), '', uri);
			return editorService.openEditor(input, { pinned: true }, Position.ONE)
				.then(null, onUnexpectedError);
		});
	}

	public getId() {
		return 'vs.welcomePage';
	}
}
