import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { DebugComponent } from './debug/debug.component';
import { KeyValueComponent } from './key-value/key-value.component';
import { CronPipe } from './cron.pipe';
import { PluralPipe } from './plural.pipe';
import { FocusDirective } from './focus.directive';
import { TooltipDirective } from './tooltip.directive';
import { ThemeSwitchComponent } from './theme-switch/theme-switch.component';
import { FileUploadComponent } from './file-upload/file-upload.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NgIconComponent,
    DebugComponent,
    KeyValueComponent,
    CronPipe,
    PluralPipe,
    FocusDirective,
    TooltipDirective,
    ThemeSwitchComponent,
    FileUploadComponent
  ],
  exports: [
    CommonModule,
    RouterModule,
    NgIconComponent,
    ReactiveFormsModule,
    DebugComponent,
    KeyValueComponent,
    PluralPipe,
    CronPipe,
    FocusDirective,
    TooltipDirective,
    ThemeSwitchComponent,
    FileUploadComponent
  ]
})
export class SharedModule {}
