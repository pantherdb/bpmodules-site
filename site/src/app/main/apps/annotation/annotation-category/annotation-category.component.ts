import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { AnnotationService } from './../services/annotation.service'
import { AnnotationPage } from '../models/page';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MiddlePanel, RightPanel } from '@pango.common/models/menu-panels';
import { MatLegacyTable as MatTable, MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { environment } from 'environments/environment';
import { pangoData } from '@pango.common/data/config';
import { AnnotationBreadcrumbsService } from '../services/annotation-breadcrumbs.service';

@Component({
  selector: 'pango-annotation-category',
  templateUrl: './annotation-category.component.html',
  styleUrls: ['./annotation-category.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnotationCategoryComponent implements OnInit, OnDestroy {
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
  category: any;

  constructor(
    public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService,
    public breadcrumbsService: AnnotationBreadcrumbsService,
  ) {

    this.loadingIndicator = false;

    this._unsubscribeAll = new Subject();
  }


  ngOnInit(): void {

    this.annotationService.onAnnotationCategoryChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((category) => {
        this.annotationService.selectedCategory = category;
        this.category = category

      });

  }


  selectAnnotation(row) {
    this.pangoMenuService.selectRightPanel(RightPanel.DETAIL);
    this.pangoMenuService.openRightDrawer();
    this.annotationService.onAnnotationChanged.next(row);
  }

  selectModule(bpmodule) {
    this.annotationService.onAnnotationModuleChanged.next(bpmodule)
    this.breadcrumbsService.onModuleClick(bpmodule.id)
    this.pangoMenuService.selectMiddlePanel(MiddlePanel.MODULE);
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

