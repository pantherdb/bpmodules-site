
export enum SearchFilterType {
    TERMS = 'terms',
    SLIM_TERMS = "slimTerms",
    GENES = 'genes'
};

export class SearchCriteria {
    slimTermsTooltip = ''
    genesTooltip = ''
    aspectsTooltip = ''

    terms: any[] = [];
    slimTerms: any[] = [];
    genes: any[] = [];
    fieldValues: any[] = [];

    filtersCount = 0;

    constructor() {
    }

    updateTooltips() {

        this.slimTermsTooltip = this.slimTerms.map((term => {
            return `${term.label} (${term.displayId})`
        })).join('\n')

        this.genesTooltip = this.genes.map((item => {
            return `${item.gene} (${item.geneSymbol})${item.geneName}`
        })).join('\n')

    }

    updateFiltersCount() {
        const self = this;

        self.filtersCount = self.slimTerms.length + self.genes.length;
    }

    addAspect() {

    }

    clearSearch() {
        this.terms = [];
        this.genes = []
        this.slimTerms = [];
        this.fieldValues = [];
    }


}
