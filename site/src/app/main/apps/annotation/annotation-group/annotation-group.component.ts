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
import { Annotation } from '../models/annotation';
import { Gene } from '../../gene/models/gene.model';
import { AnnotationBreadcrumbsService } from '../services/annotation-breadcrumbs.service';
@Component({
  selector: 'pango-annotation-group',
  templateUrl: './annotation-group.component.html',
  styleUrls: ['./annotation-group.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnotationGroupComponent implements OnInit, OnDestroy {
  RightPanel = RightPanel;
  aspectMap = pangoData.aspectMap;
  evidenceTypeMap = pangoData.evidenceTypeMap;

  uniprotUrl = environment.uniprotUrl;
  columns: any[] = [];
  count = 0

  annotations: any[] = []

  amigoTermUrl = environment.amigoTermUrl
  pubmedUrl = environment.pubmedUrl

  loadingIndicator: boolean;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  taxonApiUrl = environment.taxonApiUrl

  @Input() annotationPage: AnnotationPage;

  @ViewChild(MatTable) table: MatTable<any>

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  dataSource = new MatTableDataSource<any>();

  genes: Gene[];

  displayedColumns = [
    'section',
    'category',
    'module',
  ];

  @Input('maxReferences') maxReferences = 2
  @Input('maxEvidences') maxEvidences = 2
  @Input('options') options;

  selectedGP: Gene

  categories = []
  view: any[] = [700, 400];

  // options
  gradient: boolean = true;
  showLegend: boolean = true;
  showLabels: boolean = true;
  isDoughnut: boolean = false;
  legendPosition: string = 'below';


  private _unsubscribeAll: Subject<any>;

  constructor(
    public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService,
    public breadcrumbsService: AnnotationBreadcrumbsService,
  ) {

    this.loadingIndicator = false;

    this._unsubscribeAll = new Subject();

  }


  ngOnInit(): void {

    this.annotationService.onAnnotationsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationPage: AnnotationPage) => {
        console.log('annotationPage', annotationPage)
        if (annotationPage) {
          this.annotations = annotationPage.annotations
        } else {
          this.annotations = []
        }

        // this.categories = this.transformData(this.annotations)

        //this.annotationService.onCategoryChanged.next(annotations)

      });

    if (this.options?.displayedColumns) {
      this.displayedColumns = this.options.displayedColumns
    }
  }

  findCategory(annotation, id: string) {
    const category = this.annotationService.findCategory(annotation, id)
    return [category]
  }



  toggleExpand(gene: Gene) {
    gene.expanded = !gene.expanded;

    if (gene.expanded) {
      gene.maxTerms = 500
    } else {
      gene.maxTerms = 2
    }

  }

  getUcscLink(element: Gene) {
    const chr = `${element.coordinatesChrNum}:${element.coordinatesStart}-${element.coordinatesEnd}`
    return environment.ucscUrl + chr
  }

  getUniprotLink(element: Gene) {
    const geneId = element.gene?.split(':')

    if (geneId.length > 1) {
      return this.uniprotUrl + geneId[1];
    }

    return element.gene;
  }

  getFamilyLink(element: Gene) {
    return `${environment.pantherFamilyUrl}book=${encodeURIComponent(element.pantherFamily)}&seq=${encodeURIComponent(element.longId)}`
  }

  setPage($event) {
    if (this.annotationPage) {
      this.annotationService.getGenesPage(this.annotationPage.query, $event.pageIndex + 1);
    }
  }

  selectSection(section) {
    this.annotationService.selectSection(section)
    this.breadcrumbsService.onSectionClick(section.id)
    this.pangoMenuService.selectMiddlePanel(MiddlePanel.SECTION);
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

