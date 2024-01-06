
import { Component, OnInit, OnDestroy, Inject, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-upload-genes',
  templateUrl: './upload-genes.component.html',
  styleUrls: ['./upload-genes.component.scss']
})
export class UploadGenesDialogComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;
  commentsFormGroup: FormGroup;
  commentsFormArray: FormArray

  @ViewChild(MatTable) table: MatTable<any>

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  dataSource = new MatTableDataSource<any>();

  displayedColumns = [
    'gene',
    'geneSymbol',
    'termId',
    'termLabel'
  ];


  constructor(
    private _matDialogRef: MatDialogRef<UploadGenesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private _data: any,
  ) {
    this._unsubscribeAll = new Subject();

  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  save() {
    const value = this.commentsFormGroup.value['commentsFormArray'];
    this._matDialogRef.close(value);
  }

  close() {
    this._matDialogRef.close();
  }
}
