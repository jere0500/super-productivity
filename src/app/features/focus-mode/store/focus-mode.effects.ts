import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  focusSessionDone,
  hideFocusOverlay,
  setFocusSessionTimeToGo,
  showFocusOverlay,
  startFocusSession,
} from './focus-mode.actions';
import { GlobalConfigService } from '../../config/global-config.service';
import {
  distinctUntilChanged,
  first,
  map,
  mapTo,
  pairwise,
  scan,
  switchMap,
} from 'rxjs/operators';
import { EMPTY, interval, merge, Observable, of } from 'rxjs';
import { TaskService } from '../../tasks/task.service';
import {
  selectFocusSessionDuration,
  selectIsFocusSessionRunning,
} from './focus-mode.selectors';
import { Store } from '@ngrx/store';
import { unsetCurrentTask } from '../../tasks/store/task.actions';

const TICK_DURATION = 500;

@Injectable()
export class FocusModeEffects {
  private _isRunning$ = this._store.select(selectIsFocusSessionRunning);
  private _sessionDuration$ = this._store.select(selectFocusSessionDuration);

  private _timer$: Observable<number> = interval(TICK_DURATION).pipe(
    switchMap(() => of(Date.now())),
    pairwise(),
    map(([a, b]) => b - a),
  );

  private _tick$: Observable<number> = this._isRunning$.pipe(
    switchMap((isRunning) => (isRunning ? this._timer$ : EMPTY)),
    map((tick) => tick * -1),
  );

  private _currentSessionTime$: Observable<number> = merge(
    this._sessionDuration$,
    this._tick$,
    this.actions$.pipe(
      ofType(startFocusSession, hideFocusOverlay),
      switchMap(() => this._sessionDuration$.pipe(first())),
    ),
  ).pipe(
    scan((acc, value) => {
      return value < 0 ? acc + value : value;
    }),
  );

  autoStartFocusMode$ = createEffect(() => {
    return this.globalConfigService.misc$.pipe(
      switchMap((misc) =>
        misc.isAlwaysUseFocusMode
          ? this.taskService.currentTaskId$.pipe(
              distinctUntilChanged(),
              switchMap((currentTaskId) =>
                currentTaskId ? of(showFocusOverlay()) : EMPTY,
              ),
            )
          : EMPTY,
      ),
    );
  });
  setElapsedTime$ = createEffect(() => {
    return this._currentSessionTime$.pipe(
      map((focusSessionTimeToGo) =>
        focusSessionTimeToGo >= 0
          ? setFocusSessionTimeToGo({ focusSessionTimeToGo })
          : focusSessionDone(),
      ),
    );
  });
  stopTrackingOnSessionDone$ = createEffect(() => {
    return this.actions$.pipe(ofType(focusSessionDone), mapTo(unsetCurrentTask()));
  });

  constructor(
    private _store: Store,
    private actions$: Actions,
    private globalConfigService: GlobalConfigService,
    private taskService: TaskService,
  ) {}
}
