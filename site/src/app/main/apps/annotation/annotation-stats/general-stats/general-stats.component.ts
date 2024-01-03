import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { getColor } from '@pango.common/data/pango-colors';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationStats, Bucket } from '../../models/annotation';
import { AnnotationService } from '../../services/annotation.service';

@Component({
  selector: 'pango-general-stats',
  templateUrl: './general-stats.component.html',
  styleUrls: ['./general-stats.component.scss']
})
export class GeneralStatsComponent implements OnInit, OnDestroy {

  annotationStats: AnnotationStats;

  /*   annotationFrequencyBarOptions = {
      view: [500, 500],
      showXAxis: true,
      showYAxis: true,
      gradient: false,
      legend: false,
      showXAxisLabel: true,
      xAxisLabel: 'Aspect',
      showYAxisLabel: true,
      yAxisLabel: 'Annotations',
      animations: true,
      legendPosition: 'below',
      colorScheme: {
        domain: ['#AAAAAA']
      },
      customColors: []
    } */

  categories = []


  onSelect(event): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(event)));
  }



  @Input('ibdData') ibdData;

  existsPieOptions = {
    view: [800, 800],
    gradient: true,
    legend: false,
    showLabels: true,
    isDoughnut: false,
    maxLabelLength: 20,
    colorScheme: {
      domain: [getColor('green', 500), getColor('red', 500)]
    },

  }

  annotationFrequencyBarOptions = {
    view: [500, 400],
    showXAxis: true,
    showYAxis: true,
    gradient: false,
    legend: false,
    showXAxisLabel: true,
    maxYAxisTickLength: 30,
    yAxisLabel: 'Terms',
    showYAxisLabel: true,
    xAxisLabel: 'Count',
  }

  stats = {
    annotationFrequencyBar: [],
    existsPie: [],
    termsBar: [],
  }

  private _unsubscribeAll: Subject<any>;

  constructor(private annotationService: AnnotationService,) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {

    this.annotationService.onCategoryChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((categories) => {
        if (categories) {
          this.categories = categories.map((annotation) => {
            return {
              name: annotation.label,
              value: annotation.count
            }
          });
        }

        console.log("---", this.categories)
      });

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }



}
