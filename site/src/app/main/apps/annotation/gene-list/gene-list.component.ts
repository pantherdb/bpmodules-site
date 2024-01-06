import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { pangoData } from '@pango.common/data/config';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Annotation } from '../models/annotation';


import { AnnotationService } from '../services/annotation.service';
import { Gene } from '../../gene/models/gene.model';

@Component({
  selector: 'pango-gene-list',
  templateUrl: './gene-list.component.html',
  styleUrls: ['./gene-list.component.scss']
})
export class GeneListComponent implements OnInit, OnDestroy {
  aspectMap = pangoData.aspectMap;

  @Input('panelDrawer')
  panelDrawer: MatDrawer;

  annotation: Annotation;
  private _unsubscribeAll: Subject<any>;
  module: any;
  constructor(
    public annotationService: AnnotationService) {
    this._unsubscribeAll = new Subject();
  }


  entryName: string = '';
  selectedFile: File | null = null;
  entries: Array<{ name: string; content: string }> = [];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  uploadFile(): void {
    if (this.selectedFile) {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        this.entries.push({
          name: this.entryName,
          content: fileReader.result as string
        });
        this.entryName = ''; // Reset the entry name
      };
      fileReader.readAsText(this.selectedFile);
    }
  }

  onFileChange(event) {
    const reader = new FileReader();
    // const ids = this.annotationForm.controls.uploadList['controls'].ids;

    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsText(file);

      reader.onload = () => {
        console.log((reader.result as any).length)
        // ids.setValue(reader.result);
      };
    }
  }

  ngOnInit(): void {
    this.annotationService.onAnnotationChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotation) => {
        if (!annotation) {
          return
        }
        this.module = annotation

        // console.log(this.annotation)
      });
  }

  isGeneMatched(gene: Gene): boolean {
    return this.annotationService.leafGenesToCheck.includes(gene.gene);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  close() {
    this.panelDrawer.close()
  }
}

