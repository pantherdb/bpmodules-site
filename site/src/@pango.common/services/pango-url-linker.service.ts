import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PangoUrlLinkerService {

  constructor() {

  }

  linkAmigoTerm(id: string) {
    return environment.amigoTermUrl + id;
  }

  linkPanTree(id: string) {
    return environment.panTreeUrl + id;
  }

  getAGRLink(hgncId) {

    if (hgncId) {
      return environment.agrPrefixUrl + hgncId;
    }

    return environment.agrPrefixUrl;

  }

  getHGNCLink(hgncId) {

    if (hgncId) {
      return environment.hgncPrefixUrl + hgncId;
    }

    return environment.hgncPrefixUrl;

  }

  getUcscLink(element: any) {
    const chr = `${element.coordinatesChrNum}:${element.coordinatesStart}-${element.coordinatesEnd}`
    return environment.ucscUrl + chr
  }

  getUniprotLink(gene: string) {
    const geneId = gene.split(':')

    if (geneId.length > 1) {
      return environment.uniprotUrl + geneId[1];
    }

    return gene;
  }

  getFamilyLink(element: any) {

    return `${environment.pantherFamilyUrl}book=${encodeURIComponent(element.pantherFamily)}&seq=${encodeURIComponent(element.longId)}`
  }
}