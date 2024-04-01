import { Injectable } from '@angular/core';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { PangoConfirmDialogComponent } from '@pango/components/confirm-dialog/confirm-dialog.component';


@Injectable({
    providedIn: 'root'
})
export class PangoConfirmDialogService {

    dialogRef: any;

    constructor(
        private _matDialog: MatDialog) {
    }


    openConfirmDialog(title: string, message: string, success?, options?): void {
        let confirmDialogRef: MatDialogRef<PangoConfirmDialogComponent> = this._matDialog.open(PangoConfirmDialogComponent, {
            panelClass: 'pango-confirm-dialog',
            disableClose: false,
            width: '600px',
            data: options
        });

        confirmDialogRef.componentInstance.title = title;
        confirmDialogRef.componentInstance.message = message;
        if (!success) {
            confirmDialogRef.componentInstance.readonlyDialog = true;
        }

        confirmDialogRef.afterClosed().subscribe(response => {
            if (response && success) {
                success(response);
            }
            confirmDialogRef = null;
        });
    }
}
