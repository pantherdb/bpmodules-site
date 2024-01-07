import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Client } from 'elasticsearch-browser';
import { AnnotationPage, GenePage, Query } from '../models/page';
import { orderBy } from 'lodash';
import { SearchCriteria } from '@pango.search/models/search-criteria';
import { AnnotationCount, AnnotationStats, Bucket, Annotation, AutocompleteFilterArgs, Term } from '../models/annotation';
import { AnnotationGraphQLService } from './annotation-graphql.service';
import { pangoData } from '@pango.common/data/config';
import { Gene } from '../../gene/models/gene.model';

import genes from '@pango.common/data/genes1.json';
import { AnnotationDialogService } from './dialog.service';

@Injectable({
    providedIn: 'root',
})
export class AnnotationService {
    aspectMap = pangoData.aspectMap;
    termTypeMap = pangoData.termTypeMap;
    annotationResultsSize = environment.annotationResultsSize;
    onGeneCountChanged: BehaviorSubject<number>;
    //onAnnotationGroupsChanged: BehaviorSubject<AnnotationPage>;
    onAnnotationsChanged: BehaviorSubject<AnnotationPage>;
    onAutocompleteChanged: BehaviorSubject<AnnotationPage>;
    onUniqueListChanged: BehaviorSubject<any>;
    onAnnotationsAggsChanged: BehaviorSubject<AnnotationStats>;
    onAnnotationChanged: BehaviorSubject<any>;

    onGenesChanged: BehaviorSubject<any>;


    onDistinctAggsChanged: BehaviorSubject<AnnotationStats>;
    onSearchCriteriaChanged: BehaviorSubject<any>;

    onSelectedGeneChanged: BehaviorSubject<Gene>;
    searchCriteria: SearchCriteria;
    annotationPage: AnnotationPage = new AnnotationPage();
    genePage: GenePage = new GenePage();


    loading = false;
    selectedQuery;
    queryOriginal;
    query: Query = new Query();

    private client: Client;
    uniqueList: Annotation[];

    onCategoryChanged: BehaviorSubject<any>;
    leafGenesToCheck = genes



    constructor(
        private httpClient: HttpClient,
        private annotationGraphQLService: AnnotationGraphQLService,
        private annotationDialogService: AnnotationDialogService
    ) {

        this.onCategoryChanged = new BehaviorSubject(null);
        this.onAnnotationsChanged = new BehaviorSubject(null);
        this.onAnnotationChanged = new BehaviorSubject(null);
        this.onGenesChanged = new BehaviorSubject(null);
        this.onGeneCountChanged = new BehaviorSubject(null);
        //this.onAnnotationGroupsChanged = new BehaviorSubject(null);
        this.onUniqueListChanged = new BehaviorSubject(null);
        this.onAutocompleteChanged = new BehaviorSubject(null);
        this.onAnnotationsAggsChanged = new BehaviorSubject(null);
        this.onDistinctAggsChanged = new BehaviorSubject(null);
        this.onSearchCriteriaChanged = new BehaviorSubject(null);
        this.onSelectedGeneChanged = new BehaviorSubject(null);
        this.searchCriteria = new SearchCriteria();

    }

    private _handleError(error: any) {
        const err = new Error(error);
        return throwError(() => err);
    }

    //private jsonUrl = 'assets/clean_ibd_modules.json';  // URL to JSON file





    buildTree(data: Annotation[]): any[] {
        const tree: any[] = [];

        for (const item of data) {
            let section = tree.find(s => s.sectionId === item.sectionId);
            if (!section) {
                section = {
                    sectionId: item.sectionId,
                    sectionLabel: item.sectionLabel,
                    categories: []
                };
                tree.push(section);
            }

            let category = section.categories.find(c => c.categoryId === item.categoryId);
            if (!category) {
                category = {
                    categoryId: item.categoryId,
                    categoryLabel: item.categoryLabel,
                    modules: []
                };
                section.categories.push(category);
            }

            let module = category.modules.find(m => m.moduleId === item.moduleId);
            if (!module) {
                module = {
                    moduleId: item.moduleId,
                    moduleLabel: item.moduleLabel,
                    disposition: item.disposition,
                    nodes: []
                };
                category.modules.push(module);
            }

            const node = {
                nodeId: item.nodeId,
                nodeLabel: item.nodeLabel,
                terms: item.terms,
                leafGenes: item.leafGenes
            };
            module.nodes.push(node);
        }

        return tree;
    }


    private calculateMatchPercentagesAndColor(data: any[]): any[] {
        return data.map(item => ({
            ...item,
            categories: item.categories.map(category => ({
                ...category,
                modules: category.modules.map(module => {
                    const totalNodes = module.nodes.length;
                    let matchingNodesCount = 0;

                    const updatedNodes = module.nodes.map(node => {
                        const isMatched = node.leafGenes.some(leafGene =>
                            this.leafGenesToCheck.includes(leafGene.gene)
                        );

                        if (isMatched) matchingNodesCount++;

                        return {
                            ...node,
                            matched: isMatched
                        };
                    });

                    const matchPercentage = totalNodes > 0 ? Math.round((matchingNodesCount / totalNodes) * 100) : 0;
                    const grayscaleColor = this.getGrayscaleColor(matchPercentage);

                    return {
                        ...module,
                        nodes: updatedNodes, // Updated nodes with matched property
                        matchPercentage,
                        grayscaleColor
                    };
                })
            }))
        }));
    }


    private getGrayscaleColor(percentage: number): string {
        const intensity = Math.round(255 - (255 * percentage / 100));
        return `rgb(${intensity}, ${intensity}, ${intensity})`;
    }



    getAnnotationsExport(page: number): any {
        const self = this;
        self.loading = true;

        this.searchCriteria.clearSearch()
        this.searchCriteria = new SearchCriteria();

        self.getAnnotationsPage(this.query, page);
        self.getAnnotationsCount(this.query);
        self.queryAnnotationStats(this.query);
    }

    getAnnotationsExportAll(): any {
        const self = this;
        self.loading = true;
        return this.annotationGraphQLService.getAnnotationsExportAllQuery(this.query)
    }

    setDetail(annotation) {
        this.onAnnotationChanged.next(annotation);
    }

    getAnnotationsPage(query: Query, page: number): any {
        const self = this;
        self.loading = true;
        query.pageArgs.page = (page - 1);
        query.pageArgs.size = this.annotationResultsSize;
        this.query = query;
        return this.annotationGraphQLService.getAnnotationsQuery(query).subscribe(
            {
                next: (annotations: Annotation[]) => {

                    const tree = this.buildTree(annotations);

                    console.log(tree);
                    const data1 = this.calculateMatchPercentagesAndColor(tree);

                    console.log(data1);

                    this.annotationPage = Object.assign(Object.create(Object.getPrototypeOf(this.annotationPage)), this.annotationPage);


                    this.annotationPage.query = query;
                    this.annotationPage.updatePage()
                    this.annotationPage.annotations = data1;
                    //  this.annotationPage.aggs = response.aggregations;
                    this.annotationPage.query.source = query.source;


                    this.onAnnotationsChanged.next(this.annotationPage);

                    self.loading = false;
                }, error: (err) => {
                    self.loading = false;
                }
            });
    }

    getGenesPage(query: Query, page: number): any {
        const self = this;
        self.loading = true;
        query.pageArgs.page = (page - 1);
        query.pageArgs.size = this.annotationResultsSize;
        this.query = query;

        return this.annotationGraphQLService.getGenesQuery(query).subscribe(
            {
                next: (genes: Gene[]) => {
                    //const annotationData = annotations
                    this.genePage = Object.assign(Object.create(Object.getPrototypeOf(this.genePage)), this.genePage);
                    this.genePage.query = query;
                    this.genePage.updatePage()
                    this.genePage.genes = genes;
                    // this.genePage.aggs = response.aggregations;
                    this.genePage.query.source = query.source;

                    this.onGenesChanged.next(this.genePage);

                    self.loading = false;
                }, error: (err) => {
                    console.log(err)
                    self.loading = false;
                }
            });
    }

    getAnnotationsExportPage(query: Query, page: number): any {
        const self = this;
        self.loading = true;
        query.pageArgs.page = (page - 1);
        query.pageArgs.size = this.annotationResultsSize;
        this.query = query;
        return this.annotationGraphQLService.getAnnotationsQuery(query).subscribe(
            {
                next: (annotations: Annotation[]) => {
                    const annotationData = annotations

                    this.annotationPage.query = query;
                    this.annotationPage.updatePage()
                    this.annotationPage.annotations = annotationData;
                    //  this.annotationPage.aggs = response.aggregations;
                    this.annotationPage.query.source = query.source;

                    this.onAnnotationsChanged.next(this.annotationPage);

                    self.loading = false;
                }, error: (err) => {
                    self.loading = false;
                }
            });
    }

    getGenesCount(query: Query): any {
        this.onGeneCountChanged.next(null);
        return this.annotationGraphQLService.getGenesCountQuery(query).subscribe(
            {
                next: (geneCount: AnnotationCount) => {
                    this.annotationPage.total = geneCount.total;
                    this.onGeneCountChanged.next(geneCount.total)
                }, error: (err) => {
                }
            });
    }

    getAnnotationsCount(query: Query): any {
        return this.annotationGraphQLService.getAnnotationsCountQuery(query).subscribe(
            {
                next: (annotationCount: AnnotationCount) => {
                    this.annotationPage.total = annotationCount.total;
                }, error: (err) => {
                }
            });
    }

    getAutocompleteQuery(filter: AutocompleteFilterArgs, keyword: string): Observable<Annotation[]> {
        return this.annotationGraphQLService.getAutocompleteQuery(this.query, filter, keyword)
    }

    getSlimTermsAutocompleteQuery(keyword: string): Observable<Term[]> {
        return this.annotationGraphQLService.getSlimTermsAutocompleteQuery(new Query, keyword)
    }

    queryAnnotationStats(query: Query): any {
        return this.annotationGraphQLService.getAnnotationsAggsQuery(query).subscribe(
            {
                next: (stats) => {
                    const annotationStats = stats as AnnotationStats
                    this.onAnnotationsAggsChanged.next(annotationStats);
                }, error: (err) => {
                    console.warn(err);
                }
            });
    }

    queryDistinctAggs(query: any, field: string): any {
        const self = this;
        query.size = 0;
        this.onDistinctAggsChanged.next(null);
        return this.client.search({
            body: {
                query: query.query,
                size: query.size,
                aggs: query.aggs
            }
        }).then((body) => {
            if (body.aggregations) {
                const annotationStats = new AnnotationStats();

                // annotationStats.field = field;
                // annotationStats.aggs = body.aggregations;
                this.onDistinctAggsChanged.next(annotationStats);
            } else {
                this.onDistinctAggsChanged.next(null);
            }
        }, (err) => {
            console.warn(err);
        });
    }

    updateSearch() {
        this.searchCriteria.updateFiltersCount();
        this.searchCriteria.updateTooltips()
        this.onSearchCriteriaChanged.next(this.searchCriteria);

        const query = new Query()

        this.searchCriteria.slimTerms.forEach((term: Term) => {
            // query.filterArgs.slimTermIds.push(term.id);
        });

        this.searchCriteria.genes.forEach((annotation: Annotation) => {
            // query.filterArgs.geneIds.push(annotation.gene);
        });



        this.query = query;


        this.getAnnotationsPage(query, 1);
        this.getAnnotationsCount(query)

        //this.getGenesCount(query)
        //this.queryAnnotationStats(query)
        //this.getUniqueItems(query)
    }

    onGeneFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;

        if (input.files && input.files.length > 0) {
            const file = input.files[0];

            // Check if file size is less than 20 MB
            if (file.size <= 50 * 1024 * 1024) {
                this.readGeneFile(file);
            } else {
                alert("File size must be less than 50 MB");
            }
        }
    }

    readGeneFile(file: File): void {
        const self = this
        const fileReader = new FileReader();

        const success = (comments) => {
            if (comments) {
                console.log(comments)
            }
        };
        fileReader.onload = (e) => {
            const text = fileReader.result as string;
            const lines = text.split(/\r\n|\n/);

            const trimmedLines = lines.map(line => line.trim());
            const uniqueLines = new Set(trimmedLines);
            const geneIds = Array.from(uniqueLines).filter(line => line !== '');

            self.annotationDialogService.openUploadGenesDialog(geneIds, success);
            console.log(geneIds);
        };
        fileReader.readAsText(file);
    }




    onConfigFileChange(event) {
        const self = this;
        let reader = new FileReader();
        //console.log(event, control)

        if (event.target.files && event.target.files.length) {
            const [file] = event.target.files;
            reader.readAsText(file);

            reader.onload = () => {
                try {
                    const searchCriteria = JSON.parse(reader.result as string);
                    //document.getElementById('elementid').value = "";
                    if (searchCriteria && searchCriteria._source) {
                        //self.doFileSelection(searchCriteria._source, self.treeControl.dataNodes, self.checklistSelection);

                    } else {
                        alert("wrong file format")
                    }
                } catch (exception) {
                    alert("invalid file")
                }
            };
        }
    }

    downloadConfig() {/*
    const annotations = this.checklistSelection.selected as any[];
    const source = annotations.reduce((annotationString, item) => {
      return annotationString + ' ' + item.id
    }, []);

    if (source.length > 0) {
      this.annotationService.downloadConfig(source.trim());
    } else {
      this.snpDialogService.openMessageToast('Select at least one annotation from the tree', 'OK');
    }*/
        /*    const annotations = this.checklistSelection.selected as any[];
           const source = annotations.map((item: AnnotationFlatNode) => {
               return item.name; //item.leaf ? item.name : false;
           }, []);
           if (source.length > 0) {
               this.saveConfig(JSON.stringify({ "_source": source }));
           } else {
             //  this.confirmDialogService.openConfirmDialog(
                   'No Selection Found', 'Select at least one annotation from the tree');
           } */
    }

    saveConfig(configText: string) {
        var blob = new Blob([configText], { type: "text/plain;charset=utf-8" });
        //  saveAs(blob, "config.txt");
    }





    buildSummaryTree(aggs) {

        const treeNodes = aggs.map((agg) => {
            const children = [
                {
                    name: agg.name,
                    label: "With Values",
                    count: agg.count
                }
            ]

            return {
                id: agg.name,
                label: agg.label,
                count: agg.count,
                name: agg.name,
                isCategory: true,
                children: children
            }
        })


        return treeNodes;
    }

    buildAspectChart(buckets: Bucket[]) {

        const stats = buckets.map((bucket) => {
            const aspect = this.aspectMap[bucket.key];
            return {
                name: bucket.key,
                label: aspect.label,
                value: bucket.docCount,
                extra: aspect
            }
        })

        const sorted = orderBy(stats, ['value'], ['desc'])
        return sorted
    }

    buildUnknownTermChart(buckets: Bucket[]) {

        const stats = buckets.map((bucket) => {
            const termType = this.termTypeMap[bucket.key];
            return {
                name: bucket.key,
                label: termType.label,
                value: bucket.docCount,
            }
        })

        const sorted = orderBy(stats, ['value'], ['desc'])
        return sorted
    }

    buildAnnotationBar(buckets: Bucket[], max = 10, limit = 124) {

        const stats = buckets.map((bucket) => {
            return {
                name: bucket.key,
                value: bucket.docCount,
                extra: bucket.meta
            }
        })

        if (stats.length < max) {
            for (let i = 0; i < max - stats.length; i++) {
                stats.push({
                    name: ' '.repeat(i + 1),
                    value: 0,
                    extra: {}
                })
            }
        }

        const sorted = orderBy(stats, ['value'], ['desc'])
        return sorted.slice(0, limit)
    }

    buildCategoryBar(buckets: Bucket[]) {

        if (buckets.length === 0) return []

        const sortedBuckets = orderBy(buckets, ['docCount'], ['desc'])
        const longest = sortedBuckets[0].docCount
        const stats = sortedBuckets.map((bucket) => {
            const ratio = bucket.docCount / longest;

            let countPos
            if (ratio < 0.20) {
                countPos = (ratio * 100) + '%';
            } else if (ratio < 0.90) {
                countPos = (ratio - 0.15) * 100 + '%'
            } else {
                countPos = (ratio - 0.30) * 100 + '%'
            }

            return {
                ...bucket.meta,
                name: bucket.key,
                count: bucket.docCount,
                color: this.aspectMap[bucket.meta.aspect]?.color,
                aspectShorthand: this.aspectMap[bucket.meta.aspect]?.shorthand,
                width: (ratio * 100) + '%',
                countPos: countPos

            }
        })

        return stats
    }


    buildAnnotationLine(buckets: Bucket[], name) {

        const series = buckets.map((bucket) => {
            return {
                name: bucket.key,
                value: bucket.docCount
            }
        })


        return [{
            name,
            series
        }]
    }

    buildPosHistogramLine(buckets: Bucket[]) {

        const stats = buckets.map((bucket) => {
            return {
                name: bucket.key,
                value: bucket.docCount
            }
        })

        const sorted = orderBy(stats, ['value'], ['desc'])
        return sorted
    }


}
