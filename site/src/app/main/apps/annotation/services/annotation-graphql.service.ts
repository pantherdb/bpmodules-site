import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AnnotationPage, Query } from '../models/page';
import { SearchCriteria } from '@pango.search/models/search-criteria';
import { PangoGraphQLService } from '@pango.search/services/graphql.service';
import { AnnotationCount, AnnotationStats, Annotation, AutocompleteFilterArgs, AutocompleteType, Term, Group, GOAspect } from '../models/annotation';
import groupsData from '@pango.common/data/groups.json';
import { find } from 'lodash';
import { Gene } from '../../gene/models/gene.model';
import { PangoUtils } from '@pango/utils/pango-utils';
import { pangoData } from '@pango.common/data/config';


@Injectable({
  providedIn: 'root',
})
export class AnnotationGraphQLService {
  aspectMap = pangoData.aspectMap;
  annotationResultsSize = environment.annotationResultsSize;

  onSearchCriteriaChanged: BehaviorSubject<any>;
  searchCriteria: SearchCriteria;
  annotationPage: AnnotationPage = new AnnotationPage();

  constructor(
    private pangoGraphQLService: PangoGraphQLService) {

    this.searchCriteria = new SearchCriteria();

  }

  findGroup(shorthand: string): Group {
    const group = find(groupsData, (group) => {
      return group.shorthand === shorthand;
    }) as Group;

    return group;
  }


  getAnnotationsQuery(query: Query): Observable<any> {

    const options = {
      variables: {
        filterArgs: query.filterArgs,
        pageArgs: query.pageArgs
      },
      query: `query GetAnnotations($filterArgs: AnnotationFilterArgs, $pageArgs: PageArgs) {
                annotations(filterArgs:$filterArgs, pageArgs:$pageArgs) {
                  id
                  sectionId
                  sectionLabel
                  categoryId
                  categoryLabel
                  moduleLabel
                  moduleId
                  dispositionSources {
                    termId
                    disposition
                  }
                  disposition
                  dispositionTargetId
                  nodeId
                  nodeLabel
                  terms {
                    id
                    label
                  }
                  leafGenes {
                    gene
                    geneSymbol
                    geneName
                    taxonId
                    pantherFamily
                    longId
                  }
                  categoryCount
                  moduleCount
                  nodeCount                 
                                                         
                }
            }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.annotations.map((annotation: Annotation) => {

          return annotation
        }) as Annotation[];
      }));
  }


  getGenesQuery(query: Query): Observable<any> {

    const options = {
      variables: {
        filterArgs: {
          geneIds: query.filterArgs.geneIds,
          //slimTermIds: query.filterArgs.slimTermIds
        },
        pageArgs: query.pageArgs
      },
      query: `query GetGenes($filterArgs: GeneFilterArgs, $pageArgs: PageArgs) {
          genes(filterArgs:$filterArgs, pageArgs:$pageArgs) {
              gene
              geneName
              geneSymbol                 
           }
        }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.genes.map((gene: Gene) => {

          return gene
        }) as Gene[];
      }));
  }


  getAnnotationsExportQuery(query: Query): Observable<any> {
    const options = {
      variables: {
        filterArgs: query.filterArgs,
        pageArgs: query.pageArgs
      },
      query: `query GetAnnotations($filterArgs: AnnotationFilterArgs, $pageArgs: PageArgs) {
                annotations(filterArgs:$filterArgs, pageArgs:$pageArgs) {
                    gene
                    geneSymbol
                    term {
                      id
                      label
                    }                                  
                  }
                }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.annotations.map(annotation => {
          return annotation
        }) as Annotation[];
      }));
  }

  getAnnotationsExportAllQuery(query: Query): Observable<any> {
    const options = {
      variables: {
        filterArgs: query.filterArgs,
        pageArgs: query.pageArgs
      },
      query: `query GetAnnotationsExport($filterArgs: AnnotationFilterArgs, $pageArgs: PageArgs) {
                annotationsExport(filterArgs:$filterArgs, pageArgs:$pageArgs) {
                    data                                 
                  }
                }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.annotations
      }));
  }


  getAnnotationsCountQuery(query: Query): Observable<any> {

    const options = {
      variables: {
        filterArgs: query.filterArgs
      },
      query: `query GetAnnotationsCount($filterArgs: AnnotationFilterArgs) {
                annotationsCount(filterArgs:$filterArgs) {
                  total                                     
                }
              }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.annotationsCount as AnnotationCount
      }));

  }

  getGenesCountQuery(query: Query): Observable<any> {

    const options = {
      variables: {
        filterArgs: {
          geneIds: query.filterArgs.geneIds,
          //slimTermIds: query.filterArgs.slimTermIds
        }
      },
      query: `query GetGenesCount($filterArgs: GeneFilterArgs) {
                genesCount(filterArgs:$filterArgs) {
                  total                                     
                }
              }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.genesCount as AnnotationCount
      }));

  }


  getAutocompleteQuery(query: Query, filter: AutocompleteFilterArgs, keyword: string): Observable<Annotation[]> {
    const options = {
      variables: {
        filterArgs: {
          geneIds: query.filterArgs.geneIds,
          //slimTermIds: query.filterArgs.slimTermIds
        },
        autocompleteType: filter.autocompleteType,
        keyword
      },
      query: `query GetAutocomplete($autocompleteType:AutocompleteType!, $keyword: String!, $filterArgs: GeneFilterArgs) {
                autocomplete(autocompleteType:$autocompleteType, keyword:$keyword, filterArgs:$filterArgs) {
                ${filter.getAutocompleteFields()}                                                  
                }
            }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.autocomplete.map(annotation => {
          return annotation
        }) as Annotation[];
      }));

  }

  getSlimTermsAutocompleteQuery(query: Query, keyword: string): Observable<Term[]> {
    const options = {
      variables: {
        filterArgs: query?.filterArgs,
        keyword

      },
      query: `query GetSlimTermAutocomplete($keyword: String!, $filterArgs: AnnotationFilterArgs) {
                slimTermsAutocomplete( keyword:$keyword, filterArgs:$filterArgs) {
                  label
                  id
                  aspect
                  count                                                
                }
            }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.slimTermsAutocomplete.map(term => {
          return term
        }) as Term[];
      }));

  }

  getAnnotationsAggsQuery(query: Query): Observable<any> {
    const self = this;

    const options = {
      variables: {
        filterArgs: query.filterArgs
      },
      query: `query GetAnnotationsStats($filterArgs: AnnotationFilterArgs) {
                    stats(filterArgs:$filterArgs) {
                      termTypeFrequency {
                        buckets {
                          docCount
                          key
                        }
                      }                    
                      slimTermFrequency {
                        buckets {
                          docCount
                          key
                          meta {
                            id
                            aspect
                            label
                            displayId
                          }
                        }
                      }
                  }
            }`
    }

    return this.pangoGraphQLService.query(options).pipe(
      map((response: any) => {
        return response.stats as AnnotationStats;
      }));

  }


}


