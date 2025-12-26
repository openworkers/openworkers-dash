import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '~/app/services/theme.service';
import { WorkersService } from '~/services/workers.service';
import { EnvironmentsService } from '~/services/environments.service';
import { EditorStateService } from '~/app/services/editor-state.service';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { debounceTime, filter, firstValueFrom, map, merge, skip, tap } from 'rxjs';
import { Observable, Subscription, Subject, BehaviorSubject } from 'rxjs';
import { Resolved } from '~/app/interfaces/resolved';
import { getWorkerUrl } from '~/app/utils/url';
import type { IEnvironmentValue, IWorker } from '@openworkers/api-types';
import { logger } from '~/logger';

const log = logger.getLogger('WorkerEditPage');

// Monaco
import { MonacoEditorConstructionOptions } from '@materia-ui/ngx-monaco-editor';
import { FormControl } from '@angular/forms';
import { createEnvironmentLib, scheduledLib } from './editor.libs';
import { CommonModule } from '@angular/common';
import { SharedModule } from '~/app/shared/shared.module';
import { IframeComponent } from './components/iframe/iframe.component';
import { AiChatComponent } from './components/ai-chat/ai-chat.component';

const EDITOR_OPTIONS: MonacoEditorConstructionOptions = {
  language: 'typescript',
  minimap: {
    enabled: false
  },
  padding: {
    top: 10,
    bottom: 5
  },
  tabSize: 2,
  insertSpaces: true
};

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule, MonacoEditorModule, IframeComponent, AiChatComponent],
  templateUrl: 'worker-edit.page.html',
  styleUrls: ['./worker-edit.page.css']
})
export default class WorkerEditPage implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  public readonly worker: Resolved<IWorker>;
  public readonly worker$: Observable<IWorker>;
  public readonly workerUrl: string;
  public readonly refreshPreview$$: Subject<void>;
  public readonly refreshPreview$: Observable<string>;

  // Editor state service
  readonly editorState = inject(EditorStateService);

  // Monaco editor
  public options = EDITOR_OPTIONS;
  public href: FormControl<string | null>;
  public script: FormControl<string | null>;
  public theme: 'vs-dark' | 'vs';
  public theme$: Observable<'dark' | 'light'>;

  public dragActive = false;
  public activeTab: 'preview' | 'ai' = 'preview';
  public splitPosition = new BehaviorSubject<number>(window.innerWidth / 2);
  public splitPosition$ = this.splitPosition.pipe(
    filter((value) => value > 300),
    filter((value) => value < document.body.clientWidth - 300)
  );

  constructor(
    private workersService: WorkersService,
    private environmentsService: EnvironmentsService,
    themeService: ThemeService,
    route: ActivatedRoute
  ) {
    this.worker = route.snapshot.data['worker'] as Resolved<IWorker>;

    console.log('WorkerEditPage worker', this.worker);

    this.worker$ = this.worker.asObservable().pipe(skip(1));
    this.workerUrl = getWorkerUrl(this.worker.name);

    // Preview
    this.href = new FormControl('/');
    this.refreshPreview$$ = new BehaviorSubject<void>(undefined);
    this.refreshPreview$ = merge(this.refreshPreview$$, this.worker$, this.href.valueChanges).pipe(
      map(() => this.href.value),
      debounceTime(500),
      map((value = '/') => `${this.workerUrl}${value}`),
      tap((value) => log.debug('value', value))
    );

    this.theme$ = themeService.theme$;
    this.script = new FormControl(this.worker.script);
    this.options.theme = this.theme = themeService.isDark() ? 'vs-dark' : 'vs';
    this.options.language = this.worker.language;

    const env = this.worker.environment;
    let environmentId = env?.id ?? null;

    this.subscriptions.push(
      this.worker$.subscribe((worker) => {
        log.debug('Worker changed', worker);
        if (worker.script !== this.script.value) {
          log.debug('Script changed');
          this.script.setValue(worker.script);
        }

        if (worker.environment?.id !== environmentId) {
          environmentId = worker.environment?.id || null;
          log.debug('Target environment changed', environmentId);
          this.watchEnvironment(environmentId);
          this.setEnvironmentLib(/* env?.values ?? */ []); // TODO: fix env tracking
        }
      })
    );

    this.subscriptions.push(
      themeService.theme$
        .pipe(skip(1))
        .pipe(map((theme) => (theme === 'dark' ? 'vs-dark' : 'light'))) //
        .subscribe((theme) => monaco.editor.setTheme(theme))
    );

    console.time('editor-ready');
  }

  async ngOnInit() {
    // Initialize editor state with worker context
    await this.editorState.init(this.worker.id, this.worker.script ?? '');

    // Sync script changes to store
    this.subscriptions.push(
      this.script.valueChanges.subscribe((code) => {
        if (code !== null) {
          this.editorState.updateCode(code);
        }
      })
    );
  }

  public async updateWorker() {
    const script = this.script.value ?? undefined;
    const id = this.worker.id;

    if (this.worker.script === script) {
      return;
    }

    const update = await firstValueFrom(this.workersService.update({ id, script }));

    Object.assign(this.worker, update);

    this.script.markAsUntouched();
    this.script.markAsPristine();
  }

  private editor?: monaco.editor.IStandaloneCodeEditor;

  public onEditorInit(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      lib: ['es2020', 'webworker', 'dom.iterable'],
      allowNonTsExtensions: true
    });

    // Scheduled lib
    monaco.languages.typescript.typescriptDefaults.addExtraLib(scheduledLib);
    monaco.languages.typescript.javascriptDefaults.addExtraLib(scheduledLib);

    // On save (CTRL + S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => this.updateWorker());

    // Watch for diagnostics
    const model = editor.getModel();

    if (model) {
      monaco.editor.onDidChangeMarkers(() => {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const diagnostics = markers
          .filter(m => m.severity >= monaco.MarkerSeverity.Warning)
          .map(m => `Line ${m.startLineNumber}: ${m.message}`);
        this.editorState.updateDiagnostics(diagnostics);
      });
    }

    console.timeEnd('editor-ready');

    const env = this.worker.environment;

    this.setEnvironmentLib(/* env?.values ?? */ []); // TODO: fix env tracking
    this.watchEnvironment(env?.id ?? null);
  }

  public async applyAiCode(code: string) {
    this.script.setValue(code);
    this.script.markAsDirty();
    // Auto-deploy after AI applies code
    await this.updateWorker();
    this.refreshPreview$$.next();
  }

  public async clearAiChat() {
    await this.editorState.clearConversation();
  }

  private environmentLibs: monaco.IDisposable[] = [];
  private setEnvironmentLib(values: readonly IEnvironmentValue[]) {
    log.debug('set env', values);
    const lib = createEnvironmentLib(values.map((v) => ({ key: v.key, type: v.type })));
    this.environmentLibs.map((lib) => lib.dispose());
    this.environmentLibs = [
      monaco.languages.typescript.typescriptDefaults.addExtraLib(lib),
      monaco.languages.typescript.javascriptDefaults.addExtraLib(lib)
    ];
  }

  private environmentSubscription?: Subscription;
  private watchEnvironment(environmentId: string | null = null) {
    log.debug('Env environmentId', environmentId);

    if (this.environmentSubscription) {
      this.environmentSubscription.unsubscribe();
    }

    if (!environmentId) {
      this.setEnvironmentLib([]);
      return;
    }

    this.environmentSubscription = this.environmentsService
      .findById(environmentId)
      // TODO: fix env tracking
      // .pipe(skipWhile((env) => (env.updatedAt ?? '') <= (this.worker.environment?.updatedAt ?? '')))
      .subscribe((env) => {
        log.debug('Update env', env);
        this.setEnvironmentLib(env.values ?? []);
        this.refreshPreview$$.next();
      });
  }

  onDragStart(event: DragEvent) {
    this.dragActive = true;

    // Set a transparent image as drag image
    event.dataTransfer?.setDragImage(new Image(), 0, 0);
  }

  ngOnDestroy() {
    this.environmentSubscription?.unsubscribe();
    this.subscriptions.map((sub) => sub.unsubscribe());
    this.environmentLibs.map((lib) => lib.dispose());
  }
}
