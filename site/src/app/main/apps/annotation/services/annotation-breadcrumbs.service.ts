import { Injectable } from "@angular/core";
import { TreeData } from "../models/annotation";
import { BreadcrumbItem, BreadcrumbLevel } from "../models/category-breadcrumb.model";
import { AnnotationService } from "./annotation.service";


@Injectable({
    providedIn: 'root',
})
export class AnnotationBreadcrumbsService {

    constructor(private annotationService: AnnotationService,) {

    }
    categoryBreadcrumbs: BreadcrumbItem[] = [this._getBaseBreadcrumb()];

    updateBreadcrumbsForCategory(id: string) {
        for (let section of this.annotationService.annotationTree) {
            let category = section.categories.find(c => c.id === id);
            if (category) {
                this.categoryBreadcrumbs = [
                    this._getBaseBreadcrumb(),
                    { label: section.sectionLabel, level: BreadcrumbLevel.SECTION },
                    { label: category.categoryLabel, level: BreadcrumbLevel.CATEGORY }
                ];
                return;
            }
        }
    }

    updateBreadcrumbsForModule(id: string) {
        for (let section of this.annotationService.annotationTree) {
            for (let category of section.categories) {
                let module = category.modules.find(m => m.id === id);
                if (module) {
                    this.categoryBreadcrumbs = [
                        this._getBaseBreadcrumb(),
                        { label: section.sectionLabel, level: BreadcrumbLevel.SECTION },
                        { label: category.categoryLabel, level: BreadcrumbLevel.CATEGORY },
                        { label: module.moduleLabel, level: BreadcrumbLevel.MODULE }
                    ];
                    return;
                }
            }
        }
    }

    onSectionClick(id: string) {
        const section = this.annotationService.annotationTree.find(s => s.id === id);
        if (section) {
            this.categoryBreadcrumbs = [
                this._getBaseBreadcrumb(),
                { label: section.sectionLabel, level: BreadcrumbLevel.SECTION }];
        }
    }

    // Example method to handle category click
    onCategoryClick(id: string) {
        this.updateBreadcrumbsForCategory(id);
    }

    // Example method to handle module click
    onModuleClick(id: string) {
        this.updateBreadcrumbsForModule(id);
    }

    updateBreadcrumbs(level: BreadcrumbLevel, id: string) {
        switch (level) {
            case BreadcrumbLevel.SECTION:
                this.onSectionClick(id);
                break;
            case BreadcrumbLevel.CATEGORY:
                this.onCategoryClick(id);
                break;
            case BreadcrumbLevel.MODULE:
                this.onModuleClick(id);
                break;
        }
    }

    private _getBaseBreadcrumb(): BreadcrumbItem {

        return { label: 'All Sections', level: BreadcrumbLevel.HOME }
    }

}
