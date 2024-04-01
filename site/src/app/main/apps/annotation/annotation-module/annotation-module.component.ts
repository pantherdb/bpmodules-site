import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { AnnotationService } from './../services/annotation.service'
import { AnnotationPage } from '../models/page';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { RightPanel } from '@pango.common/models/menu-panels';
import { MatLegacyTable as MatTable, MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { environment } from 'environments/environment';
import { pangoData } from '@pango.common/data/config';

@Component({
  selector: 'pango-annotation-module',
  templateUrl: './annotation-module.component.html',
  styleUrls: ['./annotation-module.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnotationModuleComponent implements OnInit, OnDestroy {
  RightPanel = RightPanel;
  aspectMap = pangoData.aspectMap;
  evidenceTypeMap = pangoData.evidenceTypeMap;

  uniprotUrl = environment.uniprotUrl;


  amigoTermUrl = environment.amigoTermUrl

  loadingIndicator: boolean;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  @Input() annotationPage: AnnotationPage;

  @ViewChild(MatTable) table: MatTable<any>

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  dataSource = new MatTableDataSource<any>();

  private _unsubscribeAll: Subject<any>;
  bpmodule: any;

  constructor(
    public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService
  ) {

    this.loadingIndicator = false;

    this._unsubscribeAll = new Subject();
  }


  ngOnInit(): void {

    this.annotationService.onAnnotationModuleChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((bpmodule) => {
        this.annotationService.selectedModule = bpmodule;
        this.bpmodule = bpmodule

      });

  }


  selectAnnotation(row) {
    this.pangoMenuService.selectRightPanel(RightPanel.DETAIL);
    this.pangoMenuService.openRightDrawer();
    this.annotationService.onAnnotationChanged.next(row);
  }

  selectGene(gene: string) {

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  openAnnotationSearch() {
    this.pangoMenuService.selectRightPanel(RightPanel.SEARCH);
    this.pangoMenuService.openRightDrawer()
  }

  openAnnotationTable() {
    this.pangoMenuService.selectRightPanel(RightPanel.TABLE);
    this.pangoMenuService.closeRightDrawer()
  }

  openAnnotationSummary(term) {
    console.log('term', term)
    this.annotationService.onAnnotationChanged.next(term)
    this.pangoMenuService.selectRightPanel(RightPanel.DETAIL);
    this.pangoMenuService.openRightDrawer()
  }

  openAnnotationStats() {
    this.pangoMenuService.selectRightPanel(RightPanel.STATS);
    this.pangoMenuService.openRightDrawer();
  }
}

