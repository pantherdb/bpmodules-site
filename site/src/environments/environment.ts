// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  annotationResultsSize: 10_000,
  //pangoGraphQLUrl: 'http://localhost:5000/graphql',
  pangoGraphQLUrl: 'http://52.2.205.113/api/graphql',
  amigoTermUrl: "http://amigo.geneontology.org/amigo/term/",
  pubmedUrl: "https://www.ncbi.nlm.nih.gov/pubmed/",
  taxonApiUrl: 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=',
  ucscUrl: 'https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&lastVirtModeType=default&lastVirtModeExtraState=&virtModeType=default&virtMode=0&nonVirtPosition=&position=chr',
  pantherFamilyUrl: 'https://www.pantherdb.org/treeViewer/treeViewer.jsp?',
  panTreeUrl: 'https://pantree.org/node/annotationNode.jsp?id=',
  uniprotUrl: 'https://www.uniprot.org/uniprotkb/',
  agrPrefixUrl: 'https://www.alliancegenome.org/gene/',
  hgncPrefixUrl: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/'
};

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
