
import { Component, OnInit, OnDestroy, Inject, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { AnnotationService } from '../../services/annotation.service';
import { GenePage, Query } from '../../models/page';
import { Gene } from '../../../gene/models/gene.model';

import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-upload-genes',
  templateUrl: './upload-genes.component.html',
  styleUrls: ['./upload-genes.component.scss']
})
export class UploadGenesDialogComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;
  geneFormGroup: FormGroup;

  @ViewChild(MatTable) table: MatTable<any>

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  dataSource = new MatTableDataSource<Gene>();

  displayedColumns = [
    'gene',
    'geneName',
    'geneSymbol',

  ];
  genePage: GenePage;


  constructor(
    private _matDialogRef: MatDialogRef<UploadGenesDialogComponent>,
    public annotationService: AnnotationService,
    @Inject(MAT_DIALOG_DATA) private _data: any,
  ) {
    this._unsubscribeAll = new Subject();


    const query = new Query()
    query.filterArgs.geneIds = _data.geneIds
    this.annotationService.getGenesPage(query, 1);
  }

  ngOnInit() {

    this.geneFormGroup = this.createGeneForm();

    this.annotationService.onGenesChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((genePage: GenePage) => {
        if (genePage) {
          this.genePage = genePage;
          this.dataSource = new MatTableDataSource<any>(this.genePage.genes);
        } else {
          this.genePage = null
          this.dataSource = new MatTableDataSource<any>([]);
        }
      });

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  createGeneForm() {
    return new FormGroup({
      description: new FormControl(this._data.description),
    })

  }


  save() {

    const id = uuid()
    const description = this.geneFormGroup.value['description'] ?? 'My Genes';

    const genes = this.genePage.genes
    const count = genes.length
    const value = { id, description, count, genes }
    console.log('value', value)
    this._matDialogRef.close(value);
  }

  close() {
    this._matDialogRef.close();
  }
}
