import { Component, OnInit, ViewChildren, ElementRef } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeNode } from '@angular/material/tree';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationNode, AnnotationFlatNode } from './../models/annotation'
import { AnnotationTreeService } from '../services/annotation-tree.service';

@Component({
  selector: 'pango-annotation-tree',
  templateUrl: './annotation-tree.component.html',
  styleUrls: ['./annotation-tree.component.scss'],
})
export class AnnotationTreeComponent implements OnInit {
  @ViewChildren(MatTreeNode, { read: ElementRef }) treeNodes: ElementRef[];

  dataSource: MatTreeFlatDataSource<AnnotationNode, AnnotationFlatNode>;

  private _unsubscribeAll: Subject<any>;

  constructor(
    public annotationTreeService: AnnotationTreeService,
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {

    this.annotationTreeService.onAnnotationTreeChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(annotationTree => {

        if (!annotationTree) return;

        this.dataSource = this.annotationTreeService.dataSource
        // this.annotationTreeService.treeControl.expand(this.annotationTreeService.treeControl.dataNodes[0])
        //this.annotationTreeService.treeControl.expand(this.annotationTreeService.treeControl.dataNodes[1])
        // this.annotationTreeService.setAllVisible(this.annotationTreeService.treeControl.dataNodes);
        //  this.annotationTreeService.selectItemsById(this.snpService.initialSelectedIds)
      });
  }

  selectAnnotation(annotation) {
    // this.annotationDialogService.openAnnotationDetailDialog(annotation);
  }

}
