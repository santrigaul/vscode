/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./walkThroughPart';
import * as nls from 'vs/nls';
import { DomScrollableElement } from 'vs/base/browser/ui/scrollbar/scrollableElement';
import { ScrollbarVisibility } from 'vs/base/common/scrollable';
import * as strings from 'vs/base/common/strings';
import URI from 'vs/base/common/uri';
import { TPromise } from 'vs/base/common/winjs.base';
import { DefaultConfig } from 'vs/editor/common/config/defaultConfig';
import { IEditorOptions, IModel } from 'vs/editor/common/editorCommon';
import { $, Dimension, Builder } from 'vs/base/browser/builder';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { EditorOptions } from 'vs/workbench/common/editor';
import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { WalkThroughInput } from 'vs/workbench/parts/walkThrough/common/walkThroughInput';
import { IThemeService } from 'vs/workbench/services/themes/common/themeService';
import { IOpenerService } from 'vs/platform/opener/common/opener';
import { marked } from 'vs/base/common/marked/marked';
import { IModeService } from 'vs/editor/common/services/modeService';
import { IFileService } from 'vs/platform/files/common/files';
import { IModelService } from 'vs/editor/common/services/modelService';
import * as uuid from 'vs/base/common/uuid';
import { CodeEditor } from 'vs/editor/browser/codeEditor';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import * as path from 'path';
import { tmpdir } from 'os';
import { mkdirp } from 'vs/base/node/extfs';
import { IMode } from 'vs/editor/common/modes';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { Position } from 'vs/platform/editor/common/editor';
import { Action } from 'vs/base/common/actions';

/**
 * An implementation of editor for showing HTML content.
 */
export class WalkThroughPart extends BaseEditor {

	static ID: string = 'workbench.editor.walkThroughPart';

	private disposables: IDisposable[] = [];
	private contentDisposables: IDisposable[] = [];
	private content: HTMLDivElement;
	private scrollbar: DomScrollableElement;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IThemeService private themeService: IThemeService,
		@IOpenerService private openerService: IOpenerService,
		@IFileService private fileService: IFileService,
		@IModelService protected modelService: IModelService,
		@IModeService private modeService: IModeService
	) {
		super(WalkThroughPart.ID, telemetryService);
	}

	createEditor(parent: Builder): void {
		const container = parent.getHTMLElement();
		container.classList.add('walkThroughContainer');

		this.content = document.createElement('div');
		this.content.classList.add('walkThroughContent');

		this.scrollbar = new DomScrollableElement(this.content, {
			canUseTranslate3d: false,
			horizontal: ScrollbarVisibility.Auto,
			vertical: ScrollbarVisibility.Auto
		});
		this.disposables.push(this.scrollbar);
		container.appendChild(this.scrollbar.getDomNode());

		this.registerClickHandler();
	}

	private registerClickHandler() {
		this.content.addEventListener('click', event => {
			let node = event.target;
			if (node instanceof HTMLAnchorElement && node.href) {
				let baseElement = window.document.getElementsByTagName('base')[0];
				if (baseElement && node.href.indexOf(baseElement.href) >= 0 && node.hash) {
					let scrollTarget = window.document.getElementById(node.hash.substr(1, node.hash.length - 1));
					if (scrollTarget) {
						scrollTarget.scrollIntoView();
					}
				} else {
					this.openerService.open(URI.parse(node.href));
				}
				event.preventDefault();
			}
		});
	}

	layout({ width, height }: Dimension): void {
		$(this.content).style({ height: `${height}px`, width: `${width}px` });
		this.contentDisposables.forEach(disposable => {
			if (disposable instanceof CodeEditor) {
				disposable.layout();
			}
		});
		this.scrollbar.scanDomNode();
	}

	focus(): void {
		this.content.focus();
	}

	setInput(input: WalkThroughInput, options: EditorOptions): TPromise<void> {
		this.contentDisposables = dispose(this.contentDisposables);
		this.content.innerHTML = '';

		const folderName = path.join(tmpdir(), 'vscode-walk-through', uuid.generateUuid());
		const folder = new TPromise<string>((c, e) => mkdirp(folderName, null, err => err ? e(err) : c(folderName)));

		return super.setInput(input, options)
			.then(() => this.fileService.resolveContent(input.getResource(), { acceptTextOnly: true }))
			.then(content => {
				if (strings.endsWith(input.getResource().path, '.html')) {
					this.content.innerHTML = content.value;
					this.scrollbar.scanDomNode();
					return;
				}

				const files: TPromise<any>[] = [];
				const codes: { id: string; model: IModel }[] = [];
				const renderer = new marked.Renderer();
				renderer.code = (code, lang) => {
					const id = `code-${uuid.generateUuid()}`;
					const mode = this.getModeForLanguage(lang);
					const resource = URI.file(path.join(folderName, `${id}.${lang}`));
					const model = this.modelService.createModel(code, mode, resource);
					codes.push({ id, model });

					// E.g., the TypeScript service needs files on disk.
					files.push(folder.then(() => this.fileService.createFile(resource, code)));

					return `<div id=${id} class="walkThroughEditorContainer" ></div>`;
				};
				this.content.innerHTML = marked(content.value, { renderer });

				// TODO: also create jsconfig.json and tsconfig.json
				return TPromise.join(files).then(() => {
					codes.forEach(({ id, model }) => {
						const div = this.content.querySelector(`#${id}`) as HTMLElement;

						var options: IEditorOptions = {
							scrollBeyondLastLine: false,
							scrollbar: DefaultConfig.editor.scrollbar,
							overviewRulerLanes: 3,
							fixedOverflowWidgets: true,
							lineNumbersMinChars: 1,
							theme: this.themeService.getColorTheme(),
						};

						const editor = this.instantiationService.createInstance(CodeEditor, div, options);
						editor.setModel(model);
						this.contentDisposables.push(editor);

						const lineHeight = editor.getConfiguration().lineHeight;
						const height = model.getLineCount() * lineHeight;
						div.style.height = height + 'px';

						this.contentDisposables.push(this.themeService.onDidColorThemeChange(theme => editor.updateOptions({ theme })));

						editor.layout();
					});
					this.scrollbar.scanDomNode();
				});
			});
	}

	private getModeForLanguage(lang: string): TPromise<IMode> {
		return new TPromise(c => {
			const that = this;
			function tryGetMode() {
				const modeId = that.modeService.getModeIdForLanguageName(lang);
				const mode = modeId && that.modeService.getOrCreateMode(modeId);
				if (mode) {
					c(mode);
				} else {
					const subscription = that.modeService.onDidAddModes(() => {
						subscription.dispose();
						tryGetMode();
					});
				}
			}
			tryGetMode();
		});
	}

	dispose(): void {
		this.contentDisposables = dispose(this.contentDisposables);
		this.disposables = dispose(this.disposables);
		super.dispose();
	}
}

export class EditorWalkThroughAction extends Action {

	public static ID = 'workbench.action.editorWalkThrough';
	public static LABEL = nls.localize('editorWalkThrough', "Editor Walk-Through");

	constructor(
		id: string,
		label: string,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService,
		@IInstantiationService private instantiationService: IInstantiationService
	) {
		super(id, label);
	}

	public run(): TPromise<void> {
		const input = getWelcomeEditorInput(this.instantiationService);
		return this.editorService.openEditor(input, { pinned: true }, Position.ONE)
			.then(() => void (0));
	}
}

export function getWelcomeEditorInput(instantiationService: IInstantiationService) {
	const uri = URI.parse(require.toUrl('./media/welcome.md'));
	return instantiationService.createInstance(WalkThroughInput, nls.localize('welcome.title', "Editor Walk-Through"), '', uri);
}