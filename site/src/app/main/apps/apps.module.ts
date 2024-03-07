import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AnnotationDetailComponent } from './annotation/annotation-detail/annotation-detail.component';
import { PangoSharedModule } from '@pango/shared.module';
import { PangoConfirmDialogModule } from '@pango/components/confirm-dialog/confirm-dialog.module';
import { AnnotationFiltersComponent } from './annotation/annotation-filters/annotation-filters.component';
import { SearchAspectFormComponent } from './annotation/forms/search-aspect-form/search-aspect-form.component';
import { AnnotationGroupComponent } from './annotation/annotation-group/annotation-group.component';
import { NgxPieChartRemoveMarginsDirective } from '@pango.common/directives/piechart-remove-margins.directive';
import { TermFormComponent } from './annotation/forms/term-form/term-form.component';
import { GeneFormComponent } from './annotation/forms/gene-form/gene-form.component';
import { AnnotationTreeComponent } from './annotation/annotation-tree/annotation-tree.component';
import { GeneListComponent } from './annotation/gene-list/gene-list.component';
import { UploadGenesDialogComponent } from './annotation/dialogs/upload-genes/upload-genes.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AnnotationCategoryComponent } from './annotation/annotation-category/annotation-category.component';
import { AnnotationModuleComponent } from './annotation/annotation-module/annotation-module.component';
import { AnnotationSectionComponent } from './annotation/annotation-section/annotation-section.component';
import { PangoColorPickerMinModule } from '@pango/components/color-picker-min/color-picker-min.module';

const routes = [];

@NgModule({
    declarations: [
        NgxPieChartRemoveMarginsDirective,
        AnnotationGroupComponent,
        AnnotationDetailComponent,
        GeneFormComponent,
        TermFormComponent,
        SearchAspectFormComponent,
        AnnotationFiltersComponent,
        AnnotationGroupComponent,
        AnnotationTreeComponent,
        GeneListComponent,
        UploadGenesDialogComponent,
        AnnotationCategoryComponent,
        AnnotationSectionComponent,
        AnnotationModuleComponent,
    ],
    imports: [
        RouterModule.forChild(routes),
        NgxChartsModule,
        PangoSharedModule,
        PangoConfirmDialogModule,
        PangoColorPickerMinModule,
        ScrollingModule
    ],
    exports: [
        NgxPieChartRemoveMarginsDirective,
        AnnotationGroupComponent,
        GeneFormComponent,
        TermFormComponent,
        SearchAspectFormComponent,
        AnnotationFiltersComponent,
        AnnotationTreeComponent,
        GeneListComponent,
        UploadGenesDialogComponent,
        AnnotationCategoryComponent,
        AnnotationSectionComponent,
        AnnotationModuleComponent,
    ],
    providers: []
})

export class AppsModule {
}
