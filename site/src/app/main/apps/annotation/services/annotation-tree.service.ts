import { environment } from 'environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { saveAs } from 'file-saver';
import { Annotation, AnnotationNode, AnnotationFlatNode, AnnotationTreeNode, TreeNodeType } from './../models/annotation'
import { find } from 'lodash';
import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
import { AnnotationService } from './annotation.service';
import { AnnotationPage } from '../models/page';

@Injectable({
  providedIn: 'root',
})
export class AnnotationTreeService {
  annotations: Annotation[];
  annotationNodes: AnnotationNode[];
  annotationDetail: any;
  activeAnnotation: any;
  onAnnotationTreeChanged: BehaviorSubject<any>;
  checklistSelection: SelectionModel<AnnotationFlatNode>;
  treeControl: FlatTreeControl<AnnotationFlatNode>;
  treeFlattener: MatTreeFlattener<AnnotationNode, AnnotationFlatNode>;
  dataSource: MatTreeFlatDataSource<AnnotationNode, AnnotationFlatNode>;

  count = 0;
  keywordSearchableFields = []

  labelLookup: { [key: string]: Annotation }

  constructor(
    private httpClient: HttpClient,
    //private confirmDialogService: PangoConfirmDialogService,
    private annotationService: AnnotationService
  ) {
    this.onAnnotationTreeChanged = new BehaviorSubject(null);

    this.getAnnotationList();
  }

  getAnnotationList() {
    this.annotationService.onAnnotationsChanged
      .subscribe((annotationPage: AnnotationPage) => {

        if (!annotationPage) return;

        console.log('annotationPage', annotationPage)

        this.annotations = annotationPage.annotations;
        this.keywordSearchableFields = this.getSearchableFields(this.annotations);
        this.labelLookup = this.makeLabelLookup(this.annotations);
        this.checklistSelection = new SelectionModel<AnnotationFlatNode>(true);
        this.treeFlattener = new MatTreeFlattener(this.transformer, this._getLevel,
          this._isExpandable, this._getChildren);
        this.treeControl = new FlatTreeControl<AnnotationFlatNode>(this._getLevel, this._isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
        this.annotationNodes = this._mapTreeToMatTreeFormat(this.annotations);
        this.dataSource.data = this.annotationNodes;
        this.onAnnotationTreeChanged.next(this.annotationNodes);

      });

  }


  transformer = (node: AnnotationNode, level: number) => {

    const flatNode = new AnnotationFlatNode(
      node.id,
      node.name,
    );

    flatNode.label = node.label;
    //flatNode.leaf = node.leaf;
    flatNode.visible = node.visible;
    flatNode.expandable = !!node.children;
    flatNode.level = level;

    return flatNode
  }

  private _getLevel = (node: AnnotationFlatNode) => node.level;

  private _isExpandable = (node: AnnotationFlatNode) => node.expandable;

  private _getChildren = (node: AnnotationNode): Observable<AnnotationNode[]> => observableOf(node.children);

  hasChild = (_: number, _nodeData: AnnotationFlatNode) => _nodeData.expandable;


  descendantsAllSelected(node: AnnotationFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: AnnotationFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  annotationItemSelectionToggle(node: AnnotationFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  annotationLeafItemSelectionToggle(node: AnnotationFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: AnnotationFlatNode): void {
    let parent: AnnotationFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: AnnotationFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: AnnotationFlatNode): AnnotationFlatNode | null {
    const currentLevel = this._getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this._getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  setAllVisible(nodes: AnnotationFlatNode[]) {
    nodes.forEach((x: AnnotationFlatNode) => {
      x.visible = true;
    });
  }


  selectItemsById(ids: number[]) {
    console.log(ids)
    this.treeControl.dataNodes.forEach(item => {
      if (ids.toString().includes(item.id as unknown as string)) {
        this.checklistSelection.select(item);
      }
    });
  }


  findAnnotation(field) {
    return find(this.annotations, (annotation: Annotation) => {
      return field === annotation.sectionLabel
    })
  }

  getSearchableFields(annotations: Annotation[]) {
    const result = []
    annotations.forEach((annotation: Annotation) => {
      result.push(annotation.sectionId)
    })

    return result;
  }

  clear() {
    this.checklistSelection.clear();
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
            self.doFileSelection(searchCriteria._source, self.treeControl.dataNodes, self.checklistSelection);

          } else {
            alert("wrong file format")
          }
        } catch (exception) {
          alert("invalid file")
        }
      };
    }
  }

  doFileSelection(ids: string[], dataNodes: AnnotationFlatNode[], checklistSelection: SelectionModel<AnnotationFlatNode>) {
    checklistSelection.clear();
    ids.forEach((id: string) => {
      const node = find(dataNodes, { name: id });

      if (node) {
        checklistSelection.select(node);
      }
    });
  }

  getActiveAnnotation() {
    return this.activeAnnotation;
  }

  setActiveAnnotation(annotation: any) {
    this.activeAnnotation = annotation;
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
    const annotations = this.checklistSelection.selected as any[];
    const source = annotations.map((item: AnnotationFlatNode) => {
      return item.name; //item.leaf ? item.name : false;
    }, []);
    if (source.length > 0) {
      this.saveConfig(JSON.stringify({ "_source": source }));
    } else {
    /*   this.confirmDialogService.openConfirmDialog(
        'No Selection Found', 'Select at least one annotation from the tree');
  */   }
  }

  saveConfig(configText: string) {
    var blob = new Blob([configText], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "config.txt");
  }

  makeLabelLookup(annotations: Annotation[]) {
    return annotations.reduce((lookup, annotation) => {
      lookup[annotation.sectionLabel] = annotation
      return lookup
    }, {})
  }

  findDetailByName(name) {
    const found = this.labelLookup[name]
    return found
  }


  private _mapTreeToMatTreeFormat(tree: any[]): any[] {
    return tree.map(section => ({
      label: section.sectionLabel,
      id: section.sectionId,
      type: TreeNodeType.SECTION,
      count: section.categories.length,
      children: section.categories.map(category => ({
        id: category.categoryId,
        label: category.categoryLabel,
        type: TreeNodeType.CATEGORY,
        count: category.modules.length,
        children: category.modules.map(module => ({
          id: module.moduleId,
          label: module.moduleLabel,
          type: TreeNodeType.MODULE,
          count: module.nodes.length
        }))
      }))
    }));
  }

}
