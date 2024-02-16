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
  selector: 'pango-annotation-section',
  templateUrl: './annotation-section.component.html',
  styleUrls: ['./annotation-section.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnotationSectionComponent implements OnInit, OnDestroy {
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
  section: any;

  constructor(
    public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService,
    public breadcrumbsService: AnnotationBreadcrumbsService,
  ) {

    this.loadingIndicator = false;

    this._unsubscribeAll = new Subject();
  }


  ngOnInit(): void {

    this.annotationService.onAnnotationSectionChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((section) => {
        this.annotationService.selectedSection = section;
        this.section = section
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

  selectCategory(category) {
    this.annotationService.onAnnotationCategoryChanged.next(category)
    this.breadcrumbsService.onCategoryClick(category.id)
    this.pangoMenuService.selectMiddlePanel(MiddlePanel.CATEGORY);
  }

  selectSection(section) {
    this.annotationService.onAnnotationSectionChanged.next(section)
    this.breadcrumbsService.onSectionClick(section.id)
    this.pangoMenuService.selectMiddlePanel(MiddlePanel.SECTION);
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

