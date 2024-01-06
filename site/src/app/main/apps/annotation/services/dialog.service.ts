import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadGenesDialogComponent } from '../dialogs/upload-genes/upload-genes.component';


@Injectable({
    providedIn: 'root',
})
export class AnnotationDialogService {

    dialogRef: any;

    constructor(private httpClient: HttpClient,
        private snackBar: MatSnackBar,
        private _matDialog: MatDialog) {
    }

    openMessageToast(message: string, action: string) {
        this.snackBar.open(message, action, {
            duration: 10000,
            verticalPosition: 'top'
        });
    }

    openUploadGenesDialog(predicate, success: Function): void {
        this.dialogRef = this._matDialog.open(UploadGenesDialogComponent, {
            panelClass: 'pango-upload-genes-dialog',
            data: {
                predicate
            },
            width: '600px',
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }

}
