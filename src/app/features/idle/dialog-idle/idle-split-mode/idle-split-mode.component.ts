import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Task } from '../../../tasks/task.model';
import { selectIdleTime } from '../../store/idle.selectors';
import { Store } from '@ngrx/store';
import { SimpleCounterService } from '../../../simple-counter/simple-counter.service';
import { T } from 'src/app/t.const';
import { IdleTrackItem, SimpleCounterIdleBtn } from '../dialog-idle.model';
import { dirtyDeepCopy } from '../../../../util/dirtyDeepCopy';

@Component({
  selector: 'idle-split-mode',
  templateUrl: './idle-split-mode.component.html',
  styleUrls: ['./idle-split-mode.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdleSplitModeComponent implements OnInit {
  T: typeof T = T;

  @Input() simpleCounterToggleBtns: SimpleCounterIdleBtn[] = [];
  @Input() prevSelectedTask: Task | null = null;

  idleTime$ = this._store.select(selectIdleTime);
  trackToItems: IdleTrackItem[] = [];

  @Output() cancel = new EventEmitter();
  @Output() save = new EventEmitter<IdleTrackItem[]>();

  constructor(
    private _store: Store,
    private _simpleCounterService: SimpleCounterService,
  ) {}

  ngOnInit(): void {
    this.trackToItems = this.prevSelectedTask
      ? [
          {
            type: 'TASK',
            time: 0,
            task: this.prevSelectedTask,
            simpleCounterToggleBtns: dirtyDeepCopy(this.simpleCounterToggleBtns),
          },
          {
            type: 'TASK',
            time: 0,
            title: '',
            simpleCounterToggleBtns: dirtyDeepCopy(this.simpleCounterToggleBtns),
          },
        ]
      : [
          {
            type: 'TASK',
            time: 0,
            title: '',
            simpleCounterToggleBtns: dirtyDeepCopy(this.simpleCounterToggleBtns),
          },
          {
            type: 'TASK',
            time: 0,
            title: '',
            simpleCounterToggleBtns: dirtyDeepCopy(this.simpleCounterToggleBtns),
          },
        ];
  }

  onTaskChange(item: IdleTrackItem, taskOrTaskTitle: Task | string): void {
    const isCreate = typeof taskOrTaskTitle === 'string';
    if (isCreate) {
      item.title = taskOrTaskTitle as string;
      item.task = undefined;
    } else {
      item.task = taskOrTaskTitle as Task;
      item.title = undefined;
    }
  }

  addTrackingItem(): void {
    this.trackToItems.push({
      type: 'TASK',
      time: 0,
      title: '',
      simpleCounterToggleBtns: dirtyDeepCopy(this.simpleCounterToggleBtns),
    });
  }

  saveI(): void {
    this.save.emit(this.trackToItems);
  }

  cancelI(): void {
    this.cancel.emit();
  }
}