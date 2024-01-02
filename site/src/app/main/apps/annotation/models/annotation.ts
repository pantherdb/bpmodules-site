import { getColor } from "@pango.common/data/pango-colors";
import { Gene } from "../../gene/models/gene.model";

export enum GOAspect {
    MOLECULAR_FUNCTION = 'molecular function',
    BIOLOGICAL_PROCESS = 'biological process',
    CELLULAR_COMPONENT = 'cellular component'
}

export enum AutocompleteType {
    GENE = 'gene',
    SLIM_TERM = "slim_term",
}

export class UniqueAnnotations {
    aspect: string
}
export class AutocompleteFilterArgs {

    constructor(autocompleteType = AutocompleteType.GENE) {
        this.autocompleteType = autocompleteType;
    }
    autocompleteType: AutocompleteType;

    getAutocompleteFields() {
        switch (this.autocompleteType) {
            case AutocompleteType.GENE:
                return `
                    gene
                    geneSymbol
                    geneName
                `
            case AutocompleteType.SLIM_TERM:
                return `
                    slimTerms {
                        aspect
                        id
                        label
                      } 
                    `
        }
    }
}

export class GeneFilterArgs {
    termIds: string[] = [];
    slimTermIds: string[] = [];
}

export class FilterArgs {
    sectionIds: string[] = [];
    categoryIds: string[] = [];
    moduleIds: string[] = [];
    geneIds: string[] = [];
}

export class AnnotationCount {
    total = 0;
}

export class Group {
    label: string
    id: string
    shorthand: string
}

export class Term {
    id: string;
    label: string;
    displayId: string;
}


export class DispositionSource {
    termId?: string;
    disposition?: string;
}

export class LeafGene {
    gene?: string;
    geneSymbol?: string;
    geneName?: string;
    taxonId?: string;
    pantherFamily?: string;
    longId?: string;
}

export class Annotation {
    sectionId?: string;
    sectionLabel?: string;
    categoryId?: string;
    categoryLabel?: string;
    moduleLabel?: string;
    moduleId?: string;
    dispositionSources: DispositionSource[] = [];
    disposition?: string;
    dispositionTargetId?: string;
    nodeId?: string;
    nodeLabel?: string;
    terms: Term[] = [];
    leafGenes: LeafGene[] = [];
    categoryCount?: number;
    moduleCount?: number;
    nodeCount?: number;
}


export class Bucket {
    key: string
    docCount: number
    meta: any
}

export class Frequency {
    buckets: Bucket[]
}

export class AnnotationStats {
    distinctGeneCount: number;
    termFrequency: Frequency;
    termTypeFrequency: Frequency;
    aspectFrequency: Frequency;
    evidenceTypeFrequency: Frequency;
    slimTermFrequency: Frequency;
}
