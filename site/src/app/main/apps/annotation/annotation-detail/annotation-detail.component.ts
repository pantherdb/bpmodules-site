import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { pangoData } from '@pango.common/data/config';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Annotation } from '../models/annotation';


import { AnnotationService } from '../services/annotation.service';

@Component({
  selector: 'pango-annotation-detail',
  templateUrl: './annotation-detail.component.html',
  styleUrls: ['./annotation-detail.component.scss']
})
export class AnnotationDetailComponent implements OnInit, OnDestroy {
  aspectMap = pangoData.aspectMap;

  @Input('panelDrawer')
  panelDrawer: MatDrawer;

  annotation: Annotation;
  private _unsubscribeAll: Subject<any>;
  module: any;
  constructor(
    private annotationService: AnnotationService) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.annotationService.onBPModuleChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((bpModule) => {
        if (!bpModule) {
          return
        }
        this.module = bpModule

        // console.log(this.bpModule)
      });
  }

  isGeneMatched(gene: string): boolean {
    return this.annotationService.leafGenesToCheck.includes(gene);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  close() {
    this.panelDrawer.close()
  }
}

