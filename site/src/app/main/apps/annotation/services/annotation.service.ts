import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Client } from 'elasticsearch-browser';
import { AnnotationPage, GenePage, Query } from '../models/page';
import { orderBy } from 'lodash';
import { SearchCriteria } from '@pango.search/models/search-criteria';
import { AnnotationCount, AnnotationStats, Bucket, Annotation, AutocompleteFilterArgs, Term, GeneList } from '../models/annotation';
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

    onRawAnnotationsChanged: BehaviorSubject<Annotation[]>;
    onAutocompleteChanged: BehaviorSubject<AnnotationPage>;
    onUniqueListChanged: BehaviorSubject<any>;
    onAnnotationsAggsChanged: BehaviorSubject<AnnotationStats>;
    onAnnotationChanged: BehaviorSubject<any>;

    onAnnotationCategoryChanged: BehaviorSubject<any>;;

    // GEnes
    onGenesChanged: BehaviorSubject<any>;
    onGeneListChanged: BehaviorSubject<any>;
    onSelectedGeneListChanged: BehaviorSubject<any>;


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
    geneList: GeneList[] = [];
    selectedGeneList: GeneList;
    rawAnnotations: Annotation[];
    geneLookup: Gene[];
    annotationTree: any[];



    constructor(
        private httpClient: HttpClient,
        private annotationGraphQLService: AnnotationGraphQLService,
        private annotationDialogService: AnnotationDialogService
    ) {

        this.onCategoryChanged = new BehaviorSubject(null);
        this.onRawAnnotationsChanged = new BehaviorSubject(null);
        this.onAnnotationsChanged = new BehaviorSubject(null);
        this.onAnnotationChanged = new BehaviorSubject(null);
        this.onGenesChanged = new BehaviorSubject(null);

        this.onGeneListChanged = new BehaviorSubject(null);
        this.onGeneCountChanged = new BehaviorSubject(null);
        this.onSelectedGeneListChanged = new BehaviorSubject(null);
        //this.onAnnotationGroupsChanged = new BehaviorSubject(null);
        this.onUniqueListChanged = new BehaviorSubject(null);
        this.onAutocompleteChanged = new BehaviorSubject(null);
        this.onAnnotationsAggsChanged = new BehaviorSubject(null);
        this.onDistinctAggsChanged = new BehaviorSubject(null);
        this.onSearchCriteriaChanged = new BehaviorSubject(null);
        this.onSelectedGeneChanged = new BehaviorSubject(null);
        this.searchCriteria = new SearchCriteria();

        this.onAnnotationCategoryChanged = new BehaviorSubject(null);

        this.onRawAnnotationsChanged.subscribe((annotations: Annotation[]) => {

            if (!annotations || !this.selectedGeneList) return;

            const geneSymbols = this.selectedGeneList.genes.map((gene: Gene) => {
                return gene.geneSymbol
            })

            this.addGeneMatch(this.annotationTree, geneSymbols, this.query)

        });

    }

    selectGeneList(geneList: GeneList) {
        this.selectedGeneList = geneList;
        this.onSelectedGeneListChanged.next(geneList);
        this.onRawAnnotationsChanged.next(this.rawAnnotations);

    }

    deleteGeneList(index: number) {
        this.geneList.splice(index, 1);
    }

    buildTree(data) {
        const tree = [];

        // First Pass: Build the tree structure
        for (const item of data) {
            const section = this._findOrCreateSection(tree, item);
            const category = this._findOrCreateCategory(section, item);
            const module = this._findOrCreateModule(category, item);
            this._findOrCreateNode(module, item); // Add nodes here
        }

        // Second Pass: Set refAnnotation
        for (const item of data) {
            const section = tree.find(s => s.sectionId === item.sectionId);
            const category = section?.categories.find(c => c.categoryId === item.categoryId);
            const module = category?.modules.find(m => m.moduleId === item.moduleId);

            if (module && item.dispositionSources) {
                module.dispositionSources = item.dispositionSources.map(ds => {
                    const refModule = this._findModuleByTermId(tree, ds.termId);
                    return { ...ds, refAnnotation: refModule || null };
                });
            }
        }

        return tree;
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
                    this.annotationPage = Object.assign(Object.create(Object.getPrototypeOf(this.annotationPage)), this.annotationPage);

                    this.rawAnnotations = annotations;

                    this.annotationTree = this.buildTree(annotations);

                    this.geneLookup = this._findUniqueLeafGenes(annotations);

                    this.addGeneMatch(this.annotationTree, [], this.query)

                    this.onRawAnnotationsChanged.next(this.rawAnnotations);

                    self.loading = false;
                }, error: (err) => {
                    self.loading = false;
                }
            });
    }


    addGeneMatch(annotationTree, geneSymbols: string[], query: Query) {

        const matchedAnnotations = this.calculateMatchPercentages(annotationTree, geneSymbols);

        this.annotationPage.query = query;
        this.annotationPage.updatePage()
        this.annotationPage.annotations = matchedAnnotations;
        //  this.annotationPage.aggs = response.aggregations;
        this.annotationPage.query.source = query.source;


        this.onAnnotationsChanged.next(this.annotationPage);
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
        const self = this;
        const fileReader = new FileReader();

        const success = (geneData) => {
            if (geneData) {
                self.geneList.push(geneData);
                self.selectGeneList(geneData);
            }
        };


        fileReader.onload = (e) => {
            const text = fileReader.result as string;

            // Replace commas with new lines, remove quotes, and trim each line
            const transformedText = text.replace(/,/g, '\n').replace(/["']/g, '').trim();

            // Split into lines and process each line
            const lines = transformedText.split(/\r\n|\n/);
            const trimmedLines = lines.map(line => line.trim());
            const uniqueLines = new Set(trimmedLines);
            const geneIds = Array.from(uniqueLines).filter(line => line !== '');

            const genes = self._findMatchingGenes(geneIds, self.geneLookup);
            const data = { genes, description: file.name }

            self.annotationDialogService.openUploadGenesDialog(data, success);
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

    // Privates

    private _findOrCreateSection(tree, item) {
        let section = tree.find(s => s.sectionId === item.sectionId);
        if (!section) {
            section = {
                sectionId: item.sectionId,
                sectionLabel: item.sectionLabel,
                categories: []
            };
            tree.push(section);
        }
        return section;
    }

    private _findOrCreateCategory(section, item) {
        let category = section.categories.find(c => c.categoryId === item.categoryId);
        if (!category) {
            category = {
                categoryId: item.categoryId,
                categoryLabel: item.categoryLabel,
                modules: []
            };
            section.categories.push(category);
        }
        return category;
    }

    private _findOrCreateModule(category, item) {
        let module = category.modules.find(m => m.moduleId === item.moduleId);
        if (!module) {
            module = {
                moduleId: item.moduleId,
                moduleLabel: item.moduleLabel,
                disposition: item.disposition,
                nodes: [],
                // Temporarily store termIds, to be processed later
                dispositionSourcesTermIds: item.dispositionSources?.map(ds => ds.termId) || []
            };
            category.modules.push(module);
        }
        return module;
    }

    private _findOrCreateNode(module, item) {
        const node = {
            nodeId: item.nodeId,
            nodeLabel: item.nodeLabel,
            terms: item.terms,
            leafGenes: item.leafGenes
        };
        module.nodes.push(node);
    }


    private _findModuleByTermId(tree, termId) {
        for (const section of tree) {
            for (const category of section.categories) {
                for (const module of category.modules) {
                    if (module.moduleId === termId) {
                        return module;
                    }
                }
            }
        }
        return null;
    }

    private calculateMatchForNodes(nodes, geneSymbols) {
        let matchingNodesCount = 0;

        const updatedNodes = nodes.map(node => {
            const isMatched = node.leafGenes.some(leafGene =>
                geneSymbols.includes(leafGene.geneSymbol)
            );

            if (isMatched) matchingNodesCount++;

            return {
                ...node,
                matched: isMatched
            };
        });

        return { updatedNodes, matchingNodesCount };
    }

    private updateRefAnnotations(dispositionSources, geneSymbols) {
        return dispositionSources.map(ds => {
            if (ds.refAnnotation && ds.refAnnotation.nodes) {
                const { updatedNodes, matchingNodesCount } = this.calculateMatchForNodes(ds.refAnnotation.nodes, geneSymbols);
                const totalRefNodes = updatedNodes.length;
                const refMatchPercentage = totalRefNodes > 0 ? Math.round((matchingNodesCount / totalRefNodes) * 100) : 0;
                const refGrayscaleColor = totalRefNodes > 0 ? (ds.disposition === "negative" ? '#0F0' : '#F00') : 'transparent';


                return {
                    ...ds,
                    refAnnotation: {
                        ...ds.refAnnotation,
                        nodes: updatedNodes,
                        matchPercentage: refMatchPercentage,
                        grayscaleColor: refGrayscaleColor
                    },
                    matched: matchingNodesCount > 0  // Update matched based on the updatedNodes
                };
            }
            return ds;
        });
    }

    private calculateMatchPercentages(data: any[], geneSymbols: string[]): any[] {
        return data.map(item => ({
            ...item,
            categories: item.categories.map(category => ({
                ...category,
                modules: category.modules.map(module => {
                    const { updatedNodes, matchingNodesCount } = this.calculateMatchForNodes(module.nodes, geneSymbols);
                    const matchPercentage = module.nodes.length > 0 ? Math.round((matchingNodesCount / module.nodes.length) * 100) : 0;
                    const grayscaleColor = this._getGrayscaleColor(matchPercentage);

                    const updatedDispositionSources = this.updateRefAnnotations(module.dispositionSources, geneSymbols);

                    return {
                        ...module,
                        nodes: updatedNodes,
                        dispositionSources: updatedDispositionSources,
                        matchPercentage,
                        grayscaleColor
                    };
                })
            }))
        }));
    }



    private _getGrayscaleColor(percentage: number): string {
        const intensity = Math.round(255 - (255 * percentage / 100));
        return `rgb(${intensity}, ${intensity}, ${intensity})`;
    }

    private _findUniqueLeafGenes(data: Annotation[]) {
        const uniqueGenesMap = new Map();

        data.forEach(item => {
            item.leafGenes.forEach(leafGene => {
                if (!uniqueGenesMap.has(leafGene.geneSymbol)) {
                    uniqueGenesMap.set(leafGene.geneSymbol, leafGene);
                }
            });
        });

        return Array.from(uniqueGenesMap.values());
    }

    private _findMatchingGenes(geneList: string[], leafGenes: Gene[]) {
        return leafGenes.filter(leafGene =>
            geneList.includes(leafGene.gene) || geneList.includes(leafGene.geneSymbol)
        );
    }



}
